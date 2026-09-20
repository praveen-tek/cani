"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Switch } from "@/components/ui/switch";
import {
  ArrowSquareOut,
  Bell,
  Check,
  Clock,
  Eye,
  MagnifyingGlass,
  Pause,
  Play,
  Plus,
  ShoppingBag,
  Sparkle,
  Tag,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { getErrorMessage } from "@/lib/rate-limit-error";

const FREQUENCY_OPTIONS = [
  { label: "Every 30 min", value: "every 30 minutes" },
  { label: "Hourly", value: "hourly" },
  { label: "Daily", value: "daily" },
];

const PRODUCT_GOAL_PRESETS = [
  { label: "Price drop", value: "Alert when the price drops or is discounted." },
  { label: "Back in stock", value: "Alert when this item becomes available or back in stock." },
  { label: "Any change", value: "Alert on any price, sale price, or stock availability change." },
];

const SEARCH_GOAL_PRESETS = [
  { label: "New deals & discounts", value: "Alert when new deals, discounts, or sales matching this search appear." },
  { label: "New launches", value: "Alert when brand new product launches or releases matching this query appear." },
  { label: "Any new match", value: "Alert on any new relevant product or listing found for this query." },
];

export default function WatchPage() {
  const profile = useQuery(api.profiles.me);
  const monitors = useQuery(api.monitors.list, {});
  const alerts = useQuery(api.monitors.getAlerts, { limit: 30 });
  const teams = useQuery(api.teams.listMine);

  const setEmailAlerts = useMutation(api.profiles.setEmailAlerts);
  const createProductWatch = useAction(api.monitors.createProductWatch);
  const createSearchWatch = useAction(api.monitors.createSearchWatch);
  const toggleStatus = useAction(api.monitors.toggleStatus);
  const removeMonitor = useAction(api.monitors.remove);
  const markAlertAsRead = useMutation(api.monitors.markAlertAsRead);
  const markAllAlertsAsRead = useMutation(api.monitors.markAllAlertsAsRead);

  const [activeTab, setActiveTab] = useState<"product" | "search">("product");
  const [url, setUrl] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [goal, setGoal] = useState(PRODUCT_GOAL_PRESETS[0].value);
  const [schedule, setSchedule] = useState("every 30 minutes");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleTabChange = (tab: "product" | "search") => {
    setActiveTab(tab);
    setActionError(null);
    setActionSuccess(null);
    setGoal(tab === "product" ? PRODUCT_GOAL_PRESETS[0].value : SEARCH_GOAL_PRESETS[0].value);
  };

  const handleCreateWatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);

    try {
      const teamId = selectedTeamId ? (selectedTeamId as Id<"teams">) : undefined;
      if (activeTab === "product") {
        if (!url.trim()) {
          throw new Error("Please enter a product URL.");
        }
        await createProductWatch({
          url: url.trim(),
          title: productTitle.trim() || undefined,
          goal: goal.trim() || undefined,
          schedule,
          teamId,
        });
        setUrl("");
        setProductTitle("");
        setActionSuccess("Product monitor created! Firecrawl will check on schedule.");
      } else {
        if (!searchQuery.trim()) {
          throw new Error("Please enter a search query.");
        }
        await createSearchWatch({
          query: searchQuery.trim(),
          goal: goal.trim() || undefined,
          schedule,
          teamId,
        });
        setSearchQuery("");
        setActionSuccess("Search monitor created! Firecrawl will alert on new results.");
      }
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (monitorId: Id<"monitors">) => {
    try {
      await toggleStatus({ monitorId });
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleRemove = async (monitorId: Id<"monitors">) => {
    try {
      await removeMonitor({ monitorId });
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const unreadAlerts = alerts?.filter((a) => !a.read) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-normal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-neutral-900 tracking-tight font-normal">
            Watch &amp; Monitors
          </h1>
          <p className="text-sm text-neutral-500 font-normal mt-1">
            Monitor product price drops and track web searches for new deals and launches in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto bg-white px-4 py-2.5 rounded-2xl border border-neutral-200">
          <label htmlFor="email-alerts-switch" className="text-xs font-normal text-neutral-800 cursor-pointer">
            Email me alerts
          </label>
          <Switch
            id="email-alerts-switch"
            checked={profile?.emailAlerts !== false}
            onCheckedChange={(checked) => setEmailAlerts({ enabled: checked })}
          />
        </div>
      </div>

      {/* Creation Box */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange("product")}
              className={`px-4 py-2 rounded-xl text-xs font-normal transition cursor-pointer flex items-center gap-2 ${
                activeTab === "product"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
              }`}
            >
              <ShoppingBag size={16} weight="light" />
              <span>Watch Product</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("search")}
              className={`px-4 py-2 rounded-xl text-xs font-normal transition cursor-pointer flex items-center gap-2 ${
                activeTab === "search"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
              }`}
            >
              <MagnifyingGlass size={16} weight="light" />
              <span>Watch Search Query</span>
            </button>
          </div>
        </div>

        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
            <WarningCircle size={16} weight="light" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
            <Check size={16} weight="light" className="text-emerald-700" />
            <span>{actionSuccess}</span>
          </div>
        )}

        <form onSubmit={handleCreateWatch} className="space-y-4">
          {activeTab === "product" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-500 font-normal mb-1.5">
                  Product Link (URL) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.amazon.com/dp/... or https://www.myntra.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500 font-normal mb-1.5">
                  Product Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sony WH-1000XM5 Headphones"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-neutral-500 font-normal mb-1.5">
                Search Query *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. mechanical keyboard deals, Nike running shoes discount, RTX 4080 sale"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition"
              />
            </div>
          )}

          {/* Goal & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-neutral-500 font-normal">
                What to look for (Monitoring Goal)
              </label>
              <div className="flex items-center gap-1.5">
                {(activeTab === "product" ? PRODUCT_GOAL_PRESETS : SEARCH_GOAL_PRESETS).map(
                  (preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setGoal(preset.value)}
                      className={`text-2xs px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        goal === preset.value
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                )}
              </div>
            </div>
            <textarea
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition resize-none"
            />
          </div>

          {/* Schedule and Team Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs text-neutral-500 font-normal mb-1.5">
                Check Frequency
              </label>
              <div className="flex items-center gap-2">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSchedule(opt.value)}
                    className={`flex-1 py-2 text-xs rounded-xl border transition cursor-pointer ${
                      schedule === opt.value
                        ? "bg-neutral-900 text-white border-neutral-900 font-medium"
                        : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-500 font-normal mb-1.5">
                Scope / Room (Optional)
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-normal text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
              >
                <option value="">Personal Watchlist</option>
                {teams?.map((t) => (
                  <option key={t._id} value={t._id}>
                    Room: {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-normal bg-neutral-900 text-white hover:bg-black transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Eye size={16} weight="light" />
              <span>{isSubmitting ? "Setting up watch..." : "Start Watching"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Grid: Active Monitors & Real-time Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Monitors List (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-neutral-900 font-normal">
              Active Monitors ({monitors?.length || 0})
            </h2>
          </div>

          {monitors === undefined ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
              ))}
            </div>
          ) : monitors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
              <Eye size={32} weight="light" className="text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-700 font-medium">No active monitors yet</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Paste a product link above or watch a search query to receive real-time alerts when prices drop or new deals appear.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {monitors.map((m) => (
                <div
                  key={m._id}
                  className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-neutral-300 transition"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-2xs">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono uppercase ${
                          m.kind === "product"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {m.kind}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono uppercase ${
                          m.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                        }`}
                      >
                        {m.status}
                      </span>
                      <span className="text-neutral-400 flex items-center gap-1 font-mono">
                        <Clock size={12} weight="light" />
                        {m.schedule}
                      </span>
                    </div>

                    <h3 className="text-sm font-serif text-neutral-900 font-normal truncate">
                      {m.title}
                    </h3>

                    {m.url && (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xs text-neutral-500 hover:text-neutral-800 hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{m.url}</span>
                        <ArrowSquareOut size={12} weight="light" className="shrink-0" />
                      </a>
                    )}

                    {m.query && (
                      <p className="text-2xs text-neutral-500 font-mono">
                        Query: &quot;{m.query}&quot;
                      </p>
                    )}

                    {m.lastPrice !== undefined && (
                      <div className="text-xs font-mono text-neutral-700 pt-1">
                        Tracked price: {m.currency} {m.lastPrice}
                        {m.lastSalePrice !== undefined && (
                          <span className="ml-2 text-emerald-600 font-medium">
                            (Sale: {m.currency} {m.lastSalePrice})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(m._id)}
                      className="h-8 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-2xs flex items-center gap-1.5 transition cursor-pointer"
                      title={m.status === "active" ? "Pause monitor" : "Resume monitor"}
                    >
                      {m.status === "active" ? (
                        <>
                          <Pause size={12} weight="light" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} weight="light" />
                          <span>Resume</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(m._id)}
                      className="h-8 w-8 rounded-xl bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-500 flex items-center justify-center transition cursor-pointer"
                      title="Delete monitor"
                    >
                      <Trash size={14} weight="light" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-Time Alerts Center (1 Col on lg) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-neutral-900 font-normal flex items-center gap-2">
              <Bell size={20} weight="light" />
              <span>Real-Time Alerts</span>
            </h2>
            {unreadAlerts.length > 0 && (
              <button
                type="button"
                onClick={() => markAllAlertsAsRead({})}
                className="text-2xs text-neutral-500 hover:text-neutral-900 underline transition cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {alerts === undefined ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center">
              <Bell size={28} weight="light" className="text-neutral-400 mx-auto mb-2" />
              <p className="text-xs text-neutral-600 font-medium">No alerts yet</p>
              <p className="text-2xs text-neutral-400 mt-1">
                When Firecrawl detects a price drop, stock replenishment, or new launch, you will see notifications here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.map((a) => (
                <div
                  key={a._id}
                  className={`p-3.5 rounded-2xl border transition relative ${
                    a.read
                      ? "bg-white border-neutral-200 text-neutral-600"
                      : "bg-neutral-50 border-neutral-900/20 text-neutral-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-2xs px-2 py-0.5 rounded font-mono uppercase ${
                        a.type === "price_drop"
                          ? "bg-emerald-100 text-emerald-800"
                          : a.type === "back_in_stock"
                          ? "bg-blue-100 text-blue-800"
                          : a.type === "new_result"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-neutral-200 text-neutral-800"
                      }`}
                    >
                      {a.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-2xs text-neutral-400 font-mono">
                      {new Date(a.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h4 className="text-xs font-serif font-normal truncate mt-1">
                    {a.title}
                  </h4>

                  <p className="text-2xs text-neutral-600 mt-0.5">
                    {a.message}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-neutral-100 text-2xs">
                    {a.url ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-900 font-medium hover:underline flex items-center gap-1"
                      >
                        <span>View item</span>
                        <ArrowSquareOut size={12} weight="light" />
                      </a>
                    ) : (
                      <span />
                    )}

                    {!a.read && (
                      <button
                        type="button"
                        onClick={() => markAlertAsRead({ alertId: a._id })}
                        className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
