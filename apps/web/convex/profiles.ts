import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { getMarket } from "./lib/markets";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const setEmailAlerts = mutation({
  args: {
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new ConvexError("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      emailAlerts: args.enabled,
    });

    return { success: true, emailAlerts: args.enabled };
  },
});

export const saveOnboarding = mutation({
  args: {
    name: v.string(),
    age: v.number(),
    interests: v.array(v.string()),
    lookingFor: v.string(),
    country: v.optional(v.string()),
    countrySource: v.optional(v.union(v.literal("auto"), v.literal("user"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const trimmedName = args.name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 60) {
      throw new ConvexError("Name must be between 1 and 60 characters.");
    }

    if (!Number.isInteger(args.age) || args.age < 13 || args.age > 120) {
      throw new ConvexError("Age must be an integer between 13 and 120.");
    }

    if (args.interests.length < 1 || args.interests.length > 15) {
      throw new ConvexError("Please provide between 1 and 15 interests.");
    }

    const cleanedInterests = args.interests.map((i) => i.trim()).filter(Boolean);
    for (const interest of cleanedInterests) {
      if (interest.length < 1 || interest.length > 30) {
        throw new ConvexError("Each interest must be between 1 and 30 characters.");
      }
    }

    const trimmedLookingFor = args.lookingFor.trim();
    if (trimmedLookingFor.length < 1 || trimmedLookingFor.length > 300) {
      throw new ConvexError("Looking for description must be between 1 and 300 characters.");
    }

    const targetCountry = (args.country === "IN" || args.country === "US") ? args.country : "US";
    const market = getMarket(targetCountry);
    const countrySource = args.countrySource || "auto";

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: trimmedName,
        age: args.age,
        interests: cleanedInterests,
        lookingFor: trimmedLookingFor,
        country: targetCountry,
        currency: market.currency,
        countrySource,
        onboardingComplete: true,
      });
      return existing._id;
    }

    return await ctx.db.insert("profiles", {
      userId,
      name: trimmedName,
      age: args.age,
      interests: cleanedInterests,
      lookingFor: trimmedLookingFor,
      country: targetCountry,
      currency: market.currency,
      countrySource,
      onboardingComplete: true,
    });
  },
});

export const setCountry = mutation({
  args: {
    country: v.union(v.literal("IN"), v.literal("US")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new ConvexError("Profile not found");
    }

    const market = getMarket(args.country);
    await ctx.db.patch(profile._id, {
      country: args.country,
      currency: market.currency,
      countrySource: "user",
    });

    return { success: true, country: args.country, currency: market.currency };
  },
});

export const autoSetCountry = mutation({
  args: {
    country: v.union(v.literal("IN"), v.literal("US")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      return { skipped: true };
    }

    if (!profile.country) {
      const market = getMarket(args.country);
      await ctx.db.patch(profile._id, {
        country: args.country,
        currency: market.currency,
        countrySource: "auto",
      });
      return { updated: true, country: args.country, currency: market.currency };
    }

    return { skipped: true };
  },
});

export const update = mutation({
  args: {
    name: v.string(),
    age: v.number(),
    interests: v.array(v.string()),
    lookingFor: v.string(),
    country: v.optional(v.union(v.literal("IN"), v.literal("US"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const trimmedName = args.name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 60) {
      throw new ConvexError("Name must be between 1 and 60 characters.");
    }

    if (!Number.isInteger(args.age) || args.age < 13 || args.age > 120) {
      throw new ConvexError("Age must be an integer between 13 and 120.");
    }

    const cleanedInterests = args.interests.map((i) => i.trim()).filter(Boolean);
    if (cleanedInterests.length < 1 || cleanedInterests.length > 15) {
      throw new ConvexError("Please provide between 1 and 15 interests.");
    }

    for (const interest of cleanedInterests) {
      if (interest.length < 1 || interest.length > 30) {
        throw new ConvexError("Each interest must be between 1 and 30 characters.");
      }
    }

    const trimmedLookingFor = args.lookingFor.trim();
    if (trimmedLookingFor.length < 1 || trimmedLookingFor.length > 300) {
      throw new ConvexError("Looking for description must be between 1 and 300 characters.");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new ConvexError("Profile not found");
    }

    const patchData: {
      name: string;
      age: number;
      interests: string[];
      lookingFor: string;
      country?: "IN" | "US";
      currency?: string;
      countrySource?: "user";
    } = {
      name: trimmedName,
      age: args.age,
      interests: cleanedInterests,
      lookingFor: trimmedLookingFor,
    };

    if (args.country) {
      patchData.country = args.country;
      patchData.currency = getMarket(args.country).currency;
      patchData.countrySource = "user";
    }

    await ctx.db.patch(profile._id, patchData);

    const user = await ctx.db.get(userId);
    if (user && user.name !== trimmedName) {
      await ctx.db.patch(userId, { name: trimmedName });
    }

    return { success: true };
  },
});

export const clearSuggestions = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const item of suggestions) {
      await ctx.db.delete(item._id);
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastSuggestedAt: undefined,
      });
    }

    return { count: suggestions.length };
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    // 1. Delete profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile) {
      await ctx.db.delete(profile._id);
    }

    // 2. Delete user's suggestions
    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const s of suggestions) {
      await ctx.db.delete(s._id);
    }

    // 3. Delete user's votes
    const userVotes = await ctx.db
      .query("votes")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const v of userVotes) {
      await ctx.db.delete(v._id);
    }

    // 3b. Delete user's monitors & alerts
    const userMonitors = await ctx.db
      .query("monitors")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const m of userMonitors) {
      await ctx.db.delete(m._id);
    }

    const userAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const a of userAlerts) {
      await ctx.db.delete(a._id);
    }

    // 4. Handle teams
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const m of memberships) {
      if (m.role === "owner") {
        const teamProducts = await ctx.db
          .query("products")
          .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
          .collect();
        for (const p of teamProducts) {
          const productVotes = await ctx.db
            .query("votes")
            .withIndex("by_product", (q) => q.eq("productId", p._id))
            .collect();
          for (const pv of productVotes) {
            await ctx.db.delete(pv._id);
          }
          await ctx.db.delete(p._id);
        }

        const invites = await ctx.db
          .query("invites")
          .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
          .collect();
        for (const inv of invites) {
          await ctx.db.delete(inv._id);
        }

        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
          .collect();
        for (const mem of members) {
          await ctx.db.delete(mem._id);
        }

        await ctx.db.delete(m.teamId);
      } else {
        await ctx.db.delete(m._id);
      }
    }

    // 5. Delete auth accounts & sessions
    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const acc of authAccounts) {
      await ctx.db.delete(acc._id);
    }

    const authSessions = await ctx.db
      .query("authSessions")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const sess of authSessions) {
      await ctx.db.delete(sess._id);
    }

    // 6. Delete user
    await ctx.db.delete(userId);

    return { success: true };
  },
});
