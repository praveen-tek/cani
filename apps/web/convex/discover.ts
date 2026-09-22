import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { getMarket } from "./lib/markets";
import {
  enforce,
  spendFirecrawl,
  estimateDiscoverCost,
} from "./lib/limits";
import {
  cleanAlsoWorthALookTitle,
  cleanDescription,
  dedupeProducts,
  extractHostname,
  extractProductsFromSearchResult,
  NormalizedProduct,
  normalizeUrl,
  runFirecrawlSearch,
} from "./lib/firecrawl";

export const getProfileForUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const updateLastDiscoverAt = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastDiscoverAt: Date.now(),
      });
    }
  },
});

export const getSearchCache = internalQuery({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("searchCache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

export const setSearchCache = internalMutation({
  args: {
    key: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("searchCache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        payload: args.payload,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert("searchCache", {
        key: args.key,
        payload: args.payload,
        createdAt: Date.now(),
      });
    }
  },
});

export const cleanOldSearchCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
    const oldRows = await ctx.db
      .query("searchCache")
      .filter((q) => q.lt(q.field("createdAt"), fortyEightHoursAgo))
      .take(200);

    for (const row of oldRows) {
      await ctx.db.delete(row._id);
    }
    return { deleted: oldRows.length };
  },
});

export const refreshCreditBalance = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) return;

    const lastRefreshed = await ctx.runQuery(
      internal.mail.getAppConfigInternal,
      {
        key: "firecrawlBalanceRefreshedAt",
      }
    );
    if (
      lastRefreshed &&
      Date.now() - Number(lastRefreshed) < 10 * 60 * 1000
    ) {
      return;
    }

    try {
      const res = await fetch("https://api.firecrawl.dev/v2/team/credit-usage", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const json = await res.json();
        const remaining =
          json?.data?.remainingCredits ?? json?.remainingCredits;
        if (typeof remaining === "number") {
          await ctx.runMutation(internal.mail.setAppConfigInternal, {
            key: "firecrawlRemainingCredits",
            value: String(remaining),
          });
          await ctx.runMutation(internal.mail.setAppConfigInternal, {
            key: "firecrawlBalanceRefreshedAt",
            value: String(Date.now()),
          });
        }
      }
    } catch {
      // Ignore network errors
    }
  },
});

