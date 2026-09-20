import { MarketConfig, StoreConfig } from "./markets";

export interface NormalizedProduct {
  title: string;
  url: string;
  imageUrl?: string;
  price?: number;
  salePrice?: number;
  currency: string;
  source: string;
  onSale: boolean;
  reason?: string;
  rating?: number;
  country?: string;
}

export const PRODUCT_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          imageUrl: { type: "string" },
          price: { type: "number" },
          salePrice: { type: "number" },
          currency: { type: "string" },
          rating: { type: "number" },
        },
        required: ["title"],
      },
      maxItems: 8,
    },
  },
  required: ["products"],
};

export const PRODUCT_EXTRACTION_PROMPT =
  "extract each individual product visible on this page with its own product link, its current selling price and its original price as plain numbers, and its rating. Only use what is on the page.";

export function normalizeUrl(input: string, base?: string): string {
  try {
    const parsed = base ? new URL(input, base) : new URL(input);
    parsed.hostname = parsed.hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/^m\./, "");
    parsed.hash = "";

    const params = Array.from(parsed.searchParams.keys());
    for (const key of params) {
      const lower = key.toLowerCase();
      if (
        lower.startsWith("utm_") ||
        lower === "ref" ||
        lower === "ref_" ||
        lower === "tag" ||
        lower === "fbclid" ||
        lower === "gclid"
      ) {
        parsed.searchParams.delete(key);
      }
    }

    let result = parsed.toString();
    if (result.endsWith("/") && parsed.pathname !== "/") {
      result = result.slice(0, -1);
    }
    return result;
  } catch {
    return input.trim();
  }
}

export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/^m\./, "");
  } catch {
    return "web";
  }
}

export function normalizeImageUrl(
  input?: string,
  baseUrl?: string
): string | undefined {
  if (!input || typeof input !== "string") return undefined;
  let trimmed = input.trim();
  if (!trimmed) return undefined;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("data:") || lower.startsWith("javascript:")) {
    return undefined;
  }

  // Replace template placeholders with real values
  trimmed = trimmed
    .replace(/\{@width\}|\{width\}/gi, "832")
    .replace(/\{@height\}|\{height\}/gi, "832")
    .replace(/\{@quality\}|\{quality\}/gi, "70");

  let resolvedUrl: string;
  try {
    if (trimmed.startsWith("//")) {
      resolvedUrl = `https:${trimmed}`;
    } else if (baseUrl) {
      resolvedUrl = new URL(trimmed, baseUrl).toString();
    } else {
      resolvedUrl = new URL(trimmed).toString();
    }
  } catch {
    return undefined;
  }

  try {
    const parsed = new URL(resolvedUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    parsed.protocol = "https:";
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function cleanDescription(text?: string): string {
  if (!text || typeof text !== "string") return "";
  let clean = text.trim();
  if (!clean) return "";

  // Remove markdown headings (# lines)
  clean = clean.replace(/^#{1,6}\s+.*$/gm, "");

  // Remove markdown images ![alt](url)
  clean = clean.replace(/!\[[^\]]*\]\([^)]*\)/g, "");

  // Turn [text](url) links into just text
  clean = clean.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Drop bare urls
  clean = clean.replace(/https?:\/\/\S+/gi, "");

  // Remove backslashes and stray brackets
  clean = clean.replace(/[\\[\]]/g, "");

  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  // Truncate to 160 characters at a word boundary with an ellipsis
  if (clean.length <= 160) {
    return clean;
  }

  const sub = clean.slice(0, 160);
  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace > 120) {
    return `${sub.slice(0, lastSpace)}...`;
  }
  return `${sub.trim()}...`;
}

export function cleanAlsoWorthALookTitle(title?: string): string {
  if (!title || typeof title !== "string") return "";
  let t = title.trim();
  // Strip trailing store suffixes from titles
  t = t.replace(
    /\s*[-–—|:]\s*(Myntra|Amazon(\.in|\.com)?|Flipkart(\.com)?|Target|SSENSE|Walmart|Nike|Best Buy|Ajio|Tata CLiQ|Nykaa)(\s*.*)?$/i,
    ""
  );
  return t.trim() || title.trim();
}

export function isSingleProductPage(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const search = parsed.search.toLowerCase();

    // Amazon: paths containing /dp/ or /gp/product/
    if (
      host.includes("amazon.") &&
      (pathname.includes("/dp/") || pathname.includes("/gp/product/"))
    ) {
      return true;
    }

    // Flipkart: paths containing /p/ with an itm or pid query
    if (
      host.includes("flipkart.") &&
      pathname.includes("/p/") &&
      (parsed.searchParams.has("itm") ||
        parsed.searchParams.has("pid") ||
        search.includes("itm=") ||
        search.includes("pid="))
    ) {
      return true;
    }

    // Myntra: paths ending in a numeric id followed by /buy
    if (host.includes("myntra.") && /\/\d+\/buy\/?$/.test(pathname)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function runFirecrawlSearch(
  apiKey: string,
  queryText: string,
  market: MarketConfig,
  options?: {
    limit?: number;
    scrape?: boolean;
    timeoutMs?: number;
    proxy?: "auto" | "residential";
  }
): Promise<{ status: number; results: any[] }> {
  const limit = options?.limit ?? 3;
  const scrape = options?.scrape ?? true;
  const timeoutMs = options?.timeoutMs ?? 25000;
  const proxySetting = options?.proxy ?? "auto";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestBody: any = {
    query: queryText,
    limit,
    sources: ["web"],
    country: market.firecrawlCountry,
    location: market.firecrawlLocation,
    tbs: "qdr:m",
    ignoreInvalidURLs: true,
    timeout: 20000,
  };

  if (scrape) {
    requestBody.scrapeOptions = {
      formats: [
        {
          type: "json",
          schema: PRODUCT_EXTRACTION_SCHEMA,
          prompt: PRODUCT_EXTRACTION_PROMPT,
        },
      ],
      onlyMainContent: true,
      waitFor: 1500,
      blockAds: true,
      maxAge: 21600000,
      location: {
        country: market.firecrawlCountry,
        languages: market.languages,
      },
      proxy: proxySetting,
    };
  }

  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`Firecrawl error status code: ${res.status}`);
      return { status: res.status, results: [] };
    }

    const json = await res.json();
    const data = json.data;
    const results = Array.isArray(data)
      ? data
      : Array.isArray(data?.web)
      ? data.web
      : Array.isArray(data?.results)
      ? data.results
      : [];

    return { status: res.status, results };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.log(
      "Firecrawl request error:",
      err instanceof Error ? err.message : "network failure"
    );
    return { status: 0, results: [] };
  }
}

