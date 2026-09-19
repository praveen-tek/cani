import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

function generateInviteCode(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const create = mutation({
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
      throw new ConvexError("Only team members can create invites.");
    }

    const code = generateInviteCode();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const inviteId = await ctx.db.insert("invites", {
      teamId: args.teamId,
      code,
      createdBy: userId,
      expiresAt,
      maxUses: 20,
      uses: 0,
      revoked: false,
    });

    return { inviteId, code };
  },
});

export const revoke = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new ConvexError("Invite not found");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", invite.teamId).eq("userId", userId)
      )
      .unique();

    if (!membership || membership.role !== "owner") {
      throw new ConvexError("Only team owners can revoke invites.");
    }

    await ctx.db.patch(args.inviteId, { revoked: true });
    return { success: true };
  },
});

export const preview = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedCode = args.code.trim();
    if (!trimmedCode) {
      return { status: "invalid" as const, teamName: null, memberCount: 0 };
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", trimmedCode))
      .unique();

    if (!invite) {
      return { status: "invalid" as const, teamName: null, memberCount: 0 };
    }

    if (invite.revoked) {
      return { status: "revoked" as const, teamName: null, memberCount: 0 };
    }

    if (Date.now() > invite.expiresAt) {
      return { status: "expired" as const, teamName: null, memberCount: 0 };
    }

    if (invite.uses >= invite.maxUses) {
      return { status: "full" as const, teamName: null, memberCount: 0 };
    }

    const team = await ctx.db.get(invite.teamId);
    if (!team) {
      return { status: "invalid" as const, teamName: null, memberCount: 0 };
    }

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", invite.teamId))
      .collect();

    return {
      status: "valid" as const,
      teamName: team.name,
      memberCount: members.length,
      teamId: team._id,
    };
  },
});

export const accept = mutation({
  args: {
    code: v.string(),
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

    if (!profile || !profile.onboardingComplete) {
      throw new ConvexError("Please complete your onboarding profile before joining a team.");
    }

    const trimmedCode = args.code.trim();
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", trimmedCode))
      .unique();

    if (!invite) {
      throw new ConvexError("Invalid invite link.");
    }

    if (invite.revoked) {
      throw new ConvexError("This invite has been revoked.");
    }

    if (Date.now() > invite.expiresAt) {
      throw new ConvexError("This invite has expired.");
    }

    if (invite.uses >= invite.maxUses) {
      throw new ConvexError("This invite has reached its maximum number of uses.");
    }

    const team = await ctx.db.get(invite.teamId);
    if (!team) {
      throw new ConvexError("Team not found.");
    }

    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", invite.teamId).eq("userId", userId)
      )
      .unique();

    if (existingMember) {
      return { teamId: invite.teamId, alreadyMember: true };
    }

    await ctx.db.insert("teamMembers", {
      teamId: invite.teamId,
      userId,
      role: "member",
      joinedAt: Date.now(),
    });

    await ctx.db.patch(invite._id, {
      uses: invite.uses + 1,
    });

    return { teamId: invite.teamId, alreadyMember: false };
  },
});
