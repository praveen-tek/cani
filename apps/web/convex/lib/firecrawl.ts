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

export async function runFirecrawlSearch(
  apiKey: string,
  queryText: string,
  market: MarketConfig,
  options?: {
    limit?: number;
    scrape?: boolean;
    timeoutMs?: number;
  }
): Promise<{ status: number; results: any[] }> {
  const limit = options?.limit ?? 3;
  const scrape = options?.scrape ?? true;
  const timeoutMs = options?.timeoutMs ?? 25000;

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
      proxy: "auto",
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

      products.push({
        title: rawTitle,
        url: normalized,
        imageUrl:
          typeof prod.imageUrl === "string" && prod.imageUrl.trim()
            ? prod.imageUrl.trim()
            : undefined,
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

  let fallback: NormalizedProduct | undefined;
  if (products.length === 0 && resultUrl && resultTitle.length >= 4) {
    fallback = {
      title: resultTitle,
      url: normalizeUrl(resultUrl),
      imageUrl:
        searchResult.metadata?.ogImage ||
        searchResult.metadata?.image ||
        undefined,
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
