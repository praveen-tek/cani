import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { getMarket } from "./lib/markets";
import {
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

    if (profile.lastDiscoverAt && Date.now() - profile.lastDiscoverAt < 5000) {
      throw new ConvexError("Please wait a few seconds before searching again.");
    }

    await ctx.runMutation(internal.discover.updateLastDiscoverAt, { userId });

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      throw new ConvexError("FIRECRAWL_API_KEY is not configured on Convex.");
    }

    const market = getMarket(profile.country);
    const cleanedPhrase = cleanQueryPhrase(rawQuery);
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
    const alsoWorthALookCandidates: AlsoWorthALookItem[] = [];
    let totalSearchResultsCount = 0;
    let anySearchSucceeded = false;

    for (const item of settled) {
      if (item.status === "fulfilled") {
        const val = item.value;
        if (val.status >= 200 && val.status < 300) {
          anySearchSucceeded = true;
        }

        console.log(
          `Results per search for "${val.queryString}": ${val.results.length}`
        );
        totalSearchResultsCount += val.results.length;

        if (val.type === "store") {
          const storeDomain = val.store.domain;
          for (const res of val.results) {
            const { products, fallback } = extractProductsFromSearchResult(
              res,
              market,
              storeDomain
            );

            if (products.length > 0) {
              candidateProducts.push(...products);
              productsPerStore[storeDomain] =
                (productsPerStore[storeDomain] || 0) + products.length;
            } else if (fallback) {
              candidateProducts.push(fallback);
              productsPerStore[storeDomain] =
                (productsPerStore[storeDomain] || 0) + 1;
            }
          }
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

            alsoWorthALookCandidates.push({
              title: rTitle,
              url: normalizeUrl(rUrl),
              source: hostname,
              description: rDesc,
            });

            if (alsoWorthALookCandidates.length >= 5) {
              break;
            }
          }
        }
      }
    }

    console.log("Products per store:", productsPerStore);

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

    return {
      items: finalItems,
      alsoWorthALook: alsoWorthALookCandidates.slice(0, 5),
      stores: storesSummary,
      query: cleanedPhrase,
    };
  },
});
