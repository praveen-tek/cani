"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { getMarket } from "../../../../convex/lib/markets";
import { MarketSwitcher } from "@/components/market-switcher";
import { Masonry } from "@/components/masonry";
import { ProductCard, ProductCardItem } from "@/components/product-card";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import { Loader } from "@/components/ui/loader";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Source, SourceTrigger, SourceContent } from "@/components/ui/source";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ArrowCounterClockwise,
  ArrowUp,
  Check,
  Eye,
  Plus,
  Stop,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { getErrorMessage, getRetryAfterMs } from "@/lib/rate-limit-error";

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
  { id: 1, ratio: "aspect-[4/3]" },
  { id: 2, ratio: "aspect-video" },
  { id: 3, ratio: "aspect-[4/3]" },
  { id: 4, ratio: "aspect-[3/2]" },
  { id: 5, ratio: "aspect-video" },
  { id: 6, ratio: "aspect-[4/3]" },
];

function DiscoverPageInner() {
  const profile = useQuery(api.profiles.me);
  const teams = useQuery(api.teams.listMine);
  const searchAction = useAction(api.discover.search);
  const addToTeamMutation = useMutation(api.products.addToTeam);
  const createSearchWatch = useAction(api.monitors.createSearchWatch);
  const removeMonitor = useAction(api.monitors.remove);

  const [inputQuery, setInputQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [burstCountdown, setBurstCountdown] = useState<number | null>(null);
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [isWatchingSearchLoading, setIsWatchingSearchLoading] = useState(false);

  useEffect(() => {
    if (burstCountdown === null || burstCountdown <= 0) return;
    const timer = setInterval(() => {
      setBurstCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [burstCountdown]);

  const existingSearchWatch = useQuery(api.monitors.getWatchStatusForQuery, {
    query: data?.query || "",
  });

  const handleToggleSearchWatch = async () => {
    if (!data?.query) return;
    setIsWatchingSearchLoading(true);
    try {
      if (existingSearchWatch) {
        await removeMonitor({ monitorId: existingSearchWatch._id });
      } else {
        await createSearchWatch({ query: data.query });
      }
    } catch (e) {
      setSearchError(getErrorMessage(e));
    } finally {
      setIsWatchingSearchLoading(false);
    }
  };

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
  const [addToTeamError, setAddToTeamError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef<number>(0);

  // Keep results padding-bottom in sync with floating composer height
  useEffect(() => {
    const el = composerRef.current;
    const container = resultsContainerRef.current;
    if (!el || !container) return;
    const observer = new ResizeObserver(() => {
      const h = el.getBoundingClientRect().height;
      container.style.paddingBottom = `${h + 32}px`;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const handleClearResults = () => {
    setData(null);
    setSearchError(null);
    setSelectedStores([]);
    try {
      sessionStorage.removeItem("cani_discover_cache");
    } catch {
      // ignore
    }
  };

  const handleClearAll = () => {
    handleClearResults();
    setInputQuery("");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (inputQuery) {
          setInputQuery("");
        } else if (data !== null) {
          handleClearResults();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data, inputQuery]);

  const handleStop = () => {
    requestIdRef.current++;
    setIsSearching(false);
  };

  const handleSearch = async (queryToRun: string) => {
    const trimmed = queryToRun.trim();
    if (!trimmed) return;

    const currentRequestId = ++requestIdRef.current;
    setIsSearching(true);
    setSearchError(null);

    // Scroll results area to top upon new search
    resultsContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });

    try {
      const res = await searchAction({ query: trimmed });
      if (currentRequestId !== requestIdRef.current) return;
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
      if (currentRequestId === requestIdRef.current) {
        const msg = getErrorMessage(err);
        setSearchError(msg);
        const retryMs = getRetryAfterMs(err);
        if (retryMs && retryMs > 0 && retryMs <= 10000) {
          setBurstCountdown(Math.ceil(retryMs / 1000));
        }
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsSearching(false);
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
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

  const resetStoreFilters = () => {
    if (data?.stores) {
      setSelectedStores(data.stores.map((s) => s.source));
    }
  };

  const handleAddToTeam = async (
    teamId: Id<"teams">,
    item: ProductCardItem
  ) => {
    setAddingToTeamId(teamId);
    setAddToTeamError(null);
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
      setAddToTeamError(getErrorMessage(err));
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

  const renderComposer = () => (
    <div className="w-full flex flex-col gap-1.5 font-normal">
      {searchError && (
        <div className="text-xs text-neutral-500 font-normal px-2">
          {burstCountdown !== null && burstCountdown > 0
            ? `Try again in ${burstCountdown}s`
            : searchError}
        </div>
      )}
      <PromptInput
        value={inputQuery}
        onValueChange={setInputQuery}
        isLoading={isSearching}
        onSubmit={() => handleSearch(inputQuery)}
        maxHeight={160}
        className="w-full rounded-3xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-none"
      >
        <div className="flex items-start gap-2">
          <PromptInputTextarea
            ref={textareaRef}
            placeholder="Search for anything to buy"
            className="text-base font-normal text-neutral-900 placeholder:text-neutral-400 min-h-[28px]"
          />
          {inputQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setInputQuery("");
                textareaRef.current?.focus();
              }}
              className="p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition cursor-pointer shrink-0 mt-0.5"
              title="Clear text"
            >
              <X size={16} weight="light" />
            </button>
          )}
        </div>

        <PromptInputActions className="pt-2">
          <MarketSwitcher variant="pill" />

          <PromptInputAction
            tooltip={isSearching ? "Stop search" : "Search"}
            side="top"
          >
            <button
              type={isSearching ? "button" : "submit"}
              disabled={
                (!isSearching && !inputQuery.trim()) ||
                (burstCountdown !== null && burstCountdown > 0)
              }
              onClick={(e) => {
                if (isSearching) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStop();
                }
              }}
              className="w-9 h-9 rounded-full bg-neutral-900 hover:bg-black text-white flex items-center justify-center disabled:opacity-30 disabled:hover:bg-neutral-900 transition cursor-pointer disabled:cursor-not-allowed shrink-0 shadow-none"
              aria-label={isSearching ? "Stop search" : "Send search"}
            >
              {isSearching ? (
                <Stop size={16} weight="light" />
              ) : (
                <ArrowUp size={18} weight="regular" />
              )}
            </button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col overflow-hidden min-h-0 selection:bg-neutral-900 selection:text-white font-normal">
      {/* Idle State: Centered Vertically and Horizontally */}
      {!hasResults && !isSearching ? (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center -translate-y-4 sm:-translate-y-6">
            <div className="text-center space-y-2 mb-6">
              <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal tracking-tight">
                What are you looking for?
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 font-normal">
                Describe it the way you would say it. Cani searches the stores for you.
              </p>
            </div>

            {renderComposer()}

            {/* Example Chips using PromptSuggestion */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              {exampleChips.map((chip) => (
                <PromptSuggestion
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  className="rounded-full border border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50 text-neutral-700 text-xs sm:text-sm font-normal transition cursor-pointer shadow-none px-3.5 py-1.5 h-auto"
                >
                  {chip}
                </PromptSuggestion>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Docked / Results State: composer floats absolutely above scrollable results */
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {/* 1. Results area: scrolls behind the floating composer */}
          <div
            ref={resultsContainerRef}
            className="absolute inset-0 overflow-y-auto overscroll-contain px-6 sm:px-8 pt-6 w-full discover-scrollarea"
            style={{ paddingBottom: "160px" }}
          >
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Skeletons when searching and no data yet */}
              {isSearching && !data && (
                <div className="space-y-6 font-normal">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-500 font-normal">
                    <Loader variant="typing" size="sm" />
                    <TextShimmer duration={2.5} spread={25}>
                      Searching {market.stores.map((s) => s.label).join(", ")}...
                    </TextShimmer>
                  </div>
                  <Masonry
                    items={SKELETON_ITEMS}
                    getKey={(item) => String(item.id)}
                    renderItem={(item) => (
                      <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3 animate-pulse shadow-none">
                        <div className={`w-full ${item.ratio} bg-neutral-100 rounded-xl`} />
                        <div className="h-4 bg-neutral-100 rounded w-3/4" />
                        <div className="h-3 bg-neutral-100 rounded w-1/2" />
                        <div className="h-4 bg-neutral-100 rounded w-1/4" />
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Results view */}
              {data && (
                <div className="space-y-6 font-normal">
                  {/* Results Header: One clean row + store filter chips */}
                  <div className="space-y-3 pb-3 border-b border-neutral-200 font-normal">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs text-neutral-500 font-normal">
                        <strong className="font-normal text-neutral-900">{filteredItems.length}</strong>{" "}
                        result{filteredItems.length !== 1 ? "s" : ""} for &ldquo;{data.query}&rdquo;
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={handleToggleSearchWatch}
                          disabled={isWatchingSearchLoading}
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl transition cursor-pointer font-normal ${
                            existingSearchWatch
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                          }`}
                          title={
                            existingSearchWatch
                              ? "Watching this search for new deals and launches (click to stop)"
                              : "Watch this search with Firecrawl"
                          }
                        >
                          {existingSearchWatch ? (
                            <>
                              <Check size={13} weight="light" className="text-emerald-700" />
                              <span>Watching search</span>
                            </>
                          ) : (
                            <>
                              <Eye size={13} weight="light" />
                              <span>Watch search</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition cursor-pointer font-normal"
                        >
                          <ArrowCounterClockwise size={13} weight="light" />
                          <span>Clear results</span>
                        </button>

                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-normal">
                          <span>Sort:</span>
                          <Select
                            value={sortBy}
                            onValueChange={(val) =>
                              setSortBy(
                                val as "match" | "price-asc" | "price-desc" | "sale"
                              )
                            }
                          >
                            <SelectTrigger className="w-36 h-7 text-xs bg-white border-neutral-200 font-normal">
                              <SelectValue placeholder="Best match" />
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="match">Best match</SelectItem>
                              <SelectItem value="price-asc">Price: Low to High</SelectItem>
                              <SelectItem value="price-desc">Price: High to Low</SelectItem>
                              <SelectItem value="sale">On sale first</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Store Filter Chips */}
                    {data.stores && data.stores.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        {data.stores.map((s) => {
                          const isSelected = selectedStores.includes(s.source);
                          return (
                            <button
                              key={s.source}
                              type="button"
                              onClick={() => toggleStore(s.source)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal transition cursor-pointer border shrink-0 ${
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
                    )}
                  </div>

                  {/* Product Cards Masonry */}
                  {sortedItems.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-200 text-xs text-neutral-500 font-normal space-y-2">
                      <p>Nothing matches these filters.</p>
                      <button
                        type="button"
                        onClick={resetStoreFilters}
                        className="text-neutral-900 underline hover:text-neutral-700 transition cursor-pointer font-normal text-xs"
                      >
                        Reset filters
                      </button>
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

                  {/* Also Worth a Look Group with Prompt-Kit Source */}
                  {data.alsoWorthALook && data.alsoWorthALook.length > 0 && (
                    <section className="mt-12 pt-8 border-t border-neutral-200 space-y-3 font-normal">
                      <h3 className="font-serif text-lg text-neutral-900 font-normal">
                        Also worth a look
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 font-normal">
                        {data.alsoWorthALook.map((entry, i) => (
                          <Source key={i} href={entry.url}>
                            <SourceTrigger
                              showFavicon
                              label={entry.title || undefined}
                              className="bg-white hover:bg-neutral-50 border border-neutral-200 font-normal text-neutral-700 max-w-xs"
                            />
                            <SourceContent
                              title={entry.title}
                              description={entry.description}
                            />
                          </Source>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Floating composer: sits above the scroll area, no background strip */}
          <div
            className="absolute inset-x-0 bottom-0 z-20 pointer-events-none px-6 sm:px-8 pb-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <div ref={composerRef} className="max-w-3xl mx-auto w-full pointer-events-auto">
              {renderComposer()}
            </div>
          </div>
        </div>
      )}

      {/* Add To Team Dialog */}
      {selectedProductForTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 font-normal">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-neutral-900 font-normal">
                Select Team Board
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedProductForTeam(null);
                  setAddedFeedback(null);
                  setAddToTeamError(null);
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer font-normal"
              >
                <X size={16} weight="light" />
              </button>
            </div>

            {addToTeamError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200 font-normal">
                <WarningCircle size={16} weight="light" />
                <span>{addToTeamError}</span>
              </div>
            )}

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