export function extractProductsFromSearchResult(
  searchResult: any,
  market: MarketConfig,
  fallbackSource?: string,
  defaultReason?: string
): {
  products: NormalizedProduct[];
  fallback?: NormalizedProduct;
} {
  const resultUrl = (
    searchResult.url ||
    searchResult.metadata?.sourceURL ||
    ""
  ).trim();
  const resultTitle = (
    searchResult.title ||
    searchResult.metadata?.title ||
    ""
  ).trim();
  const resultDesc = (
    searchResult.description ||
    searchResult.snippet ||
    ""
  ).trim();
  const resultSource = fallbackSource || extractHostname(resultUrl);

  const rawProducts =
    searchResult.json?.products ||
    searchResult.extract?.products ||
    searchResult.formats?.json?.products ||
    (Array.isArray(searchResult.json) ? searchResult.json : null) ||
    [];

  const products: NormalizedProduct[] = [];

  if (Array.isArray(rawProducts) && rawProducts.length > 0) {
    for (const prod of rawProducts) {
      if (!prod || typeof prod !== "object") continue;
      const rawTitle = typeof prod.title === "string" ? prod.title.trim() : "";
      if (rawTitle.length < 4) continue;

      const rawUrl =
        typeof prod.url === "string" && prod.url.trim()
          ? prod.url.trim()
          : resultUrl;
      const normalized = normalizeUrl(rawUrl, resultUrl);
      const source = extractHostname(normalized) || resultSource;

      const normalizedImg = normalizeImageUrl(prod.imageUrl, normalized);

      const parsedPrice =
        typeof prod.price === "number" && !isNaN(prod.price)
          ? prod.price
          : undefined;
      const parsedSalePrice =
        typeof prod.salePrice === "number" && !isNaN(prod.salePrice)
          ? prod.salePrice
          : undefined;

      let finalPrice = parsedPrice;
      let finalSalePrice = parsedSalePrice;
      let onSale = false;

      if (finalPrice !== undefined && finalSalePrice !== undefined) {
        if (finalSalePrice < finalPrice) {
          onSale = true;
        } else {
          finalSalePrice = undefined;
        }
      } else if (finalPrice === undefined && finalSalePrice !== undefined) {
        finalPrice = finalSalePrice;
        finalSalePrice = undefined;
      }

      const rating =
        typeof prod.rating === "number" &&
        !isNaN(prod.rating) &&
        prod.rating >= 0 &&
        prod.rating <= 5
          ? prod.rating
          : undefined;

      // Only items that have an imageUrl OR price/salePrice qualify as a product
      const hasVisualOrPrice =
        Boolean(normalizedImg) ||
        finalPrice !== undefined ||
        finalSalePrice !== undefined;

      if (hasVisualOrPrice) {
        products.push({
          title: rawTitle,
          url: normalized,
          imageUrl: normalizedImg,
          price: finalPrice,
          salePrice: finalSalePrice,
          currency: market.currency,
          source,
          onSale,
          reason: defaultReason,
          rating,
          country: market.country,
        });
      }
    }
  }

  let fallback: NormalizedProduct | undefined;
  if (products.length === 0 && resultUrl && resultTitle.length >= 4) {
    let recoveredImg: string | undefined;

    // Only recover metadata image if URL is a single product page
    if (isSingleProductPage(resultUrl)) {
      const rawMetaImg =
        searchResult.metadata?.ogImage ||
        searchResult.metadata?.["og:image"] ||
        searchResult.metadata?.image ||
        undefined;
      recoveredImg = normalizeImageUrl(rawMetaImg, resultUrl);
    }

    fallback = {
      title: resultTitle,
      url: normalizeUrl(resultUrl),
      imageUrl: recoveredImg,
      price: undefined,
      salePrice: undefined,
      currency: market.currency,
      source: resultSource,
      onSale: false,
      reason: resultDesc
        ? defaultReason
          ? `${defaultReason} - ${resultDesc}`.slice(0, 140)
          : resultDesc.slice(0, 140)
        : defaultReason,
      rating: undefined,
      country: market.country,
    };
  }

  return { products, fallback };
}

export function dedupeProducts(list: NormalizedProduct[]): NormalizedProduct[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const out: NormalizedProduct[] = [];

  for (const item of list) {
    if (item.title.length < 4) continue;
    const lowerTitle = item.title.toLowerCase();
    if (seenUrls.has(item.url) || seenTitles.has(lowerTitle)) {
      continue;
    }
    seenUrls.add(item.url);
    seenTitles.add(lowerTitle);
    out.push(item);
  }
  return out;
}
