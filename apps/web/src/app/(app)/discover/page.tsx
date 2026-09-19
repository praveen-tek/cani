"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { getMarket } from "../../../../convex/lib/markets";
import { MarketSwitcher } from "@/components/market-switcher";
import { Masonry } from "@/components/masonry";
import { ProductCard, ProductCardItem } from "@/components/product-card";
import {
  Check,
  MagnifyingGlass,
  Plus,
  X,
} from "@phosphor-icons/react";

interface AlsoWorthALookItem {
  title: string;
  url: string;
  source: string;
  description: string;
}

interface DiscoverResponse {
  items: ProductCardItem[];
  alsoWorthALook: AlsoWorthALookItem[];
  stores: Array<{ source: string; count: number }>;
  query: string;
}

const IN_EXAMPLE_CHIPS = [
  "running shoes under 3000",
  "noise cancelling headphones deals",
  "study desk lamp",
  "cotton kurta for summer",
];

const US_EXAMPLE_CHIPS = [
  "running shoes under $100",
  "noise cancelling headphones deals",
  "desk lamp for studying",
  "linen shirt for summer",
];

const SKELETON_ITEMS = [
  { id: 1, height: "h-[220px]" },
  { id: 2, height: "h-[300px]" },
  { id: 3, height: "h-[260px]" },
  { id: 4, height: "h-[340px]" },
  { id: 5, height: "h-[240px]" },
  { id: 6, height: "h-[290px]" },
  { id: 7, height: "h-[320px]" },
  { id: 8, height: "h-[250px]" },
];

