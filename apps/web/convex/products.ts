import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { getMarket } from "./lib/markets";
import { requireMember } from "./lib/membership";
import {
  enforce,
  spendFirecrawl,
  estimateAddByUrlCost,
} from "./lib/limits";

export const getExistingProductByUrl = internalQuery({
  args: {
    teamId: v.id("teams"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_team_and_url", (q) =>
        q.eq("teamId", args.teamId).eq("url", args.url)
      )
      .unique();
  },
});

export const getRoomProductCount = internalQuery({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    return products.length;
  },
});

export const checkMembership = internalQuery({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.userId)
      )
      .unique();
    return Boolean(membership);
  },
});

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

export const insertProductInternal = internalMutation({
  args: {
    teamId: v.id("teams"),
    addedBy: v.id("users"),
    title: v.string(),
    url: v.string(),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    currency: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.addedBy)
      )
      .unique();

    if (!membership) {
      throw new ConvexError("Not a member of this room");
    }
    const existing = await ctx.db
      .query("products")
      .withIndex("by_team_and_url", (q) =>
        q.eq("teamId", args.teamId).eq("url", args.url)
      )
      .unique();

    if (existing) {
      return { productId: existing._id, alreadyExisted: true };
    }

    const productId = await ctx.db.insert("products", {
      teamId: args.teamId,
      addedBy: args.addedBy,
      title: args.title,
      url: args.url,
      imageUrl: args.imageUrl,
      price: args.price,
      salePrice: args.salePrice,
      currency: args.currency || "USD",
      source: args.source,
      createdAt: Date.now(),
    });

    return { productId, alreadyExisted: false };
  },
});

export const addByUrl = action({
  args: {
    teamId: v.id("teams"),
    url: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ productId: string; alreadyExisted: boolean; scraped: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const isMember = await ctx.runQuery(internal.products.checkMembership, {
      teamId: args.teamId,
      userId,
    });
    if (!isMember) {
      throw new ConvexError("Not a member of this room");
    }

    let validUrl: URL;
    try {
      validUrl = new URL(args.url.trim());
      if (validUrl.protocol !== "http:" && validUrl.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
    } catch {
      throw new ConvexError("Please provide a valid HTTP or HTTPS product link.");
    }

    const urlString = validUrl.toString();

    const existing = await ctx.runQuery(
      internal.products.getExistingProductByUrl,
      {
        teamId: args.teamId,
        url: urlString,
      }
    );
    if (existing) {
      return { productId: existing._id, alreadyExisted: true, scraped: true };
    }

    const productCount = await ctx.runQuery(
      internal.products.getRoomProductCount,
      {
        teamId: args.teamId,
      }
    );
    if (productCount >= 100) {
      throw new ConvexError("This room has reached the maximum of 100 products.");
    }

    const cleanHostname = validUrl.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    let title = cleanHostname;
    let imageUrl: string | undefined;
    let price: number | undefined;
    let salePrice: number | undefined;
    let currency: string | undefined;
    const source = cleanHostname;
    let scraped = false;

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (firecrawlApiKey) {
      try {
        await enforce(ctx, "addByUrlHourly", { key: userId });
        await enforce(ctx, "addByUrlDaily", { key: userId });
        await spendFirecrawl(ctx, { cost: estimateAddByUrlCost() });

        const profile = await ctx.runQuery(internal.products.getProfileForUser, {
          userId,
        });
        const market = getMarket(profile?.country);
        currency = market.currency;

        const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: urlString,
            formats: [
              {
                type: "json",
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    imageUrl: { type: "string" },
                    price: { type: "number" },
                    salePrice: { type: "number" },
                    currency: { type: "string" },
                    rating: { type: "number" },
                  },
                  required: ["title"],
                },
                prompt:
                  "extract the product visible on this page with its title, image url, its current selling price and its original price as plain numbers, currency, and its rating. Only use what is on the page.",
              },
            ],
            onlyMainContent: true,
            waitFor: 1500,
            blockAds: true,
            maxAge: 21600000,
            location: {
              country: market.firecrawlCountry,
              languages: market.languages,
            },
            proxy: "auto",
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const scrapedData =
            json?.data?.json ||
            json?.data?.extract ||
            json?.data?.formats?.json ||
            json?.json ||
            {};

          if (typeof scrapedData.title === "string" && scrapedData.title.trim().length >= 2) {
            title = scrapedData.title.trim();
            scraped = true;
          } else if (typeof json?.data?.metadata?.title === "string" && json.data.metadata.title.trim()) {
            title = json.data.metadata.title.trim();
            scraped = true;
          }

          if (typeof scrapedData.imageUrl === "string" && scrapedData.imageUrl.trim()) {
            imageUrl = scrapedData.imageUrl.trim();
          } else if (json?.data?.metadata?.ogImage || json?.data?.metadata?.image) {
            imageUrl = json.data.metadata.ogImage || json.data.metadata.image;
          }

          const parsedPrice =
            typeof scrapedData.price === "number" && !isNaN(scrapedData.price) ? scrapedData.price : undefined;
          const parsedSalePrice =
            typeof scrapedData.salePrice === "number" && !isNaN(scrapedData.salePrice) ? scrapedData.salePrice : undefined;

          if (parsedPrice !== undefined && parsedSalePrice !== undefined) {
            if (parsedSalePrice < parsedPrice) {
              price = parsedPrice;
              salePrice = parsedSalePrice;
            } else {
              price = parsedPrice;
              salePrice = undefined;
            }
          } else if (parsedPrice === undefined && parsedSalePrice !== undefined) {
            price = parsedSalePrice;
            salePrice = undefined;
          } else {
            price = parsedPrice;
          }

          if (typeof scrapedData.currency === "string" && scrapedData.currency.trim()) {
            currency = scrapedData.currency.trim();
          }
        }
      } catch {
        // Fallback already prepared with hostname as title (scraped: false)
      }
    }

    const inserted = await ctx.runMutation(internal.products.insertProductInternal, {
      teamId: args.teamId,
      addedBy: userId,
      title,
      url: urlString,
      imageUrl,
      price,
      salePrice,
      currency: currency || "USD",
      source,
    });

    return {
      productId: inserted.productId,
      alreadyExisted: inserted.alreadyExisted,
      scraped,
    };
  },
});

