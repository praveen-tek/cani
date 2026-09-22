import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { getMarket } from "./lib/markets";
import { normalizeUrl } from "./lib/firecrawl";
import { enforce, estimateMonitorDailyCost } from "./lib/limits";
import type { Id } from "./_generated/dataModel";

export const checkMonitorCapacityInternal = internalQuery({
  args: {
    userId: v.id("users"),
    kind: v.union(v.literal("product"), v.literal("search")),
    newSchedule: v.string(),
  },
  handler: async (ctx, args) => {
    const userMonitors = await ctx.db
      .query("monitors")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const userActive = userMonitors.filter((m) => m.status === "active");
    if (userActive.length >= 5) {
      throw new ConvexError(
        "You are already watching 5 things. Remove one to add another."
      );
    }

    const allMonitors = await ctx.db.query("monitors").collect();
    const activeMonitors = allMonitors.filter((m) => m.status === "active");

    const maxActiveMonitors = Number(process.env.MAX_ACTIVE_MONITORS ?? 25);
    const dailyBudget = Number(process.env.FIRECRAWL_DAILY_CREDIT_BUDGET ?? 150);
    const maxCreditCapacity = 0.4 * dailyBudget;

    let currentDailyCost = 0;
    for (const m of activeMonitors) {
      currentDailyCost += estimateMonitorDailyCost(m.kind, m.schedule);
    }

    const newCost = estimateMonitorDailyCost(args.kind, args.newSchedule);

    if (
      activeMonitors.length >= maxActiveMonitors ||
      currentDailyCost + newCost > maxCreditCapacity
    ) {
      console.log(
        "Capacity refusal:",
        activeMonitors.length,
        currentDailyCost,
        newCost
      );
      throw new ConvexError(
        "Watching is at capacity right now. Please try again later."
      );
    }
  },
});

export const cleanStaleMonitorsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const allMonitors = await ctx.db.query("monitors").collect();
    for (const m of allMonitors) {
      const isStaleError =
        m.status === "error" &&
        (m.createdAt || m._creationTime) < oneHourAgo;
      const isEmptyRemote =
        !m.firecrawlMonitorId || m.firecrawlMonitorId.trim() === "";
      if (isStaleError || isEmptyRemote) {
        const alerts = await ctx.db
          .query("alerts")
          .withIndex("by_monitor", (q) => q.eq("monitorId", m._id))
          .collect();
        for (const a of alerts) {
          await ctx.db.delete(a._id);
        }
        await ctx.db.delete(m._id);
      }
    }
  },
});

export const getInactiveMonitorsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const activeMonitors = await ctx.db
      .query("monitors")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const toPause: Array<{ _id: Id<"monitors">; firecrawlMonitorId: string }> = [];

    for (const monitor of activeMonitors) {
      let latestActivity = monitor.createdAt || monitor._creationTime;

      const userAlerts = await ctx.db
        .query("alerts")
        .withIndex("by_user", (q) => q.eq("userId", monitor.userId))
        .order("desc")
        .take(5);

      for (const a of userAlerts) {
        const act = a.readAt || a.createdAt || a._creationTime;
        if (act > latestActivity) latestActivity = act;
      }

      if (monitor.teamId) {
        const teamProducts = await ctx.db
          .query("products")
          .withIndex("by_team", (q) => q.eq("teamId", monitor.teamId!))
          .order("desc")
          .take(1);
        if (teamProducts.length > 0 && teamProducts[0].createdAt > latestActivity) {
          latestActivity = teamProducts[0].createdAt;
        }
      }

      if (latestActivity < fourteenDaysAgo) {
        toPause.push({
          _id: monitor._id,
          firecrawlMonitorId: monitor.firecrawlMonitorId,
        });
      }
    }

    return toPause;
  },
});

