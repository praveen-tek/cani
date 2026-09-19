import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const trimmedName = args.name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) {
      throw new ConvexError("Team name must be between 1 and 50 characters.");
    }

    const teamId = await ctx.db.insert("teams", {
      name: trimmedName,
      ownerId: userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return teamId;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const teams = await Promise.all(
      memberships.map(async (m) => {
        const team = await ctx.db.get(m.teamId);
        if (!team) return null;
        return {
          ...team,
          role: m.role,
          joinedAt: m.joinedAt,
        };
      })
    );

    return teams.filter((t): t is NonNullable<typeof t> => t !== null);
  },
});

export const get = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .unique();

    if (!membership) {
      throw new ConvexError("You are not a member of this team.");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    const allMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const membersWithProfiles = await Promise.all(
      allMembers.map(async (m) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", m.userId))
          .unique();
        const user = await ctx.db.get(m.userId);

        return {
          ...m,
          name: profile?.name || user?.name || "Member",
          email: user?.email,
          image: user?.image,
        };
      })
    );

    return {
      ...team,
      currentRole: membership.role,
      members: membersWithProfiles,
    };
  },
});

export const leave = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .unique();

    if (!membership) {
      throw new ConvexError("You are not a member of this team.");
    }

    if (membership.role === "owner") {
      throw new ConvexError("Team owners cannot leave their team.");
    }

    await ctx.db.delete(membership._id);
    return { success: true };
  },
});
