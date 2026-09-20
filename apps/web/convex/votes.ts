import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { requireMember } from "./lib/membership";
import { enforce } from "./lib/limits";

export const cast = mutation({
  args: {
    productId: v.id("products"),
    value: v.union(v.literal(1), v.literal(-1)),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError("Product not found");
    }

    const { userId } = await requireMember(ctx, product.teamId);

    await enforce(ctx, "voteBurst", { key: userId });

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