export const autoPauseInactiveMonitors = internalAction({
  args: {},
  handler: async (ctx) => {
    const inactiveMonitors = await ctx.runQuery(
      internal.monitors.getInactiveMonitorsInternal,
      {}
    );

    const apiKey = process.env.FIRECRAWL_API_KEY;

    for (const item of inactiveMonitors) {
      if (apiKey) {
        try {
          await fetch(`https://api.firecrawl.dev/v2/monitor/${item.firecrawlMonitorId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "paused" }),
          });
        } catch {
          // Ignore network errors
        }
      }

      await ctx.runMutation(internal.monitors.updateMonitorStatusInternal, {
        monitorId: item._id,
        status: "paused",
      });
    }
  },
});

export const list = query({
  args: {
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.teamId) {
      return await ctx.db
        .query("monitors")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();
    }

    return await ctx.db
      .query("monitors")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getAlerts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = Math.min(args.limit || 50, 50);
    return await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getUnreadAlertCount = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const userAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const count = userAlerts.filter((a) => !a.readAt && !a.read).length;
    return Math.min(count, 99);
  },
});

export const getWatchStatusForUrl = query({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const normalized = normalizeUrl(args.url);
    const existing = await ctx.db
      .query("monitors")
      .withIndex("by_user_and_url", (q) =>
        q.eq("userId", userId).eq("url", normalized)
      )
      .first();

    return existing || null;
  },
});

export const getWatchStatusForQuery = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const lower = args.query.trim().toLowerCase();
    const monitors = await ctx.db
      .query("monitors")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return (
      monitors.find(
        (m) =>
          m.kind === "search" &&
          m.query &&
          m.query.trim().toLowerCase() === lower
      ) || null
    );
  },
});

export const markAlertAsRead = mutation({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthenticated");

    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.userId !== userId) {
      throw new ConvexError("Alert not found");
    }

    await ctx.db.patch(args.alertId, {
      read: true,
      readAt: Date.now(),
    });
    return { success: true };
  },
});

export const markAllAlertsAsRead = mutation({
  args: {},
  handler: async (ctx): Promise<{ count: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthenticated");

    const userAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const unread = userAlerts.filter((a) => !a.readAt && !a.read);
    const now = Date.now();
    for (const a of unread) {
      await ctx.db.patch(a._id, {
        read: true,
        readAt: now,
      });
    }

    return { count: unread.length };
  },
});

export const insertMonitorInternal = internalMutation({
  args: {
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
    lastPrice: v.optional(v.number()),
    lastSalePrice: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"monitors">> => {
    return await ctx.db.insert("monitors", {
      userId: args.userId,
      teamId: args.teamId,
      kind: args.kind,
      firecrawlMonitorId: args.firecrawlMonitorId,
      title: args.title,
      url: args.url,
      query: args.query,
      country: args.country,
      currency: args.currency,
      schedule: args.schedule,
      status: "active",
      lastPrice: args.lastPrice,
      lastSalePrice: args.lastSalePrice,
      createdAt: Date.now(),
      lastCheckedAt: Date.now(),
    });
  },
});

export const updateMonitorStatusInternal = internalMutation({
  args: {
    monitorId: v.id("monitors"),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("error")),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.monitorId, { status: args.status });
  },
});

export const removeMonitorInternal = internalMutation({
  args: {
    monitorId: v.id("monitors"),
  },
  handler: async (ctx, args): Promise<void> => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .collect();

    for (const a of alerts) {
      await ctx.db.delete(a._id);
    }

    await ctx.db.delete(args.monitorId);
  },
});

export const createProductWatch = action({
  args: {
    url: v.string(),
    title: v.optional(v.string()),
    goal: v.optional(v.string()),
    schedule: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    initialPrice: v.optional(v.number()),
    initialSalePrice: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ monitorId: Id<"monitors">; firecrawlMonitorId: string }> => {
    let firecrawlApiKey: string | undefined;
    let firecrawlMonitorId: string | null = null;
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new ConvexError("Unauthenticated");

      firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
      if (!firecrawlApiKey) {
        throw new ConvexError("FIRECRAWL_API_KEY is not configured on Convex.");
      }

    let validUrl: URL;
    try {
      validUrl = new URL(args.url.trim());
      if (validUrl.protocol !== "http:" && validUrl.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
    } catch {
      throw new ConvexError("Please provide a valid HTTP or HTTPS product link.");
    }

    const normalizedUrl = normalizeUrl(validUrl.toString());

    const profile = await ctx.runQuery(internal.products.getProfileForUser, {
      userId,
    });
    const market = getMarket(profile?.country);

    const title = args.title?.trim() || validUrl.hostname.replace(/^www\./, "");
    const scheduleText = args.schedule?.trim() || "daily";
    const goalText =
      args.goal?.trim() ||
      "Alert when the price, sale price, or in-stock availability of this product changes.";

    await enforce(ctx, "monitorCreateDaily", { key: userId });
    await ctx.runQuery(internal.monitors.checkMonitorCapacityInternal, {
      userId,
      kind: "product",
      newSchedule: scheduleText,
    });

    const siteUrl = process.env.CONVEX_SITE_URL || "";
    const webhookUrl = `${siteUrl}/firecrawl/webhook`;

    const requestBody = {
      name: `Price Watch: ${title.slice(0, 50)}`,
      schedule: {
        text: scheduleText,
        timezone: "UTC",
      },
      goal: goalText,
      targets: [
        {
          type: "scrape",
          urls: [normalizedUrl],
          scrapeOptions: {
            formats: [
              {
                type: "changeTracking",
                modes: ["json"],
                prompt:
                  "Extract the product title, current price as a number, sale price as a number, currency, and inStock boolean.",
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    price: { type: "number" },
                    salePrice: { type: "number" },
                    currency: { type: "string" },
                    inStock: { type: "boolean" },
                  },
                  required: ["title"],
                },
              },
            ],
            onlyMainContent: true,
            location: {
              country: market.firecrawlCountry,
              languages: market.languages,
            },
            proxy: "auto",
          },
        },
      ],
      webhook: {
        url: webhookUrl,
        events: ["monitor.page", "monitor.check.completed"],
      },
    };

    let firecrawlMonitorId: string | null = null;
    const res = await fetch("https://api.firecrawl.dev/v2/monitor", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new ConvexError(
          `Failed to create watch with Firecrawl (${res.status}). Please try again.`
        );
      }

      const data = await res.json();
      firecrawlMonitorId = data?.data?.id || data?.id;

      if (!firecrawlMonitorId) {
        throw new ConvexError("Failed to obtain monitor ID from Firecrawl.");
      }

      const monitorId: Id<"monitors"> = await ctx.runMutation(
        internal.monitors.insertMonitorInternal,
        {
          userId,
          teamId: args.teamId,
          kind: "product",
          firecrawlMonitorId,
          title,
          url: normalizedUrl,
          country: market.country,
          currency: market.currency,
          schedule: scheduleText,
          lastPrice: args.initialPrice,
          lastSalePrice: args.initialSalePrice,
        }
      );

      return { monitorId, firecrawlMonitorId };
    } catch (err) {
      if (firecrawlMonitorId && firecrawlApiKey) {
        try {
          await fetch(
            `https://api.firecrawl.dev/v2/monitor/${firecrawlMonitorId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${firecrawlApiKey}`,
              },
            }
          );
        } catch {
          // ignore rollback error
        }
      }
      if (err instanceof ConvexError) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[monitors:createProductWatch] error: ${msg}`);
      throw new ConvexError("Something went wrong on our side. Please try again.");
    }
  },
});

export const createSearchWatch = action({
  args: {
    query: v.string(),
    goal: v.optional(v.string()),
    schedule: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ monitorId: Id<"monitors">; firecrawlMonitorId: string }> => {
    let firecrawlApiKey: string | undefined;
    let firecrawlMonitorId: string | null = null;
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new ConvexError("Unauthenticated");

      firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
      if (!firecrawlApiKey) {
        throw new ConvexError("FIRECRAWL_API_KEY is not configured on Convex.");
      }

    const trimmedQuery = args.query.trim();
    if (trimmedQuery.length < 2 || trimmedQuery.length > 256) {
      throw new ConvexError("Search query must be between 2 and 256 characters.");
    }

    const profile = await ctx.runQuery(internal.products.getProfileForUser, {
      userId,
    });
    const market = getMarket(profile?.country);

    const scheduleText = args.schedule?.trim() || "daily";
    const goalText =
      args.goal?.trim() ||
      `Alert when a new product launch, deal, or discount matching "${trimmedQuery}" appears.`;

    await enforce(ctx, "monitorCreateDaily", { key: userId });
    await ctx.runQuery(internal.monitors.checkMonitorCapacityInternal, {
      userId,
      kind: "search",
      newSchedule: scheduleText,
    });

    const siteUrl = process.env.CONVEX_SITE_URL || "";
    const webhookUrl = `${siteUrl}/firecrawl/webhook`;

    const requestBody = {
      name: `Search Watch: ${trimmedQuery.slice(0, 50)}`,
      schedule: {
        text: scheduleText,
        timezone: "UTC",
      },
      goal: goalText,
      targets: [
        {
          type: "search",
          queries: [trimmedQuery],
          searchWindow: "24h",
          maxResults: 5,
          limit: 5,
        },
      ],
      webhook: {
        url: webhookUrl,
        events: ["monitor.page", "monitor.check.completed"],
      },
    };

    let firecrawlMonitorId: string | null = null;
    const res = await fetch("https://api.firecrawl.dev/v2/monitor", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new ConvexError(
          `Failed to create search watch with Firecrawl (${res.status}).`
        );
      }

      const data = await res.json();
      firecrawlMonitorId = data?.data?.id || data?.id;

      if (!firecrawlMonitorId) {
        throw new ConvexError("Failed to obtain monitor ID from Firecrawl.");
      }

      const monitorId: Id<"monitors"> = await ctx.runMutation(
        internal.monitors.insertMonitorInternal,
        {
          userId,
          teamId: args.teamId,
          kind: "search",
          firecrawlMonitorId,
          title: `Deals & launches: "${trimmedQuery}"`,
          query: trimmedQuery,
          country: market.country,
          currency: market.currency,
          schedule: scheduleText,
        }
      );

      return { monitorId, firecrawlMonitorId };
    } catch (err) {
      if (firecrawlMonitorId && firecrawlApiKey) {
        try {
          await fetch(
            `https://api.firecrawl.dev/v2/monitor/${firecrawlMonitorId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${firecrawlApiKey}`,
              },
            }
          );
        } catch {
          // ignore rollback error
        }
      }
      if (err instanceof ConvexError) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[monitors:createSearchWatch] error: ${msg}`);
      throw new ConvexError("Something went wrong on our side. Please try again.");
    }
  },
});

export const toggleStatus = action({
  args: {
    monitorId: v.id("monitors"),
  },
  handler: async (ctx, args): Promise<{ status: "active" | "paused" }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthenticated");

    const monitor = await ctx.runQuery(internal.monitors.getMonitorByIdInternal, {
      monitorId: args.monitorId,
    });

    if (!monitor || monitor.userId !== userId) {
      throw new ConvexError("Monitor not found");
    }

    const nextStatus: "active" | "paused" =
      monitor.status === "active" ? "paused" : "active";

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (firecrawlApiKey) {
      try {
        await fetch(
          `https://api.firecrawl.dev/v2/monitor/${monitor.firecrawlMonitorId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${firecrawlApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: nextStatus }),
          }
        );
      } catch (e) {
        console.error("Failed to patch status on Firecrawl:", e);
      }
    }

    await ctx.runMutation(internal.monitors.updateMonitorStatusInternal, {
      monitorId: args.monitorId,
      status: nextStatus,
    });

    return { status: nextStatus };
  },
});

