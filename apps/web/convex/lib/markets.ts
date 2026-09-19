export interface StoreConfig {
  domain: string;
  label: string;
}

export interface MarketConfig {
  country: "IN" | "US";
  currency: "INR" | "USD";
  locale: "en-IN" | "en-US";
  firecrawlCountry: "IN" | "US";
  firecrawlLocation: "India" | "United States";
  languages: string[];
  stores: StoreConfig[];
}

export const MARKETS: Record<"IN" | "US", MarketConfig> = {
  IN: {
    country: "IN",
    currency: "INR",
    locale: "en-IN",
    firecrawlCountry: "IN",
    firecrawlLocation: "India",
    languages: ["en-IN"],
    stores: [
      { domain: "flipkart.com", label: "Flipkart" },
      { domain: "amazon.in", label: "Amazon India" },
      { domain: "myntra.com", label: "Myntra" },
      { domain: "croma.com", label: "Croma" },
      { domain: "nykaa.com", label: "Nykaa" },
    ],
  },
  US: {
    country: "US",
    currency: "USD",
    locale: "en-US",
    firecrawlCountry: "US",
    firecrawlLocation: "United States",
    languages: ["en-US"],
    stores: [
      { domain: "amazon.com", label: "Amazon" },
      { domain: "walmart.com", label: "Walmart" },
      { domain: "bestbuy.com", label: "Best Buy" },
      { domain: "target.com", label: "Target" },
    ],
  },
};

export function getMarket(code?: string | null): MarketConfig {
  if (code && code.toUpperCase() === "IN") {
    return MARKETS.IN;
  }
  return MARKETS.US;
}

