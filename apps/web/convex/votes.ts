import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

export const cast = mutation({
  args: {
    productId: v.id("products"),
    value: v.union(v.literal(1), v.literal(-1)),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Unauthenticated");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError("Product not found");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", product.teamId).eq("userId", userId)
      )
      .unique();

    if (!membership) {
      throw new ConvexError("You must be a member of the team to vote.");
    }

    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_product_and_user", (q) =>
        q.eq("productId", args.productId).eq("userId", userId)
      )
      .unique();

    if (existingVote) {
      if (existingVote.value === args.value) {
        await ctx.db.delete(existingVote._id);
        return { action: "removed" as const };
      } else {
        await ctx.db.patch(existingVote._id, {
          value: args.value,
        });
        return { action: "updated" as const, value: args.value };
      }
    }

    await ctx.db.insert("votes", {
      productId: args.productId,
      teamId: product.teamId,
      userId,
      value: args.value,
    });

    return { action: "added" as const, value: args.value };
  },
});
