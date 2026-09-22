import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, components } from "./_generated/api";
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

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
};

function getMimeType(path: string): string {
  const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function hasFileExtension(path: string): boolean {
  const lastSegment = path.split("/").pop() || "";
  return lastSegment.includes(".") && !lastSegment.startsWith(".");
}

function isHashedAsset(path: string): boolean {
  const match = path.match(/[-.]([\dA-Za-z_-]{6,32})\.[A-Za-z\d]+$/);
  return match !== null && /[\d_-]/.test(match[1]);
}

function isHtmlContentType(contentType: string): boolean {
  return contentType.startsWith("text/html");
}

function cacheControlFor(path: string): string {
  return !path.toLowerCase().endsWith(".html") && isHashedAsset(path)
    ? "public, max-age=31536000, immutable"
    : "public, max-age=0, must-revalidate";
}

function decodeRequestPath(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function etagMatches(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  return (
    ifNoneMatch === "*" ||
    ifNoneMatch === etag ||
    ifNoneMatch === `W/${etag}` ||
    `W/${ifNoneMatch}` === etag
  );
}

http.route({
  pathPrefix: "/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const decodedPath = decodeRequestPath(url.pathname);
    if (decodedPath === null) {
      return new Response("Bad Request", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    let candidates: string[] = [];
    if (decodedPath === "" || decodedPath === "/") {
      candidates = ["/index.html"];
    } else if (decodedPath.endsWith("/")) {
      candidates = [
        `${decodedPath}index.html`,
        decodedPath.slice(0, -1),
        `${decodedPath.slice(0, -1)}.html`,
      ];
    } else if (hasFileExtension(decodedPath)) {
      candidates = [decodedPath];
      if (decodedPath.includes("__PAGE__.txt") || decodedPath.includes("__next.")) {
        const transformed1 = decodedPath.replace(
          /(\/__next\.[^./]+)\.([^./]+)\.__PAGE__\.txt$/,
          "$1/$2/__PAGE__.txt"
        );
        const transformed2 = decodedPath.replace(
          /(\/__next\.[^./]+)\.__PAGE__\.txt$/,
          "$1/__PAGE__.txt"
        );
        if (transformed1 !== decodedPath) candidates.push(transformed1);
        if (transformed2 !== decodedPath) candidates.push(transformed2);
      }
    } else {
      candidates = [
        decodedPath,
        `${decodedPath}/index.html`,
        `${decodedPath}.html`,
      ];
    }

    let asset: any = null;
    let resolvedPath = "";

    for (const candidate of candidates) {
      const res = await ctx.runQuery(
        components.staticHosting.lib.resolveAssetForHttp,
        {
          path: candidate,
          spaFallback: false,
        }
      );
      if (res) {
        asset = res;
        resolvedPath = candidate;
        break;
      }
    }

    if (!asset && !hasFileExtension(decodedPath)) {
      const fallback = await ctx.runQuery(
        components.staticHosting.lib.resolveAssetForHttp,
        {
          path: "/index.html",
          spaFallback: true,
        }
      );
      if (fallback) {
        asset = fallback;
        resolvedPath = "/index.html";
      }
    }

    if (!asset) {
      return new Response("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const contentType = asset.contentType || getMimeType(resolvedPath);
    const cacheControl = cacheControlFor(resolvedPath);

    if (asset.blobId && !isHtmlContentType(contentType)) {
      const baseUrl = `${url.origin}/fs/blobs`;
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${baseUrl.replace(/\/$/, "")}/${asset.blobId}`,
          "Cache-Control": cacheControl,
        },
      });
    }

    if (asset.appStorageId) {
      if (
        asset.etag &&
        etagMatches(req.headers.get("If-None-Match"), asset.etag)
      ) {
        return new Response(null, {
          status: 304,
          headers: { ETag: asset.etag, "Cache-Control": cacheControl },
        });
      }
      const blob = await ctx.storage.get(asset.appStorageId);
      if (!blob) {
        return new Response("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        });
      }
      return new Response(blob, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": cacheControl,
          ...(asset.etag ? { ETag: asset.etag } : {}),
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (!asset.storageUrl) {
      return new Response("Asset not available", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (
      asset.etag &&
      etagMatches(req.headers.get("If-None-Match"), asset.etag)
    ) {
      return new Response(null, {
        status: 304,
        headers: { ETag: asset.etag, "Cache-Control": cacheControl },
      });
    }

    const storageResponse = await fetch(asset.storageUrl);
    if (!storageResponse.ok || !storageResponse.body) {
      return new Response("Storage error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response(storageResponse.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
        ...(asset.etag ? { ETag: asset.etag } : {}),
        "X-Content-Type-Options": "nosniff",
      },
    });
  }),
});

export default http;