export function normalizeSearchKey(phrase: string, country?: string): string {
  const c = (country || "US").toUpperCase();
  const cleaned = cleanQueryPhrase(phrase)
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${c}:${cleaned}`;
}

const EXCLUDED_OPEN_WEB_DOMAINS = [
  "youtube.com",
  "google.com",
  "reddit.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "pinterest.com",
];

const FILLER_PREFIX_REGEX =
  /^(find\s+me|show\s+me|search\s+for|i\s+want|i\s+need|looking\s+for|can\s+you|please|get\s+me|suggest)\s+/i;

const IGNORED_FILTER_TOKENS = new Set([
  "deals",
  "deal",
  "sale",
  "sales",
  "cheap",
  "under",
  "below",
  "best",
  "buy",
  "with",
  "for",
  "and",
  "the",
]);

function cleanQueryPhrase(input: string): string {
  let cleaned = input.trim();
  let prev = "";
  while (cleaned !== prev) {
    prev = cleaned;
    cleaned = cleaned.replace(FILLER_PREFIX_REGEX, "").trim();
  }
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned || input.trim();
}

function extractKeywordTokens(phrase: string): string[] {
  const words = phrase.toLowerCase().split(/[\s,._\-+/]+/);
  const tokens: string[] = [];

  for (const word of words) {
    const clean = word.replace(/[^a-z0-9]/g, "");
    if (!clean || clean.length < 3) continue;
    if (/^\d+$/.test(clean)) continue;
    if (IGNORED_FILTER_TOKENS.has(clean)) continue;
    tokens.push(clean);
  }

  return Array.from(new Set(tokens));
}

export interface DiscoverResultItem {
  title: string;
  url: string;
  imageUrl?: string;
  price?: number;
  salePrice?: number;
  currency: string;
  onSale: boolean;
  rating?: number;
  source: string;
}

export interface AlsoWorthALookItem {
  title: string;
  url: string;
  source: string;
  description: string;
}

export const search = action({
  args: {
    query: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    items: DiscoverResultItem[];
    alsoWorthALook: AlsoWorthALookItem[];
    stores: Array<{ source: string; count: number }>;
    query: string;
  }> => {
    try {
      const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const profile = await ctx.runQuery(internal.discover.getProfileForUser, {
      userId,
    });

    if (!profile || !profile.onboardingComplete) {
      throw new ConvexError(
        "Please complete your profile onboarding before searching."
      );
    }

    const rawQuery = args.query.trim();
    if (rawQuery.length < 2 || rawQuery.length > 200) {
      throw new ConvexError(
        "Search query must be between 2 and 200 characters."
      );
    }

    await enforce(ctx, "discoverBurst", { key: userId });

    const market = getMarket(profile.country);
    const cleanedPhrase = cleanQueryPhrase(rawQuery);
    const cacheKey = normalizeSearchKey(cleanedPhrase, profile.country);

    const cacheTtlHours = Number(process.env.SEARCH_CACHE_TTL_HOURS ?? 12);
    const cached = await ctx.runQuery(internal.discover.getSearchCache, {
      key: cacheKey,
    });

    if (
      cached &&
      Date.now() - cached.createdAt < cacheTtlHours * 60 * 60 * 1000
    ) {
      console.log(`[Discover] Cache HIT for key=${cacheKey}`);
      try {
        const parsed = JSON.parse(cached.payload);
        return {
          ...parsed,
          query: cleanedPhrase,
        };
      } catch {
        // Fall through on JSON parse failure
      }
    }

    console.log(`[Discover] Cache MISS for key=${cacheKey}`);

    await enforce(ctx, "discoverDaily", { key: userId });
    await spendFirecrawl(ctx, { cost: estimateDiscoverCost() });

    ctx.runAction(internal.discover.refreshCreditBalance, {}).catch(() => {});

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      throw new ConvexError("FIRECRAWL_API_KEY is not configured on Convex.");
    }

    const tokens = extractKeywordTokens(cleanedPhrase);

    console.log("Cleaned phrase:", cleanedPhrase);

    const targetStores = market.stores.slice(0, 3);
    const storeSearches = targetStores.map((store) => {
      const queryString = `site:${store.domain} ${cleanedPhrase}`;
      return {
        type: "store" as const,
        store,
        queryString,
      };
    });

    const openWebQueryString = `${cleanedPhrase} ${market.firecrawlLocation}`;
    const openWebSearch = {
      type: "open-web" as const,
      queryString: openWebQueryString,
    };

    const searchPromises = [
      ...storeSearches.map(async (s) => {
        const { status, results } = await runFirecrawlSearch(
          firecrawlApiKey,
          s.queryString,
          market,
          { limit: 3, scrape: true }
        );
        return {
          type: "store" as const,
          store: s.store,
          queryString: s.queryString,
          status,
          results,
        };
      }),
      (async () => {
        const { status, results } = await runFirecrawlSearch(
          firecrawlApiKey,
          openWebSearch.queryString,
          market,
          { limit: 8, scrape: false }
        );
        return {
          type: "open-web" as const,
          queryString: openWebSearch.queryString,
          status,
          results,
        };
      })(),
    ];

    const settled = await Promise.allSettled(searchPromises);

    const productsPerStore: Record<string, number> = {};
    for (const store of market.stores) {
      productsPerStore[store.domain] = 0;
    }

    const candidateProducts: NormalizedProduct[] = [];
    const openWebAlsoWorthALook: AlsoWorthALookItem[] = [];
    const fallbackAlsoWorthALook: AlsoWorthALookItem[] = [];
    let anySearchSucceeded = false;
    let didRetryStore = false;

    for (const item of settled) {
      if (item.status === "fulfilled") {
        const val = item.value;
        if (val.status >= 200 && val.status < 300) {
          anySearchSucceeded = true;
        }

        console.log(
          `Results per search for "${val.queryString}": ${val.results.length}`
        );

        if (val.type === "store") {
          const storeDomain = val.store.domain;
          let storeProductsFound = 0;

          let storeRawDumped = false;
          for (const res of val.results) {
            const { products, fallback } = extractProductsFromSearchResult(
              res,
              market,
              storeDomain
            );

            // Log per-result extracted product count
            console.log(
              `[Discover] ${storeDomain} result url=${(res.url || "").slice(0, 80)} extracted products=${products.length} fallback=${Boolean(fallback)}`
            );

            // Dump the raw shape of the first result once per store (no API key, no page content)
            if (!storeRawDumped) {
              storeRawDumped = true;
              try {
                const raw = {
                  url: res.url,
                  title: res.title,
                  description: res.description,
                  hasJson: res.json !== undefined,
                  jsonProductsLength: Array.isArray(res.json?.products) ? res.json.products.length : null,
                  firstProduct: Array.isArray(res.json?.products) && res.json.products.length > 0
                    ? {
                        title: res.json.products[0].title,
                        hasUrl: Boolean(res.json.products[0].url),
                        hasImageUrl: Boolean(res.json.products[0].imageUrl),
                        price: res.json.products[0].price,
                        salePrice: res.json.products[0].salePrice,
                        rating: res.json.products[0].rating,
                      }
                    : null,
                  metadataStatusCode: res.metadata?.statusCode,
                  metadataError: res.metadata?.error ?? null,
                  cacheState: res.metadata?.cacheState ?? null,
                };
                console.log(`[Discover] raw first result for ${storeDomain}:`, JSON.stringify(raw));
              } catch {
                // ignore serialization errors
              }
            }

            // All LLM-extracted products go to the grid (they have title + url from schema extraction).
            // Only the fallback (raw search-result page URL) is gated on having an image or price.
            for (const prod of products) {
              candidateProducts.push(prod);
              storeProductsFound++;
            }

            if (products.length === 0) {
              if (fallback) {
                // If fallback recovered an image for a single product page, it can be a grid item
                if (
                  Boolean(fallback.imageUrl) ||
                  fallback.price !== undefined ||
                  fallback.salePrice !== undefined
                ) {
                  candidateProducts.push(fallback);
                  storeProductsFound++;
                } else {
                  // Move fallback into alsoWorthALook
                  const rawUrl = (
                    res.url ||
                    res.metadata?.sourceURL ||
                    fallback.url ||
                    ""
                  ).trim();
                  const rawTitle = (
                    res.title ||
                    res.metadata?.title ||
                    fallback.title ||
                    ""
                  ).trim();
                  const rawDesc = (res.description || res.snippet || "").trim();
                  if (rawUrl && rawTitle) {
                    fallbackAlsoWorthALook.push({
                      title: cleanAlsoWorthALookTitle(rawTitle),
                      url: normalizeUrl(rawUrl),
                      source: storeDomain,
                      description: cleanDescription(rawDesc),
                    });
                  }
                }
              }
            }
          }

          // Optional retry: If zero grid products produced, retry once with residential proxy
          if (storeProductsFound === 0 && !didRetryStore) {
            didRetryStore = true;
            console.log("Retry store search:", storeDomain);
            const retryRes = await runFirecrawlSearch(
              firecrawlApiKey,
              val.queryString,
              market,
              { limit: 3, scrape: true, proxy: "residential" }
            );

            if (retryRes.status >= 200 && retryRes.status < 300) {
              anySearchSucceeded = true;
            }

            for (const res of retryRes.results) {
              const { products, fallback } = extractProductsFromSearchResult(
                res,
                market,
                storeDomain
              );

              console.log(
                `[Discover] retry ${storeDomain} url=${(res.url || "").slice(0, 80)} extracted=${products.length} fallback=${Boolean(fallback)}`
              );

              // All LLM-extracted products go to the grid (same rule as initial pass)
              for (const prod of products) {
                candidateProducts.push(prod);
                storeProductsFound++;
              }

              if (products.length === 0 && fallback) {
                if (
                  Boolean(fallback.imageUrl) ||
                  fallback.price !== undefined ||
                  fallback.salePrice !== undefined
                ) {
                  candidateProducts.push(fallback);
                  storeProductsFound++;
                } else {
                  const rawUrl = (
                    res.url ||
                    res.metadata?.sourceURL ||
                    fallback.url ||
                    ""
                  ).trim();
                  const rawTitle = (
                    res.title ||
                    res.metadata?.title ||
                    fallback.title ||
                    ""
                  ).trim();
                  const rawDesc = (res.description || res.snippet || "").trim();
                  if (rawUrl && rawTitle) {
                    fallbackAlsoWorthALook.push({
                      title: cleanAlsoWorthALookTitle(rawTitle),
                      url: normalizeUrl(rawUrl),
                      source: storeDomain,
                      description: cleanDescription(rawDesc),
                    });
                  }
                }
              }
            }
          }

          productsPerStore[storeDomain] = storeProductsFound;
        } else if (val.type === "open-web") {
          for (const res of val.results) {
            const rUrl = (res.url || res.metadata?.sourceURL || "").trim();
            const rTitle = (res.title || res.metadata?.title || "").trim();
            const rDesc = (res.description || res.snippet || "").trim();
            if (!rUrl || !rTitle) continue;

            const hostname = extractHostname(rUrl);
            const isBlocked =
              EXCLUDED_OPEN_WEB_DOMAINS.some(
                (d) => hostname === d || hostname.endsWith(`.${d}`)
              ) ||
              market.stores.some((s) => {
                const cleanStore = s.domain
                  .replace(/^www\./, "")
                  .replace(/^m\./, "");
                return hostname === cleanStore || hostname.endsWith(`.${cleanStore}`);
              });

            if (isBlocked) continue;

            openWebAlsoWorthALook.push({
              title: cleanAlsoWorthALookTitle(rTitle),
              url: normalizeUrl(rUrl),
              source: hostname,
              description: cleanDescription(rDesc),
            });
          }
        }
      }
    }

    console.log("Products per store:", productsPerStore);

    // Build alsoWorthALook: max 5 entries, filling first with open-web results then fallbacks, skipping duplicates
    const alsoWorthALookCandidates: AlsoWorthALookItem[] = [];
    const seenAlsoUrls = new Set<string>();

    for (const item of openWebAlsoWorthALook) {
      if (alsoWorthALookCandidates.length >= 5) break;
      if (!seenAlsoUrls.has(item.url)) {
        seenAlsoUrls.add(item.url);
        alsoWorthALookCandidates.push(item);
      }
    }

    for (const item of fallbackAlsoWorthALook) {
      if (alsoWorthALookCandidates.length >= 5) break;
      if (!seenAlsoUrls.has(item.url)) {
        seenAlsoUrls.add(item.url);
        alsoWorthALookCandidates.push(item);
      }
    }

    const dedupedProducts = dedupeProducts(candidateProducts);

    const filteredProducts =
      tokens.length > 0
        ? dedupedProducts.filter((p) => {
            const titleLower = p.title.toLowerCase();
            return tokens.some((token) => titleLower.includes(token));
          })
        : dedupedProducts;

    const productsToScore =
      filteredProducts.length > 0 ? filteredProducts : dedupedProducts;

    const countMatchedTokens = (title: string): number => {
      if (tokens.length === 0) return 0;
      const titleLower = title.toLowerCase();
      let matches = 0;
      for (const token of tokens) {
        if (titleLower.includes(token)) {
          matches++;
        }
      }
      return matches;
    };

    productsToScore.sort((a, b) => {
      const matchA = countMatchedTokens(a.title);
      const matchB = countMatchedTokens(b.title);
      if (matchB !== matchA) {
        return matchB - matchA;
      }

      const aHasPrice =
        a.price !== undefined || a.salePrice !== undefined ? 1 : 0;
      const bHasPrice =
        b.price !== undefined || b.salePrice !== undefined ? 1 : 0;
      if (bHasPrice !== aHasPrice) {
        return bHasPrice - aHasPrice;
      }

      const aOnSale = a.onSale ? 1 : 0;
      const bOnSale = b.onSale ? 1 : 0;
      if (bOnSale !== aOnSale) {
        return bOnSale - aOnSale;
      }

      const aRating = a.rating ?? 0;
      const bRating = b.rating ?? 0;
      return bRating - aRating;
    });

    const storeItemCount: Record<string, number> = {};
    const finalItems: DiscoverResultItem[] = [];

    for (const p of productsToScore) {
      const currentStoreCount = storeItemCount[p.source] || 0;
      if (currentStoreCount < 8) {
        storeItemCount[p.source] = currentStoreCount + 1;
        finalItems.push({
          title: p.title,
          url: p.url,
          imageUrl: p.imageUrl,
          price: p.price,
          salePrice: p.salePrice,
          currency: p.currency,
          onSale: p.onSale,
          rating: p.rating,
          source: p.source,
        });
        if (finalItems.length >= 24) {
          break;
        }
      }
    }

    console.log("Final count:", finalItems.length);

    if (
      !anySearchSucceeded ||
      (finalItems.length === 0 && alsoWorthALookCandidates.length === 0)
    ) {
      throw new ConvexError("No results found. Try a different phrase.");
    }

    const storesSummary = Object.entries(storeItemCount)
      .filter(([_, count]) => count > 0)
      .map(([source, count]) => ({ source, count }));

    const result = {
      items: finalItems,
      alsoWorthALook: alsoWorthALookCandidates.slice(0, 5),
      stores: storesSummary,
      query: cleanedPhrase,
    };

    if (finalItems.length > 0) {
      try {
        const payloadStr = JSON.stringify(result);
        if (payloadStr.length < 500 * 1024) {
          await ctx.runMutation(internal.discover.setSearchCache, {
            key: cacheKey,
            payload: payloadStr,
          });
        }
      } catch {
        // Skip caching on stringify error
      }
    }

      return result;
    } catch (err) {
      if (err instanceof ConvexError) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[discover:search] error: ${msg}`);
      throw new ConvexError("Something went wrong on our side. Please try again.");
    }
  },
});
