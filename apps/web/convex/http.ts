import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

async function verifyFirecrawlSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  try {
    const parts = signatureHeader.split("=");
    const algorithm = parts[0];
    const hash = parts[1];

    if (algorithm !== "sha256" || !hash) return false;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const bodyData = encoder.encode(rawBody);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, bodyData);

    const computedHex = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computedHex.length !== hash.length) return false;

    let match = 0;
    for (let i = 0; i < computedHex.length; i++) {
      match |= computedHex.charCodeAt(i) ^ hash.charCodeAt(i);
    }
    return match === 0;
  } catch {
    return false;
  }
}

http.route({
  path: "/firecrawl/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await req.text();
    const webhookSecret = process.env.FIRECRAWL_WEBHOOK_SECRET;
    const signature =
      req.headers.get("x-firecrawl-signature") ||
      req.headers.get("X-Firecrawl-Signature");

    if (webhookSecret) {
      if (!signature) {
        return new Response("Missing signature", { status: 401 });
      }
      const isValid = await verifyFirecrawlSignature(
        rawBody,
        signature,
        webhookSecret
      );
      if (!isValid) {
        return new Response("Invalid signature", { status: 401 });
      }
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const eventType = event.type;
    const items = Array.isArray(event.data) ? event.data : [];

    for (const item of items) {
      const firecrawlMonitorId = item.monitorId;
      if (!firecrawlMonitorId) continue;

      const monitor = await ctx.runQuery(
        internal.monitors.getMonitorByFirecrawlIdInternal,
        { firecrawlMonitorId }
      );

      if (!monitor) continue;

      if (eventType === "monitor.page") {
        const status = item.status;
        const judgment = item.judgment;
        const snapshot = item.snapshot?.json || {};
        const url = item.url || monitor.url;

        let alertType:
          | "price_drop"
          | "price_change"
          | "back_in_stock"
          | "new_result"
          | null = null;
        let message = "";
        let newPrice: number | undefined;
        let prevPrice: number | undefined = monitor.lastPrice;

        if (typeof snapshot.price === "number") {
          newPrice = snapshot.price;
        } else if (typeof snapshot.salePrice === "number") {
          newPrice = snapshot.salePrice;
        }

        if (status === "new" || monitor.kind === "search") {
          alertType = "new_result";
          message =
            judgment?.reason ||
            `New deal or product match found for "${monitor.query || monitor.title}".`;
        } else if (status === "changed") {
          if (snapshot.inStock === true && judgment?.reason?.toLowerCase().includes("stock")) {
            alertType = "back_in_stock";
            message = `${monitor.title} is now back in stock!`;
          } else if (
            prevPrice !== undefined &&
            newPrice !== undefined &&
            newPrice < prevPrice
          ) {
            alertType = "price_drop";
            message = `Price dropped from ${monitor.currency} ${prevPrice} to ${monitor.currency} ${newPrice}!`;
          } else {
            alertType = "price_change";
            message =
              judgment?.reason ||
              `Change detected in ${monitor.title}. Current price: ${
                newPrice ? `${monitor.currency} ${newPrice}` : "Updated"
              }`;
          }
        }

        if (alertType) {
          await ctx.runMutation(internal.monitors.insertAlertInternal, {
            userId: monitor.userId,
            monitorId: monitor._id,
            teamId: monitor.teamId,
            type: alertType,
            title: monitor.title,
            message,
            url,
            previousPrice: prevPrice,
            newPrice,
            currency: monitor.currency,
          });
        }

        await ctx.runMutation(internal.monitors.recordCheckResultInternal, {
          monitorId: monitor._id,
          lastPrice: newPrice ?? monitor.lastPrice,
          lastSalePrice:
            typeof snapshot.salePrice === "number"
              ? snapshot.salePrice
              : monitor.lastSalePrice,
        });
      } else if (eventType === "monitor.check.completed") {
        await ctx.runMutation(internal.monitors.recordCheckResultInternal, {
          monitorId: monitor._id,
        });
      }
    }

    return new Response("ok", { status: 200 });
  }),
});

export default http;
