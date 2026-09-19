import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { requireMember } from "./lib/membership";

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
    const { userId } = await requireMember(ctx, args.teamId);

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
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new ConvexError("Invite not found");
    }

    const { role } = await requireMember(ctx, invite.teamId);
    if (role !== "owner") {
      throw new ConvexError("Not a member of this room");
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
      return { status: "not_found" as const, teamName: null, memberCount: 0, isAlreadyMember: false, teamId: null };
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", trimmedCode))
      .unique();

    if (!invite) {
      return { status: "not_found" as const, teamName: null, memberCount: 0, isAlreadyMember: false, teamId: null };
    }

    if (invite.revoked) {
      return { status: "revoked" as const, teamName: null, memberCount: 0, isAlreadyMember: false, teamId: null };
    }

    if (Date.now() > invite.expiresAt) {
      return { status: "expired" as const, teamName: null, memberCount: 0, isAlreadyMember: false, teamId: null };
    }

    if (invite.uses >= invite.maxUses) {
      return { status: "full" as const, teamName: null, memberCount: 0, isAlreadyMember: false, teamId: null };
    }

    const team = await ctx.db.get(invite.teamId);
    if (!team) {
      return { status: "not_found" as const, teamName: null, memberCount: 0, isAlreadyMember: false, teamId: null };
    }

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", invite.teamId))
      .collect();

    const userId = await getAuthUserId(ctx);
    let isAlreadyMember = false;
    if (userId) {
      const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", invite.teamId).eq("userId", userId)
        )
        .unique();
      isAlreadyMember = Boolean(membership);
    }

    return {
      status: "valid" as const,
      teamName: team.name,
      memberCount: members.length,
      teamId: team._id,
      isAlreadyMember,
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

    const trimmedCode = args.code.trim();
    if (!trimmedCode) {
      throw new ConvexError("Invite not found");
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", trimmedCode))
      .unique();

    if (!invite) {
      throw new ConvexError("Invite not found");
    }

    if (invite.revoked) {
      throw new ConvexError("This invite has been revoked");
    }

    if (Date.now() > invite.expiresAt) {
      throw new ConvexError("This invite has expired");
    }

    if (invite.uses >= invite.maxUses) {
      throw new ConvexError("This invite has reached its maximum uses");
    }

    const team = await ctx.db.get(invite.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", invite.teamId).eq("userId", userId)
      )
      .unique();

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      const user = await ctx.db.get(userId);
      await ctx.db.insert("profiles", {
        userId,
        name: user?.name || "Member",
        age: 25,
        interests: [],
        lookingFor: "",
        country: "US",
        currency: "USD",
        countrySource: "auto",
        onboardingComplete: true,
      });
    }

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
