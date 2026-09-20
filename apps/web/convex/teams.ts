import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { requireMember } from "./lib/membership";
import { enforce } from "./lib/limits";

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

    const ownedTeams = await ctx.db
      .query("teams")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .filter((q) => q.eq(q.field("archivedAt"), undefined))
      .collect();

    if (ownedTeams.length >= 10) {
      throw new ConvexError("You have reached the limit of 10 rooms.");
    }

    await enforce(ctx, "roomCreateHourly", { key: userId });

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
        // Exclude archived teams from the active list
        if (team.archivedAt !== undefined) return null;
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

export const listArchived = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const teams = await Promise.all(
      memberships.map(async (m) => {
        const team = await ctx.db.get(m.teamId);
        if (!team) return null;
        if (team.archivedAt === undefined) return null;
        return {
          ...team,
          role: m.role,
          joinedAt: m.joinedAt,
        };
      })
    );

    return teams
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
  },
});

export const get = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const { role } = await requireMember(ctx, args.teamId);

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
      currentRole: role,
      members: membersWithProfiles,
    };
  },
});

export const leave = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const { userId, role } = await requireMember(ctx, args.teamId);

    if (role === "owner") {
      throw new ConvexError("Team owners cannot leave their team.");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .unique();

    if (membership) {
      await ctx.db.delete(membership._id);
    }
    return { success: true };
  },
});

export const archive = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const { role } = await requireMember(ctx, args.teamId);
    if (role !== "owner") {
      throw new ConvexError("Only owners can archive a room.");
    }
    await ctx.db.patch(args.teamId, { archivedAt: Date.now() });
    return { success: true };
  },
});

export const restore = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const { role } = await requireMember(ctx, args.teamId);
    if (role !== "owner") {
      throw new ConvexError("Only owners can restore a room.");
    }
    await ctx.db.patch(args.teamId, { archivedAt: undefined });
    return { success: true };
  },
});

export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const { role } = await requireMember(ctx, args.teamId);
    if (role !== "owner") {
      throw new ConvexError("Only owners can delete a room.");
    }

    // Delete votes
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete products
    const products = await ctx.db
      .query("products")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const product of products) {
      await ctx.db.delete(product._id);
    }

    // Delete invites
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    // Delete members
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete team
    await ctx.db.delete(args.teamId);
    return { success: true };
  },
});