function DiscoverPageInner() {
  const profile = useQuery(api.profiles.me);
  const teams = useQuery(api.teams.listMine);
  const searchAction = useAction(api.discover.search);
  const addToTeamMutation = useMutation(api.products.addToTeam);

  const [inputQuery, setInputQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [data, setData] = useState<DiscoverResponse | null>(null);

  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    "match" | "price-asc" | "price-desc" | "sale"
  >("match");

  const [selectedProductForTeam, setSelectedProductForTeam] =
    useState<ProductCardItem | null>(null);
  const [addingToTeamId, setAddingToTeamId] = useState<Id<"teams"> | null>(
    null
  );
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  const currentCountry = (profile?.country === "IN" ? "IN" : "US") as
    | "IN"
    | "US";
  const market = getMarket(currentCountry);
  const exampleChips =
    currentCountry === "IN" ? IN_EXAMPLE_CHIPS : US_EXAMPLE_CHIPS;

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("cani_discover_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.data && parsed.query) {
          setData(parsed.data);
          setInputQuery(parsed.query);
          if (Array.isArray(parsed.data.stores)) {
            setSelectedStores(
              parsed.data.stores.map((s: { source: string }) => s.source)
            );
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleClear = () => {
    setData(null);
    setInputQuery("");
    setSearchError(null);
    setSelectedStores([]);
    try { sessionStorage.removeItem("cani_discover_cache"); } catch { /* ignore */ }
  };

  const handleSearch = async (queryToRun: string) => {
    const trimmed = queryToRun.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await searchAction({ query: trimmed });
      setData(res);
      setSelectedStores(res.stores.map((s) => s.source));

      try {
        sessionStorage.setItem(
          "cani_discover_cache",
          JSON.stringify({
            query: trimmed,
            data: res,
            timestamp: Date.now(),
          })
        );
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setSearchError(
        err instanceof Error ? err.message : "Search failed. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleChipClick = (chip: string) => {
    setInputQuery(chip);
    void handleSearch(chip);
  };

  const toggleStore = (store: string) => {
    setSelectedStores((prev) =>
      prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]
    );
  };

  const handleAddToTeam = async (
    teamId: Id<"teams">,
    item: ProductCardItem
  ) => {
    setAddingToTeamId(teamId);
    try {
      const res = await addToTeamMutation({
        teamId,
        customProduct: {
          title: item.title,
          url: item.url,
          imageUrl: item.imageUrl,
          price: item.price,
          salePrice: item.salePrice,
          currency: item.currency,
        },
      });
      setAddedFeedback(
        res.alreadyExisted
          ? "Product is already on team board."
          : "Added to team board!"
      );
      setTimeout(() => {
        setSelectedProductForTeam(null);
        setAddedFeedback(null);
      }, 1200);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add product.");
    } finally {
      setAddingToTeamId(null);
    }
  };

  const filteredItems = (data?.items || []).filter((item) => {
    if (selectedStores.length === 0) return true;
    return selectedStores.includes(item.source);
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "price-asc") {
      const priceA = a.salePrice ?? a.price ?? 999999999;
      const priceB = b.salePrice ?? b.price ?? 999999999;
      return priceA - priceB;
    }
    if (sortBy === "price-desc") {
      const priceA = a.salePrice ?? a.price ?? -1;
      const priceB = b.salePrice ?? b.price ?? -1;
      return priceB - priceA;
    }
    if (sortBy === "sale") {
      const saleA = a.onSale ? 1 : 0;
      const saleB = b.onSale ? 1 : 0;
      if (saleB !== saleA) return saleB - saleA;
    }
    return 0;
  });

  const hasResults = data !== null;

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8 selection:bg-neutral-900 selection:text-white font-normal">
      {/* Search Header Area */}
      <div
        className={`transition-all duration-300 ${
          hasResults || isSearching
            ? "space-y-4"
            : "py-12 sm:py-20 text-center max-w-2xl mx-auto space-y-6"
        }`}
      >
        <div className={hasResults || isSearching ? "hidden" : "space-y-2"}>
          <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal tracking-tight">
            What are you looking for?
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-normal">
            Describe it the way you would say it. Cani searches the stores for you.
          </p>
        </div>

        {/* Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSearch(inputQuery);
          }}
          className="w-full max-w-2xl mx-auto flex items-center gap-2"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
              <MagnifyingGlass size={18} weight="light" />
            </div>
            <input
              type="text"
              required
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="e.g. running shoes under 3000, mechanical keyboard, cotton shirt..."
              className="w-full h-12 pl-11 pr-4 bg-white border border-neutral-200 rounded-2xl text-xs sm:text-sm font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !inputQuery.trim()}
            className="h-12 px-6 rounded-2xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Search</span>
            )}
          </button>

          {(data !== null || inputQuery) && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              className="h-12 px-4 rounded-2xl border border-neutral-200 bg-white text-neutral-600 text-xs font-normal hover:bg-neutral-50 hover:border-neutral-300 transition cursor-pointer shrink-0 flex items-center gap-1.5"
              title="Clear results"
            >
              <X size={14} weight="light" />
              <span>Clear</span>
            </button>
          )}
        </form>

        {/* Example Chips (in idle state) */}
        {!hasResults && !isSearching && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {exampleChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 text-xs font-normal transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 pt-4 text-xs text-neutral-500 font-normal">
              <span>
                {currentCountry === "IN"
                  ? "Searching Indian stores"
                  : "Searching US stores"}
              </span>
              <span>•</span>
              <MarketSwitcher />
            </div>
          </div>
        )}

        {/* Error message inline */}
        {searchError && (
          <p className="text-xs text-neutral-500 font-normal max-w-2xl mx-auto">
            {searchError}
          </p>
        )}
      </div>

      {/* Loading state */}
      {isSearching && (
        <div className="space-y-6 font-normal">
          <div className="text-xs text-neutral-500 font-normal">
            Searching {market.stores.slice(0, 3).map((s) => s.label).join(", ")}...
          </div>

          <Masonry
            items={SKELETON_ITEMS}
            getKey={(item) => String(item.id)}
            renderItem={(item) => (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 space-y-3 animate-pulse">
                <div className={`w-full ${item.height} bg-neutral-100 rounded-xl`} />
                <div className="h-4 bg-neutral-100 rounded w-3/4" />
                <div className="h-3 bg-neutral-100 rounded w-1/2" />
                <div className="h-4 bg-neutral-100 rounded w-1/4" />
              </div>
            )}
          />
        </div>
      )}

      {/* Results view */}
      {data && !isSearching && (
        <div className="space-y-6 font-normal">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
            <div className="text-xs text-neutral-500 font-normal">
              <span className="text-neutral-900 font-normal">
                {filteredItems.length}
              </span>{" "}
              result{filteredItems.length !== 1 ? "s" : ""} for &ldquo;{data.query}&rdquo;
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Store Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {data.stores.map((s) => {
                  const isSelected = selectedStores.includes(s.source);
                  return (
                    <button
                      key={s.source}
                      type="button"
                      onClick={() => toggleStore(s.source)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal transition cursor-pointer border ${
                        isSelected
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      {isSelected && <Check size={12} weight="light" />}
                      <span>{s.source}</span>
                      <span
                        className={`text-2xs font-mono ${
                          isSelected ? "text-white/70" : "text-neutral-400"
                        }`}
                      >
                        ({s.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sort Select */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-normal">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-normal px-2.5 py-1 rounded-lg border border-neutral-200 focus:outline-none cursor-pointer"
                >
                  <option value="match">Best match</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="sale">On sale first</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Cards Masonry */}
          {sortedItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-200 text-xs text-neutral-500 font-normal">
              Nothing matches these filters.
            </div>
          ) : (
            <Masonry
              items={sortedItems}
              getKey={(item, idx) => `${item.url}-${idx}`}
              renderItem={(item) => (
                <ProductCard
                  item={item}
                  onAddToTeam={() => setSelectedProductForTeam(item)}
                  fallbackCurrency={market.currency}
                />
              )}
            />
          )}

          {/* Also Worth a Look Group */}
          {data.alsoWorthALook && data.alsoWorthALook.length > 0 && (
            <section className="mt-12 pt-8 border-t border-neutral-200 space-y-4 font-normal">
              <h3 className="font-serif text-lg text-neutral-900 font-normal">
                Also worth a look
              </h3>
              <div className="divide-y divide-neutral-100 bg-white rounded-2xl border border-neutral-200/80 overflow-hidden font-normal">
                {data.alsoWorthALook.map((entry, i) => (
                  <a
                    key={i}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 block hover:bg-neutral-50 transition group font-normal"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-serif text-sm text-neutral-900 group-hover:underline font-normal">
                        {entry.title}
                      </h4>
                      <span className="text-2xs font-mono text-neutral-400 shrink-0 font-normal">
                        {entry.source}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-xs text-neutral-500 line-clamp-1 font-normal">
                        {entry.description}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Add To Team Dialog */}
      {selectedProductForTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-normal">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-neutral-900 font-normal">
                Select Team Board
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedProductForTeam(null);
                  setAddedFeedback(null);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-900 transition cursor-pointer font-normal"
              >
                <X size={16} weight="light" />
              </button>
            </div>

            {addedFeedback ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200 font-normal">
                <span>{addedFeedback}</span>
              </div>
            ) : !teams || teams.length === 0 ? (
              <div className="space-y-3 font-normal">
                <p className="text-xs text-neutral-500 font-normal">
                  You need to create a team before adding products.
                </p>
                <Link
                  href="/dashboard"
                  onClick={() => setSelectedProductForTeam(null)}
                  className="block text-center w-full py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer"
                >
                  Create a team first
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto font-normal">
                {teams.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    disabled={addingToTeamId === t._id}
                    onClick={() =>
                      handleAddToTeam(t._id, selectedProductForTeam)
                    }
                    className="w-full p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 text-left transition flex items-center justify-between cursor-pointer text-xs font-normal"
                  >
                    <span>{t.name}</span>
                    {addingToTeamId === t._id ? (
                      <span className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin" />
                    ) : (
                      <Plus size={14} weight="light" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-neutral-400 font-normal">
          Loading Discover...
        </div>
      }
    >
      <DiscoverPageInner />
    </Suspense>
  );
}
