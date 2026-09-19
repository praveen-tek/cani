import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { getMarket, StoreConfig } from "./lib/markets";
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

export const replaceForUser = internalMutation({
  args: {
    userId: v.id("users"),
    items: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        imageUrl: v.optional(v.string()),
        price: v.optional(v.number()),
        salePrice: v.optional(v.number()),
        currency: v.optional(v.string()),
        source: v.string(),
        onSale: v.boolean(),
        reason: v.optional(v.string()),
        rating: v.optional(v.number()),
        country: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("suggestions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    const now = Date.now();
    for (const item of args.items) {
      await ctx.db.insert("suggestions", {
        userId: args.userId,
        title: item.title,
        url: item.url,
        imageUrl: item.imageUrl,
        price: item.price,
        salePrice: item.salePrice,
        currency: item.currency || "USD",
        source: item.source,
        onSale: item.onSale,
        reason: item.reason,
        rating: item.rating,
        country: item.country,
        generatedAt: now,
      });
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastSuggestedAt: now,
      });
    }
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return suggestions
      .sort((a, b) => b.generatedAt - a.generatedAt)
      .slice(0, 20);
  },
});

interface KeywordTarget {
  keyword: string;
  type: "interest" | "lookingFor";
  value: string;
}

interface PlannedQuery {
  queryString: string;
  store?: StoreConfig;
  keywordTarget: KeywordTarget;
}

