"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useAction, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useTeamModal } from "@/components/app-shell";
import { detectCountry } from "@/lib/detect-country";
import {
  Plus,
  Sparkle,
  Users,
  ArrowSquareOut,
  X,
  Buildings,
  WarningCircle,
} from "@phosphor-icons/react";
import { MarketSwitcher } from "@/components/market-switcher";
import { Masonry } from "@/components/masonry";
import { ProductCard } from "@/components/product-card";
import { getErrorMessage } from "@/lib/rate-limit-error";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.me);
  const teams = useQuery(api.teams.listMine);
  const suggestions = useQuery(api.suggestions.listMine);

  const { openCreateTeam } = useTeamModal();
  const addToTeam = useMutation(api.products.addToTeam);
  const autoSetCountryMutation = useMutation(api.profiles.autoSetCountry);
  const generateSuggestions = useAction(api.suggestions.generate);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Id<"suggestions"> | null>(null);
  const [addingToTeamId, setAddingToTeamId] = useState<Id<"teams"> | null>(null);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [addToTeamError, setAddToTeamError] = useState<string | null>(null);
  const hasAutoSetCountryRef = useRef(false);

  useEffect(() => {
    if (
      !isAuthLoading &&
      isAuthenticated &&
      profile !== undefined &&
      profile !== null &&
      !profile.country &&
      !hasAutoSetCountryRef.current
    ) {
      hasAutoSetCountryRef.current = true;
      void autoSetCountryMutation({ country: detectCountry() });
    }
  }, [isAuthenticated, isAuthLoading, profile, autoSetCountryMutation]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      await generateSuggestions();
    } catch (err: unknown) {
      setGenerateError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToTeam = async (
    teamId: Id<"teams">,
    suggestionId: Id<"suggestions">
  ) => {
    setAddingToTeamId(teamId);
    setAddToTeamError(null);
    try {
      const res = await addToTeam({
        teamId,
        suggestionId,
      });
      setAddedFeedback(
        res.alreadyExisted
          ? "Product is already on team board."
          : "Added to team board!"
      );
      setTimeout(() => {
        setSelectedSuggestion(null);
        setAddedFeedback(null);
      }, 1200);
    } catch (err: unknown) {
      setAddToTeamError(getErrorMessage(err));
    } finally {
      setAddingToTeamId(null);
    }
  };

  const currentCountry = (profile?.country === "IN" ? "IN" : "US") as "IN" | "US";
  const currentCurrency = currentCountry === "IN" ? "INR" : "USD";

  return (
    <div className="max-w-5xl w-full mx-auto space-y-10 selection:bg-neutral-900 selection:text-white font-normal">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal">
            Welcome back, {profile?.name?.split(" ")[0] || "Shopper"}.
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-normal">
            Looking for:{" "}
            <span className="font-normal text-neutral-800">
              &ldquo;{profile?.lookingFor || "Trending Drops"}&rdquo;
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateTeam}
            className="h-10 inline-flex items-center gap-2 px-4 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer shrink-0"
          >
            <Plus size={16} weight="light" />
            <span>New Team</span>
          </button>
        </div>
      </div>

      {/* Teams Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} weight="light" className="text-neutral-700" />
            <h2 className="font-serif text-xl text-neutral-900 font-normal">
              Your Teams &amp; Boards
            </h2>
          </div>
        </div>

        {teams === undefined ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 text-xs font-normal text-neutral-500">
            Loading teams...
          </div>
        ) : teams.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-neutral-200 space-y-3 font-normal">
            <Buildings size={28} weight="light" className="mx-auto text-neutral-400" />
            <p className="text-xs font-normal text-neutral-500">
              You have not joined any shopping teams yet.
            </p>
            <button
              type="button"
              onClick={openCreateTeam}
              className="h-9 inline-flex items-center gap-1.5 px-4 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer"
            >
              <Plus size={14} weight="light" />
              <span>Create your first team</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Link
                key={team._id}
                href={`/team?id=${team._id}`}
                className="group bg-white rounded-2xl p-5 border border-neutral-200 hover:border-neutral-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xs font-mono uppercase text-neutral-500 font-normal">
                      {team.role === "owner" ? "Owner" : "Member"}
                    </span>
                    <ArrowSquareOut
                      size={14}
                      weight="light"
                      className="text-neutral-400 group-hover:text-neutral-900 transition"
                    />
                  </div>
                  <h3 className="font-serif text-lg text-neutral-900 font-normal group-hover:underline truncate">
                    {team.name}
                  </h3>
                </div>
                <p className="text-2xs text-neutral-500 mt-4 font-normal">
                  Click to view voting board &rarr;
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Suggestions ("For You") Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkle size={18} weight="light" className="text-neutral-700" />
            <h2 className="font-serif text-xl text-neutral-900 font-normal">
              For You (Live Deals &amp; Drops)
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <MarketSwitcher variant="pill" />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-9 inline-flex items-center gap-2 px-4 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scouting Deals via Firecrawl...</span>
                </>
              ) : (
                <>
                  <Sparkle size={14} weight="light" />
                  <span>Generate suggestions</span>
                </>
              )}
            </button>
          </div>
        </div>

        {generateError && (
          <p className="text-xs text-neutral-500 font-normal">
            {generateError}
          </p>
        )}

        {suggestions === undefined || isGenerating ? (
          <div className="space-y-4 font-normal">
            {isGenerating && (
              <p className="text-xs text-neutral-500 font-normal">
                Scouting deals via Firecrawl...
              </p>
            )}
            <Masonry
              items={[
                { id: 1, height: "h-[220px]" },
                { id: 2, height: "h-[300px]" },
                { id: 3, height: "h-[260px]" },
                { id: 4, height: "h-[340px]" },
                { id: 5, height: "h-[240px]" },
                { id: 6, height: "h-[290px]" },
              ]}
              getKey={(item) => String(item.id)}
              renderItem={(item) => (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3 animate-pulse">
                  <div className={`w-full ${item.height} bg-neutral-100 rounded-xl`} />
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  <div className="h-4 bg-neutral-100 rounded w-1/4" />
                </div>
              )}
            />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-neutral-200 space-y-3 font-normal">
            <Sparkle size={32} weight="light" className="mx-auto text-neutral-400" />
            <h4 className="font-serif text-base text-neutral-800 font-normal">
              No suggestions generated yet
            </h4>
            <p className="text-xs font-normal text-neutral-500 max-w-md mx-auto">
              Click &ldquo;Generate suggestions&rdquo; above and Cani will scout
              the web with Firecrawl for drops and sales matching your
              interests.
            </p>
          </div>
        ) : (
          <Masonry
            items={suggestions}
            getKey={(item) => item._id}
            renderItem={(item) => (
              <ProductCard
                item={item}
                onAddToTeam={() => {
                  setAddToTeamError(null);
                  setSelectedSuggestion(item._id);
                }}
                fallbackCurrency={currentCurrency}
              />
            )}
          />
        )}
      </section>

      {/* Team Picker Dialog */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 font-normal">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-neutral-900 font-normal">
                Select Team Board
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedSuggestion(null);
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
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSuggestion(null);
                    openCreateTeam();
                  }}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer"
                >
                  Create team
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto font-normal">
                {teams.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    disabled={addingToTeamId === t._id}
                    onClick={() => handleAddToTeam(t._id, selectedSuggestion)}
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
