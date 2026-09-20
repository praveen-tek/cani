import { ConvexError } from "convex/values";

export interface RateLimitErrorData {
  code?: string;
  name?: string;
  retryAfterMs?: number;
  message?: string;
}

export function getErrorMessage(err: unknown): string {
  if (!err) return "Something went wrong. Try again.";

  if (err instanceof ConvexError) {
    if (typeof err.data === "string" && err.data.trim()) {
      return err.data.trim();
    }
    if (typeof err.data === "object" && err.data !== null) {
      const data = err.data as Record<string, any>;
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message.trim();
      }
    }
  }

  if (typeof err === "object" && err !== null) {
    const errorObj = err as Record<string, any>;
    if (typeof errorObj.data === "object" && errorObj.data !== null) {
      if (typeof errorObj.data.message === "string" && errorObj.data.message.trim()) {
        return errorObj.data.message.trim();
      }
    }
    if (typeof errorObj.message === "string" && errorObj.message.trim()) {
      const msg = errorObj.message.trim();
      // Filter out raw stack traces or internal Convex server error wrappers
      if (msg.includes("Server Error") || msg.includes("Uncaught Error")) {
        const match = msg.match(/(?:Server Error|Uncaught Error):\s*([^\n\r]+)/i);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return msg;
    }
  }

  if (typeof err === "string" && err.trim()) {
    return err.trim();
  }

  return "Something went wrong. Try again.";
}

export function getRetryAfterMs(err: unknown): number | null {
  if (!err) return null;

  if (err instanceof ConvexError && typeof err.data === "object" && err.data !== null) {
    const data = err.data as RateLimitErrorData;
    if (typeof data.retryAfterMs === "number" && data.retryAfterMs > 0) {
      return data.retryAfterMs;
    }
  }

  if (typeof err === "object" && err !== null) {
    const errorObj = err as Record<string, any>;
    if (typeof errorObj.data === "object" && errorObj.data !== null) {
      if (typeof errorObj.data.retryAfterMs === "number" && errorObj.data.retryAfterMs > 0) {
        return errorObj.data.retryAfterMs;
      }
      if (typeof errorObj.data.retryAfter === "number" && errorObj.data.retryAfter > 0) {
        return errorObj.data.retryAfter;
      }
    }
  }

  return null;
}