export const addToTeam = mutation({
  args: {
    teamId: v.id("teams"),
    suggestionId: v.optional(v.id("suggestions")),
    customProduct: v.optional(
      v.object({
        title: v.string(),
        url: v.string(),
        imageUrl: v.optional(v.string()),
        price: v.optional(v.number()),
        salePrice: v.optional(v.number()),
        currency: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.teamId);

    const roomProducts = await ctx.db
      .query("products")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (roomProducts.length >= 100) {
      throw new ConvexError("This room has reached the maximum of 100 products.");
    }

    await enforce(ctx, "addToRoomHourly", { key: userId });

    let title = "";
    let url = "";
    let imageUrl: string | undefined;
    let price: number | undefined;
    let salePrice: number | undefined;
    let currency: string | undefined = "USD";
    let source = "web";

    if (args.suggestionId) {
      const suggestion = await ctx.db.get(args.suggestionId);
      if (!suggestion) {
        throw new ConvexError("Suggestion not found");
      }
      title = suggestion.title;
      url = suggestion.url;
      imageUrl = suggestion.imageUrl;
      price = suggestion.price;
      salePrice = suggestion.salePrice;
      currency = suggestion.currency;
      source = suggestion.source;
    } else if (args.customProduct) {
      title = args.customProduct.title.trim();
      url = args.customProduct.url.trim();
      imageUrl = args.customProduct.imageUrl;
      price = args.customProduct.price;
      salePrice = args.customProduct.salePrice;
      currency = args.customProduct.currency || "USD";
      try {
        source = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        source = "web";
      }
    } else {
      throw new ConvexError("Must provide either a suggestionId or product details.");
    }

    if (!title || !url) {
      throw new ConvexError("Product must have a title and URL.");
    }

    const existing = await ctx.db
      .query("products")
      .withIndex("by_team_and_url", (q) =>
        q.eq("teamId", args.teamId).eq("url", url)
      )
      .unique();

    if (existing) {
      return { productId: existing._id, alreadyExisted: true };
    }

    const productId = await ctx.db.insert("products", {
      teamId: args.teamId,
      addedBy: userId,
      title,
      url,
      imageUrl,
      price,
      salePrice,
      currency,
      source,
      createdAt: Date.now(),
    });

    return { productId, alreadyExisted: false };
  },
});

export const listForTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.teamId);

    const products = await ctx.db
      .query("products")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const productsWithVotes = await Promise.all(
      products.map(async (product) => {
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_product", (q) => q.eq("productId", product._id))
          .collect();

        let score = 0;
        let upvotes = 0;
        let downvotes = 0;
        let myVote: 1 | -1 | null = null;

        for (const vRecord of votes) {
          score += vRecord.value;
          if (vRecord.value === 1) {
            upvotes += 1;
          } else if (vRecord.value === -1) {
            downvotes += 1;
          }
          if (vRecord.userId === userId) {
            myVote = vRecord.value;
          }
        }

        const addedByProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", product.addedBy))
          .unique();
        const addedByUser = await ctx.db.get(product.addedBy);

        return {
          ...product,
          score,
          upvotes,
          downvotes,
          myVote,
          addedByName: addedByProfile?.name || addedByUser?.name || "Team Member",
        };
      })
    );

    return productsWithVotes.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.createdAt - a.createdAt;
    });
  },
});

export const remove = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError("Product not found");
    }

    const { userId, role } = await requireMember(ctx, product.teamId);

    const isCreator = product.addedBy === userId;
    const isOwner = role === "owner";

    if (!isCreator && !isOwner) {
      throw new ConvexError("Only the person who added this product or the team owner can remove it.");
    }

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_product", (q) => q.eq("productId", product._id))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    await ctx.db.delete(product._id);
    return { success: true };
  },
});

