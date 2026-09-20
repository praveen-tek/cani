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
import { requireMember } from "./lib/membership";
import { inviteEmail, isValidEmail, maskEmail } from "./lib/email";
import { enforce, isEmailEnabled } from "./lib/limits";
import type { Id } from "./_generated/dataModel";

export function generateInviteCode(): string {
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

    await enforce(ctx, "inviteCreateHourly", { key: userId });

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
      return {
        status: "not_found" as const,
        teamName: null,
        memberCount: 0,
        isAlreadyMember: false,
        teamId: null,
      };
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", trimmedCode))
      .unique();

    if (!invite) {
      return {
        status: "not_found" as const,
        teamName: null,
        memberCount: 0,
        isAlreadyMember: false,
        teamId: null,
      };
    }

    if (invite.revoked) {
      return {
        status: "revoked" as const,
        teamName: null,
        memberCount: 0,
        isAlreadyMember: false,
        teamId: null,
      };
    }

    if (Date.now() > invite.expiresAt) {
      return {
        status: "expired" as const,
        teamName: null,
        memberCount: 0,
        isAlreadyMember: false,
        teamId: null,
      };
    }

    if (invite.uses >= invite.maxUses) {
      return {
        status: "full" as const,
        teamName: null,
        memberCount: 0,
        isAlreadyMember: false,
        teamId: null,
      };
    }

    const team = await ctx.db.get(invite.teamId);
    if (!team) {
      return {
        status: "not_found" as const,
        teamName: null,
        memberCount: 0,
        isAlreadyMember: false,
        teamId: null,
      };
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

    const currentMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", invite.teamId))
      .collect();

    if (currentMembers.length >= 30) {
      throw new ConvexError("This room has reached the maximum of 30 members.");
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

export const checkInviteLimitsInternal = internalQuery({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.teamId);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const user = await ctx.db.get(args.userId);
    const inviterName = profile?.name || user?.name || "A friend";

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    const userRecentInvites = await ctx.db
      .query("emailInvites")
      .withIndex("by_user_and_time", (q) =>
        q.eq("invitedBy", args.userId).gt("createdAt", twentyFourHoursAgo)
      )
      .collect();

    if (userRecentInvites.length >= 10) {
      throw new ConvexError(
        "You have reached the daily limit of 10 email invites."
      );
    }

    const teamEmailRecentInvites = await ctx.db
      .query("emailInvites")
      .withIndex("by_team_and_email", (q) =>
        q.eq("teamId", args.teamId).eq("email", args.email)
      )
      .filter((q) => q.gt(q.field("createdAt"), twentyFourHoursAgo))
      .collect();

    if (teamEmailRecentInvites.length >= 1) {
      throw new ConvexError(
        "An invite was already sent to this email address for this room in the last 24 hours."
      );
    }

    const teamTotalInvites = await ctx.db
      .query("emailInvites")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (teamTotalInvites.length >= 30) {
      throw new ConvexError(
        "This room has reached the maximum of 30 email invites."
      );
    }

    return {
      teamName: team.name,
      inviterName,
    };
  },
});

export const createDedicatedInviteInternal = internalMutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ inviteId: Id<"invites">; code: string }> => {
    const code = generateInviteCode();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const inviteId = await ctx.db.insert("invites", {
      teamId: args.teamId,
      code,
      createdBy: args.userId,
      expiresAt,
      maxUses: 1,
      uses: 0,
      revoked: false,
    });

    return { inviteId, code };
  },
});

export const recordEmailInviteInternal = internalMutation({
  args: {
    teamId: v.id("teams"),
    invitedBy: v.id("users"),
    email: v.string(),
    inviteId: v.id("invites"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailInvites", {
      teamId: args.teamId,
      invitedBy: args.invitedBy,
      email: args.email,
      inviteId: args.inviteId,
      status: args.status,
      messageId: args.messageId,
      error: args.error,
      createdAt: Date.now(),
    });
  },
});

export const revokeInviteInternal = internalMutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.inviteId, { revoked: true });
  },
});

export const sendEmailInvite = action({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ status: "sent" | "failed"; masked: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const cleanEmail = args.email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      throw new ConvexError("Please enter a valid email address.");
    }

    if (!isEmailEnabled()) {
      return { status: "failed", masked: maskEmail(cleanEmail) };
    }

    await enforce(ctx, "emailInviteDaily", { key: userId });
    await enforce(ctx, "emailDaily");

    const { teamName, inviterName } = await ctx.runQuery(
      internal.invites.checkInviteLimitsInternal,
      {
        teamId: args.teamId,
        userId,
        email: cleanEmail,
      }
    );

    const { inviteId, code } = await ctx.runMutation(
      internal.invites.createDedicatedInviteInternal,
      {
        teamId: args.teamId,
        userId,
      }
    );

    const siteUrl = process.env.SITE_URL || "https://cani.app";
    const joinUrl = `${siteUrl}/join?code=${code}`;

    const { subject, text, html } = inviteEmail({
      inviterName,
      roomName: teamName,
      joinUrl,
    });

    const sendRes = await ctx.runAction(internal.mail.sendEmail, {
      to: cleanEmail,
      subject,
      text,
      html,
    });

    if (sendRes.ok) {
      await ctx.runMutation(internal.invites.recordEmailInviteInternal, {
        teamId: args.teamId,
        invitedBy: userId,
        email: cleanEmail,
        inviteId,
        status: "sent",
        messageId: sendRes.messageId,
      });
      return { status: "sent", masked: maskEmail(cleanEmail) };
    }

    await ctx.runMutation(internal.invites.revokeInviteInternal, {
      inviteId,
    });

    await ctx.runMutation(internal.invites.recordEmailInviteInternal, {
      teamId: args.teamId,
      invitedBy: userId,
      email: cleanEmail,
      inviteId,
      status: "failed",
      error: sendRes.error || "Failed to deliver email",
    });

    return { status: "failed", masked: maskEmail(cleanEmail) };
  },
});

export const listEmailInvites = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.teamId);

    const invites = await ctx.db
      .query("emailInvites")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .order("desc")
      .take(20);

    return invites.map((inv) => ({
      _id: inv._id,
      email: inv.invitedBy === userId ? inv.email : maskEmail(inv.email),
      status: inv.status,
      createdAt: inv.createdAt,
    }));
  },
});
