import { RateLimiter, SECOND, MINUTE, HOUR, DAY } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";
import { ConvexError } from "convex/values";
import type { ActionCtx, MutationCtx } from "../_generated/server";

export const COST_SEARCH_CALL = 2;
export const COST_SCRAPE_PAGE = 1;
export const COST_JSON_EXTRA_PAGE = 4;
export const COST_MONITOR_CHECK_PAGE = 1;

export function estimateDiscoverCost(): number {
  const storeSearches = 3;
  const openWebSearches = 1;
  const resultsScrapedPerStore = 3;
  const searchCallsCost = (storeSearches + openWebSearches) * COST_SEARCH_CALL;
  const scrapeCost =
    storeSearches *
    resultsScrapedPerStore *
    (COST_SCRAPE_PAGE + COST_JSON_EXTRA_PAGE);
  return searchCallsCost + scrapeCost; // 4 * 2 + 3 * 3 * 5 = 8 + 45 = 53
}

export function estimateAddByUrlCost(): number {
  return COST_SCRAPE_PAGE + COST_JSON_EXTRA_PAGE; // 1 + 4 = 5
}

export function getMonitorChecksPerDay(scheduleText?: string): number {
  const lower = (scheduleText || "").toLowerCase().trim();
  if (lower.includes("day") || lower === "daily") return 1;
  if (lower.includes("hour") && !lower.includes("30") && !lower.includes("minute")) return 24;
  return 48;
}

export function estimateMonitorDailyCost(
  kind: "product" | "search",
  scheduleText?: string
): number {
  const checksPerDay = getMonitorChecksPerDay(scheduleText);
  if (kind === "product") {
    return checksPerDay * (COST_SCRAPE_PAGE + COST_JSON_EXTRA_PAGE);
  }
  return checksPerDay * COST_SEARCH_CALL;
}

function scaleRate(rate: number): number {
  const scale = Number(process.env.RATE_LIMIT_SCALE ?? 1);
  return Math.max(1, Math.round(rate * scale));
}

function scaleCapacity(capacity: number): number {
  const scale = Number(process.env.RATE_LIMIT_SCALE ?? 1);
  return Math.max(1, Math.round(capacity * scale));
}

export function getLimiter() {
  const firecrawlDailyBudget = Number(
    process.env.FIRECRAWL_DAILY_CREDIT_BUDGET ?? 150
  );
  const emailDailyCap = Number(process.env.EMAIL_DAILY_CAP ?? 100);

  return new RateLimiter(components.rateLimiter, {
    discoverBurst: {
      kind: "token bucket",
      rate: scaleRate(1),
      period: 6 * SECOND,
      capacity: scaleCapacity(3),
    },
    discoverDaily: {
      kind: "fixed window",
      rate: scaleRate(20),
      period: DAY,
    },
    addByUrlHourly: {
      kind: "fixed window",
      rate: scaleRate(10),
      period: HOUR,
    },
    addByUrlDaily: {
      kind: "fixed window",
      rate: scaleRate(30),
      period: DAY,
    },
    monitorCreateDaily: {
      kind: "fixed window",
      rate: scaleRate(5),
      period: DAY,
    },
    roomCreateHourly: {
      kind: "fixed window",
      rate: scaleRate(5),
      period: HOUR,
    },
    inviteCreateHourly: {
      kind: "fixed window",
      rate: scaleRate(20),
      period: HOUR,
    },
    emailInviteDaily: {
      kind: "fixed window",
      rate: scaleRate(10),
      period: DAY,
    },
    alertEmailHourly: {
      kind: "fixed window",
      rate: scaleRate(5),
      period: HOUR,
    },
    voteBurst: {
      kind: "token bucket",
      rate: scaleRate(60),
      period: MINUTE,
      capacity: scaleCapacity(20),
    },
    addToRoomHourly: {
      kind: "fixed window",
      rate: scaleRate(30),
      period: HOUR,
    },
    firecrawlCredits: {
      kind: "fixed window",
      rate: scaleRate(firecrawlDailyBudget),
      period: DAY,
    },
    emailDaily: {
      kind: "fixed window",
      rate: scaleRate(emailDailyCap),
      period: DAY,
    },
  });
}

export type RateLimitName =
  | "discoverBurst"
  | "discoverDaily"
  | "addByUrlHourly"
  | "addByUrlDaily"
  | "monitorCreateDaily"
  | "roomCreateHourly"
  | "inviteCreateHourly"
  | "emailInviteDaily"
  | "alertEmailHourly"
  | "voteBurst"
  | "addToRoomHourly"
  | "firecrawlCredits"
  | "emailDaily";

export function describeWait(name: string, retryAfterMs: number): string {
  let timeStr = "";
  if (retryAfterMs <= 1000) {
    timeStr = "1 second";
  } else if (retryAfterMs < 60000) {
    const sec = Math.ceil(retryAfterMs / 1000);
    timeStr = `${sec} seconds`;
  } else if (retryAfterMs < 3600000) {
    const min = Math.ceil(retryAfterMs / 60000);
    timeStr = min === 1 ? "1 minute" : `${min} minutes`;
  } else {
    const hr = Math.ceil(retryAfterMs / 3600000);
    timeStr = hr === 1 ? "about 1 hour" : `about ${hr} hours`;
  }

  if (name === "discoverBurst" || name === "voteBurst") {
    return `Slow down a little. Try again in ${timeStr}.`;
  }
  if (name === "firecrawlCredits") {
    return "Search is busy right now. Try again later.";
  }
  if (name === "emailDaily") {
    return "Email service is busy right now. Try again later.";
  }
  if (name === "discoverDaily") {
    return `You have used today's searches. Try again in ${timeStr}.`;
  }
  return `You have reached the limit for now. Try again in ${timeStr}.`;
}

export async function enforce(
  ctx: MutationCtx | ActionCtx,
  name: RateLimitName,
  options?: { key?: string; count?: number }
): Promise<void> {
  const limiter = getLimiter();
  const res = await limiter.limit(ctx, name, {
    key: options?.key,
    count: options?.count,
  });

  if (!res.ok) {
    const retryAfterMs = res.retryAfter || 0;
    const message = describeWait(name, retryAfterMs);
    throw new ConvexError({
      code: "RATE_LIMITED",
      name,
      retryAfterMs,
      message,
    });
  }
}

export function assertFirecrawlEnabled(): void {
  if (process.env.FIRECRAWL_ENABLED === "false") {
    throw new ConvexError("Search is paused for now. Please try again later.");
  }
}

export function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED !== "false";
}

export async function spendFirecrawl(
  ctx: MutationCtx | ActionCtx,
  options: { cost: number; key?: string }
): Promise<void> {
  assertFirecrawlEnabled();
  await enforce(ctx, "firecrawlCredits", {
    key: options.key,
    count: options.cost,
  });
}
