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
    emailAlerts: v.optional(v.boolean()),
    lastSuggestedAt: v.optional(v.number()),
    lastDiscoverAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  teams: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_archived", ["ownerId", "archivedAt"]),

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

  appConfig: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  searchCache: defineTable({
    key: v.string(),
    payload: v.string(),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  emailInvites: defineTable({
    teamId: v.id("teams"),
    invitedBy: v.id("users"),
    email: v.string(),
    inviteId: v.id("invites"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_email", ["teamId", "email"])
    .index("by_user_and_time", ["invitedBy", "createdAt"]),

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

  monitors: defineTable({
    userId: v.id("users"),
    teamId: v.optional(v.id("teams")),
    kind: v.union(v.literal("product"), v.literal("search")),
    firecrawlMonitorId: v.string(),
    title: v.string(),
    url: v.optional(v.string()),
    query: v.optional(v.string()),
    country: v.string(),
    currency: v.string(),
    schedule: v.string(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("error")),
    lastPrice: v.optional(v.number()),
    lastSalePrice: v.optional(v.number()),
    createdAt: v.number(),
    lastCheckedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_firecrawl_id", ["firecrawlMonitorId"])
    .index("by_user_and_url", ["userId", "url"])
    .index("by_team", ["teamId"]),

  alerts: defineTable({
    userId: v.id("users"),
    monitorId: v.id("monitors"),
    teamId: v.optional(v.id("teams")),
    type: v.union(
      v.literal("price_drop"),
      v.literal("price_change"),
      v.literal("back_in_stock"),
      v.literal("new_result")
    ),
    title: v.string(),
    message: v.string(),
    url: v.optional(v.string()),
    previousPrice: v.optional(v.number()),
    newPrice: v.optional(v.number()),
    currency: v.optional(v.string()),
    read: v.optional(v.boolean()),
    readAt: v.optional(v.number()),
    emailedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_emailed", ["userId", "emailedAt"])
    .index("by_monitor", ["monitorId"])
    .index("by_team", ["teamId"]),
});