export const generate = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const profile = await ctx.runQuery(internal.suggestions.getProfileForUser, {
      userId,
    });

    if (!profile || !profile.onboardingComplete) {
      throw new ConvexError(
        "Please complete your profile onboarding before generating suggestions."
      );
    }

    if (
      profile.lastSuggestedAt &&
      Date.now() - profile.lastSuggestedAt < 10 * 60 * 1000
    ) {
      const waitMinutes = Math.ceil(
        (10 * 60 * 1000 - (Date.now() - profile.lastSuggestedAt)) / 60000
      );
      throw new ConvexError(
        `Suggestions were recently generated. Please wait ${waitMinutes} minute${waitMinutes > 1 ? "s" : ""} before generating again.`
      );
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      throw new ConvexError("FIRECRAWL_API_KEY is not configured on Convex.");
    }

    const market = getMarket(profile.country);

    const keywordTargets: KeywordTarget[] = [];
    if (profile.lookingFor && profile.lookingFor.trim()) {
      keywordTargets.push({
        keyword: profile.lookingFor.trim(),
        type: "lookingFor",
        value: profile.lookingFor.trim(),
      });
    }

    const interests = (profile.interests || [])
      .map((i: string) => i.trim())
      .filter(Boolean)
      .slice(0, 2);

    for (const interest of interests) {
      keywordTargets.push({
        keyword: interest,
        type: "interest",
        value: interest,
      });
    }

    if (keywordTargets.length === 0) {
      keywordTargets.push({
        keyword: "deals",
        type: "lookingFor",
        value: "deals",
      });
    }

    const targetStores = market.stores.slice(0, 3);
    const plannedQueries: PlannedQuery[] = targetStores.map((store, i) => {
      const target = keywordTargets[i % keywordTargets.length];
      return {
        queryString: `site:${store.domain} ${target.keyword} deals`,
        store,
        keywordTarget: target,
      };
    });

    if (keywordTargets.length > targetStores.length && market.stores.length > 3) {
      const store = market.stores[3];
      const target = keywordTargets[3 % keywordTargets.length];
      plannedQueries.push({
        queryString: `site:${store.domain} ${target.keyword} deals`,
        store,
        keywordTarget: target,
      });
    }

    console.log(
      "Queries built:",
      plannedQueries.map((q) => q.queryString)
    );

    const searchPromises = plannedQueries.map(async (plan) => {
      const { status, results } = await runFirecrawlSearch(
        firecrawlApiKey,
        plan.queryString,
        market,
        { limit: 3, scrape: true }
      );
      return {
        plan,
        status,
        results,
      };
    });

    const settled = await Promise.allSettled(searchPromises);

    const productsExtractedPerStore: Record<string, number> = {};
    for (const store of market.stores) {
      productsExtractedPerStore[store.domain] = 0;
    }

    const candidateProducts: NormalizedProduct[] = [];
    const fallbackCandidates: NormalizedProduct[] = [];
    let totalSearchResultsCount = 0;
    let anySearchSucceeded = false;

    for (const item of settled) {
      if (item.status === "fulfilled") {
        const { plan, status, results } = item.value;
        if (status >= 200 && status < 300) {
          anySearchSucceeded = true;
        }

        console.log(
          `Results per search for "${plan.queryString}": ${results.length}`
        );
        totalSearchResultsCount += results.length;

        const reason =
          plan.keywordTarget.type === "interest"
            ? `Matches your interest in ${plan.keywordTarget.value}`
            : "Matches what you are looking for";

        for (const searchResult of results) {
          const resultSource =
            plan.store?.domain ||
            extractHostname(
              searchResult.url || searchResult.metadata?.sourceURL || ""
            );
          const { products, fallback } = extractProductsFromSearchResult(
            searchResult,
            market,
            resultSource,
            reason
          );

          if (products.length > 0) {
            candidateProducts.push(...products);
            productsExtractedPerStore[resultSource] =
              (productsExtractedPerStore[resultSource] || 0) + products.length;
          } else if (fallback) {
            fallbackCandidates.push(fallback);
          }
        }
      }
    }

    console.log("Products extracted per store:", productsExtractedPerStore);

    let allItems = dedupeProducts([
      ...candidateProducts,
      ...fallbackCandidates,
    ]);
    let fallbackCount = fallbackCandidates.length;

    if (allItems.length < 4) {
      const extraTarget = keywordTargets[0];
      const extraQuery = `${extraTarget.keyword} deals`;
      console.log(`Fallback extra search query: "${extraQuery}"`);
      const extraRes = await runFirecrawlSearch(
        firecrawlApiKey,
        extraQuery,
        market,
        { limit: 3, scrape: true }
      );
      if (extraRes.status >= 200 && extraRes.status < 300) {
        anySearchSucceeded = true;
      }
      totalSearchResultsCount += extraRes.results.length;

      const reason =
        extraTarget.type === "interest"
          ? `Matches your interest in ${extraTarget.value}`
          : "Matches what you are looking for";

      const extraItems: NormalizedProduct[] = [];
      for (const r of extraRes.results) {
        const { products, fallback } = extractProductsFromSearchResult(
          r,
          market,
          undefined,
          reason
        );
        if (products.length > 0) {
          extraItems.push(...products);
        } else if (fallback) {
          extraItems.push(fallback);
        }
      }
      fallbackCount += extraItems.length;
      allItems = dedupeProducts([...allItems, ...extraItems]);
    }

    console.log("Items from fallback:", fallbackCount);

    if (
      !anySearchSucceeded ||
      totalSearchResultsCount === 0 ||
      allItems.length === 0
    ) {
      throw new ConvexError(
        "Search returned no results. Try again in a minute."
      );
    }

    const storePriorityIndex = (source: string) => {
      const index = market.stores.findIndex((s) =>
        source.includes(s.domain.replace(/^www\./, "").replace(/^m\./, ""))
      );
      return index === -1 ? 999 : index;
    };

    allItems.sort((a, b) => {
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
      if (bRating !== aRating) {
        return bRating - aRating;
      }

      return storePriorityIndex(a.source) - storePriorityIndex(b.source);
    });

    const storeCount: Record<string, number> = {};
    const finalItems: NormalizedProduct[] = [];

    for (const item of allItems) {
      const s = item.source;
      const currentCount = storeCount[s] || 0;
      if (currentCount < 5) {
        storeCount[s] = currentCount + 1;
        finalItems.push(item);
        if (finalItems.length >= 12) {
          break;
        }
      }
    }

    console.log("Final count:", finalItems.length);

    await ctx.runMutation(internal.suggestions.replaceForUser, {
      userId,
      items: finalItems,
    });

    return { count: finalItems.length };
  },
});


