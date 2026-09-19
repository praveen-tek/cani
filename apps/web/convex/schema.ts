import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    age: v.number(),
    interests: v.array(v.string()),
    lookingFor: v.string(),
    country: v.optional(v.string()),
    currency: v.optional(v.string()),
    countrySource: v.optional(v.union(v.literal("auto"), v.literal("user"))),
    onboardingComplete: v.boolean(),
    lastSuggestedAt: v.optional(v.number()),
    lastDiscoverAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  teams: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),

  invites: defineTable({
    teamId: v.id("teams"),
    code: v.string(),
    createdBy: v.id("users"),
    expiresAt: v.number(),
    maxUses: v.number(),
    uses: v.number(),
    revoked: v.boolean(),
  })
    .index("by_code", ["code"])
    .index("by_team", ["teamId"]),

  suggestions: defineTable({
    userId: v.id("users"),
    title: v.string(),
    url: v.string(),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    currency: v.optional(v.string()),
    source: v.string(),
    onSale: v.boolean(),
    reason: v.optional(v.string()),
    rating: v.optional(v.number()),
    country: v.optional(v.string()),
    generatedAt: v.number(),
  }).index("by_user", ["userId"]),

  products: defineTable({
    teamId: v.id("teams"),
    addedBy: v.id("users"),
    title: v.string(),
    url: v.string(),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    currency: v.optional(v.string()),
    source: v.string(),
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_url", ["teamId", "url"]),

  votes: defineTable({
    productId: v.id("products"),
    teamId: v.id("teams"),
    userId: v.id("users"),
    value: v.union(v.literal(1), v.literal(-1)),
  })
    .index("by_product", ["productId"])
    .index("by_product_and_user", ["productId", "userId"])
    .index("by_team", ["teamId"]),
});
