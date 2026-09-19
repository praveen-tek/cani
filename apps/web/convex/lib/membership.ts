import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export async function requireMember(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Not a member of this room");
  }

  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", teamId).eq("userId", userId)
    )
    .unique();

  if (!membership) {
    throw new ConvexError("Not a member of this room");
  }

  return { userId, role: membership.role };
}