export const remove = action({
  args: {
    monitorId: v.id("monitors"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthenticated");

    const monitor = await ctx.runQuery(internal.monitors.getMonitorByIdInternal, {
      monitorId: args.monitorId,
    });

    if (!monitor || monitor.userId !== userId) {
      throw new ConvexError("Monitor not found");
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (firecrawlApiKey) {
      try {
        await fetch(
          `https://api.firecrawl.dev/v2/monitor/${monitor.firecrawlMonitorId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${firecrawlApiKey}`,
            },
          }
        );
      } catch (e) {
        console.error("Failed to delete monitor from Firecrawl:", e);
      }
    }

    await ctx.runMutation(internal.monitors.removeMonitorInternal, {
      monitorId: args.monitorId,
    });

    return { success: true };
  },
});

export const getMonitorByIdInternal = internalQuery({
  args: {
    monitorId: v.id("monitors"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.monitorId);
  },
});

export const getMonitorByFirecrawlIdInternal = internalQuery({
  args: {
    firecrawlMonitorId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("monitors")
      .withIndex("by_firecrawl_id", (q) =>
        q.eq("firecrawlMonitorId", args.firecrawlMonitorId)
      )
      .first();
  },
});

export const recordCheckResultInternal = internalMutation({
  args: {
    monitorId: v.id("monitors"),
    lastPrice: v.optional(v.number()),
    lastSalePrice: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    const patch: {
      lastCheckedAt: number;
      lastPrice?: number;
      lastSalePrice?: number;
    } = {
      lastCheckedAt: Date.now(),
    };
    if (args.lastPrice !== undefined) patch.lastPrice = args.lastPrice;
    if (args.lastSalePrice !== undefined) patch.lastSalePrice = args.lastSalePrice;
    await ctx.db.patch(args.monitorId, patch);
  },
});

export const insertAlertInternal = internalMutation({
  args: {
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
  },
  handler: async (ctx, args): Promise<Id<"alerts">> => {
    const alertId = await ctx.db.insert("alerts", {
      userId: args.userId,
      monitorId: args.monitorId,
      teamId: args.teamId,
      type: args.type,
      title: args.title,
      message: args.message,
      url: args.url,
      previousPrice: args.previousPrice,
      newPrice: args.newPrice,
      currency: args.currency,
      read: false,
      readAt: undefined,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.mail.sendAlertEmail, {
      alertId,
    });

    return alertId;
  },
});
