"use client";

import React, { Component, Suspense, useState, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Archive,
  ArrowLeft,
  ArrowSquareOut,
  CaretDown,
  CaretUp,
  Check,
  Copy,
  EnvelopeSimple,
  LinkSimple,
  Plus,
  Trash,
  Users,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { getErrorMessage } from "@/lib/rate-limit-error";

class RoomErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || "An error occurred";
      const isNotMember = message.toLowerCase().includes("not a member");
      const heading = isNotMember
        ? "You are not a member of this room"
        : "Unable to load room";

      return (
        <div className="flex items-center justify-center p-8 font-normal">
          <div className="bg-white p-8 rounded-3xl border border-neutral-200 text-center space-y-4 max-w-sm">
            <h3 className="font-serif text-xl text-neutral-900 font-normal">
              {heading}
            </h3>
            <p className="text-xs text-neutral-500 font-normal">
              {message}
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function formatPrice(amount?: number, currency = "USD", locale = "en-US") {
  if (typeof amount !== "number" || isNaN(amount)) return null;
  const isINR = currency === "INR";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: isINR ? 0 : 2,
      minimumFractionDigits: isINR ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function TeamBoardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamIdStr = searchParams.get("id");
  const teamId = (teamIdStr || "") as Id<"teams">;

  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const shouldFetch = !isAuthLoading && isAuthenticated && Boolean(teamIdStr);

  const profile = useQuery(api.profiles.me);
  const teamData = useQuery(
    api.teams.get,
    shouldFetch ? { teamId } : "skip"
  );
  const products = useQuery(
    api.products.listForTeam,
    shouldFetch ? { teamId } : "skip"
  );
  const emailInvites = useQuery(
    api.invites.listEmailInvites,
    shouldFetch ? { teamId } : "skip"
  );

  const castVote = useMutation(api.votes.cast);
  const removeProduct = useMutation(api.products.remove);
  const createInvite = useMutation(api.invites.create);
  const sendEmailInvite = useAction(api.invites.sendEmailInvite);
  const addCustomProduct = useMutation(api.products.addToTeam);
  const addProductByUrl = useAction(api.products.addByUrl);
  const archiveTeamMutation = useMutation(api.teams.archive);

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [productToRemove, setProductToRemove] = useState<Id<"products"> | null>(null);
  const [isRemovingProduct, setIsRemovingProduct] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<{ productId: Id<"products">; message: string } | null>(null);

  const [pasteUrl, setPasteUrl] = useState("");
  const [isAddingByUrl, setIsAddingByUrl] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteScrapedNotice, setPasteScrapedNotice] = useState<string | null>(null);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState<string | null>(null);

  const currentCountry = (profile?.country === "IN" ? "IN" : "US") as "IN" | "US";
  const currencySymbol = currentCountry === "IN" ? "₹" : "$";

  if (!teamIdStr) {
    return (
      <div className="flex items-center justify-center p-8 font-normal">
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 text-center space-y-4 max-w-sm">
          <h3 className="font-serif text-xl text-neutral-900 font-normal">
            No team selected
          </h3>
          <p className="text-xs text-neutral-500 font-normal">
            Please provide a valid team ID in the URL parameter.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (teamData === undefined) {
    return (
      <div className="flex items-center justify-center p-12 font-normal">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          <span className="text-xs text-neutral-500 font-mono font-normal">
            Loading team board...
          </span>
        </div>
      </div>
    );
  }

  const handleGenerateInvite = async () => {
    setIsCreatingInvite(true);
    setInviteError(null);
    try {
      const res = await createInvite({ teamId });
      const fullUrl = `${window.location.origin}/join/?code=${res.code}`;
      setInviteUrl(fullUrl);
    } catch (err: unknown) {
      setInviteError(getErrorMessage(err));
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const res = await sendEmailInvite({
        teamId,
        email: emailInput.trim(),
      });
      if (res.status === "sent") {
        setEmailSuccess(`Invite sent to ${res.masked}`);
        setEmailInput("");
      } else {
        setEmailError("Failed to deliver invite email.");
      }
    } catch (err: unknown) {
      setEmailError(getErrorMessage(err));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleArchiveTeam = async () => {
    setIsArchiving(true);
    setArchiveError(null);
    try {
      await archiveTeamMutation({ teamId });
      setShowArchiveConfirm(false);
      router.push("/dashboard");
    } catch (err: unknown) {
      setArchiveError(getErrorMessage(err));
      setIsArchiving(false);
    }
  };

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVote = async (productId: Id<"products">, value: 1 | -1) => {
    setBoardError(null);
    setVoteError(null);
    try {
      await castVote({ productId, value });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setVoteError({ productId, message: msg });
      setTimeout(() => setVoteError(null), 4000);
    }
  };

  const handleConfirmRemoveProduct = async () => {
    if (!productToRemove) return;
    setIsRemovingProduct(true);
    setBoardError(null);
    try {
      await removeProduct({ productId: productToRemove });
      setProductToRemove(null);
    } catch (err: unknown) {
      setBoardError(getErrorMessage(err));
    } finally {
      setIsRemovingProduct(false);
    }
  };

  const handlePasteUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteUrl.trim()) return;

    setIsAddingByUrl(true);
    setPasteError(null);
    setPasteScrapedNotice(null);
    try {
      const res = await addProductByUrl({
        teamId,
        url: pasteUrl.trim(),
      });
      if (res.scraped === false) {
        setPasteScrapedNotice(
          "Added without details. Product details are unavailable right now."
        );
        setTimeout(() => setPasteScrapedNotice(null), 6000);
      }
      setPasteUrl("");
    } catch (err: unknown) {
      setPasteError(getErrorMessage(err));
    } finally {
      setIsAddingByUrl(false);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customUrl.trim()) return;

    setIsAddingProduct(true);
    setAddProductError(null);
    try {
      const priceNum = customPrice ? parseFloat(customPrice) : undefined;
      await addCustomProduct({
        teamId,
        customProduct: {
          title: customTitle.trim(),
          url: customUrl.trim(),
          price: isNaN(priceNum as number) ? undefined : priceNum,
        },
      });
      setCustomTitle("");
      setCustomUrl("");
      setCustomPrice("");
      setShowAddProductModal(false);
    } catch (err: unknown) {
      setAddProductError(getErrorMessage(err));
    } finally {
      setIsAddingProduct(false);
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto space-y-8 selection:bg-neutral-900 selection:text-white font-normal">
      {/* Team Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition text-neutral-700 flex items-center justify-center shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} weight="light" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900 font-normal tracking-tight">
                {teamData.name}
              </h1>
              <span className="text-2xs font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-normal">
                {teamData.currentRole}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-normal">
              Collaborative Voting Board
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {teamData.currentRole === "owner" && (
            <button
              type="button"
              onClick={() => {
                setArchiveError(null);
                setShowArchiveConfirm(true);
              }}
              className="h-10 inline-flex items-center gap-1.5 px-4 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-xs font-normal hover:bg-neutral-50 transition cursor-pointer"
            >
              <Archive size={16} weight="light" />
              <span>Archive room</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddProductModal(true)}
            className="h-10 inline-flex items-center gap-1.5 px-4 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer"
          >
            <Plus size={16} weight="light" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {boardError && (
        <p className="text-xs text-neutral-500 font-normal">
          {boardError}
        </p>
      )}

      {/* Team Header & Invite Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Members list */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200 space-y-3 font-normal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} weight="light" className="text-neutral-700" />
              <h3 className="font-serif text-base text-neutral-900 font-normal">
                Team Members
              </h3>
            </div>
            <span className="text-2xs font-mono text-neutral-500 font-normal">
              {teamData.members.length} member(s)
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pt-1 font-normal">
            {teamData.members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 text-xs font-normal"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center font-normal font-serif text-2xs shrink-0">
                    {m.name?.[0]?.toUpperCase() || "M"}
                  </div>
                  <span className="font-normal text-neutral-800 truncate">{m.name}</span>
                </div>
                <span className="text-2xs font-mono uppercase text-neutral-500 font-normal shrink-0">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Panel */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-neutral-200 flex flex-col justify-between space-y-4 font-normal">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LinkSimple size={18} weight="light" className="text-neutral-700" />
              <h3 className="font-serif text-base text-neutral-900 font-normal">
                Invite Teammates
              </h3>
            </div>
            <p className="text-xs text-neutral-500 font-normal">
              Share a link with friends or family to scout products together and
              vote on drops.
            </p>
          </div>

          {inviteError && (
            <p className="text-xs text-neutral-500 font-normal">
              {inviteError}
            </p>
          )}

          {inviteUrl ? (
            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-2xl border border-neutral-200 font-normal">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-neutral-800 font-mono focus:outline-none font-normal"
              />
              <button
                type="button"
                onClick={handleCopyInvite}
                className="h-9 px-3.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? (
                  <Check size={14} weight="light" />
                ) : (
                  <Copy size={14} weight="light" />
                )}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={handleGenerateInvite}
                disabled={isCreatingInvite}
                className="h-10 inline-flex items-center gap-2 px-4 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer disabled:opacity-50"
              >
                {isCreatingInvite ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LinkSimple size={16} weight="light" />
                )}
                <span>Generate Invite Link</span>
              </button>
            </div>
          )}

          {/* Invite by email */}
          <div className="pt-3 border-t border-neutral-100 space-y-2">
            <div className="flex items-center gap-2">
              <EnvelopeSimple size={16} weight="light" className="text-neutral-700" />
              <span className="text-xs font-medium text-neutral-800">
                Invite by email
              </span>
            </div>
            <form onSubmit={handleSendEmailInvite} className="flex items-center gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 px-3.5 py-2 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isSendingEmail || !emailInput.trim()}
                className="h-9 px-3.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <EnvelopeSimple size={16} weight="light" />
                )}
                <span>Send invite</span>
              </button>
            </form>

            {emailSuccess && (
              <p className="text-xs text-neutral-600 font-normal">
                {emailSuccess}
              </p>
            )}
            {emailError && (
              <p className="text-xs text-neutral-500 font-normal">
                {emailError}
              </p>
            )}

            {emailInvites && emailInvites.length > 0 && (
              <div className="pt-2 space-y-1.5 max-h-32 overflow-y-auto">
                {emailInvites.map((inv) => (
                  <div
                    key={inv._id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-50 text-xs font-normal text-neutral-700"
                  >
                    <span className="font-mono text-2xs truncate max-w-[180px] sm:max-w-[240px]">
                      {inv.email}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 text-2xs font-mono text-neutral-500">
                      <span
                        className={
                          inv.status === "sent"
                            ? "text-neutral-900"
                            : "text-neutral-500"
                        }
                      >
                        {inv.status === "sent" ? "Sent" : "Failed"}
                      </span>
                      <span>•</span>
                      <span>{formatRelativeTime(inv.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Board Grid */}
      <section className="space-y-4 font-normal">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-neutral-900 font-normal">
            Product Board
          </h2>
          <span className="text-2xs text-neutral-500 font-mono font-normal">
            Sorted by score
          </span>
        </div>

        {/* Paste Product Link Input */}
        <div className="space-y-2 font-normal">
          <form onSubmit={handlePasteUrlSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                required
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
                placeholder="Paste a product link"
                className="w-full h-10 px-4 bg-white border border-neutral-200 rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isAddingByUrl || !pasteUrl.trim()}
              className="h-10 px-5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {isAddingByUrl ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus size={16} weight="light" />
                  <span>Add</span>
                </>
              )}
            </button>
          </form>
          {pasteError && (
            <p className="text-xs text-neutral-500 font-normal">
              {pasteError}
            </p>
          )}
          {pasteScrapedNotice && (
            <p className="text-xs text-neutral-500 font-normal">
              {pasteScrapedNotice}
            </p>
          )}
        </div>

        {products === undefined ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 text-xs font-normal text-neutral-500">
            Loading board...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-neutral-200 space-y-3 font-normal">
            <h4 className="font-serif text-lg text-neutral-800 font-normal">
              No products on this board yet
            </h4>
            <p className="text-xs text-neutral-500 max-w-md mx-auto font-normal">
              Add suggestions from your dashboard or paste a product link above to pin it to the board.
            </p>
            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="h-10 inline-flex items-center gap-1.5 px-4 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer"
            >
              <Plus size={16} weight="light" />
              <span>Add custom product</span>
            </button>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-0">
            {products.map((item) => {
              const itemCurrency = item.currency || (currentCountry === "IN" ? "INR" : "USD");
              const itemLocale = itemCurrency === "INR" ? "en-IN" : "en-US";
              const formattedSale = formatPrice(item.salePrice, itemCurrency, itemLocale);
              const formattedOrig = formatPrice(item.price, itemCurrency, itemLocale);

              return (
                <div
                  key={item._id}
                  className="break-inside-avoid mb-5 bg-white rounded-3xl border border-neutral-200 overflow-hidden hover:border-neutral-300 transition-all flex flex-col justify-between font-normal"
                >
                  <div>
                    {item.imageUrl ? (
                      <div className="w-full bg-neutral-100 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-auto block"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-28 bg-neutral-100 flex items-center justify-center text-neutral-500 text-xs font-mono font-normal">
                        {item.source}
                      </div>
                    )}

                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between text-2xs font-normal">
                        <span className="font-mono text-neutral-500 uppercase font-normal truncate max-w-[120px]">
                          {item.source}
                        </span>
                        <span className="text-neutral-500 font-normal truncate max-w-[140px]">
                          Added by {item.addedByName}
                        </span>
                      </div>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-serif text-base text-neutral-900 font-normal line-clamp-2 hover:underline block"
                      >
                        {item.title}
                      </a>

                      <div className="flex items-baseline gap-2 pt-1 font-normal">
                        {formattedSale ? (
                          <>
                            <span className="text-base font-normal text-neutral-900 font-mono">
                              {formattedSale}
                            </span>
                            {formattedOrig && (
                              <span className="text-xs text-neutral-500 line-through font-mono font-normal">
                                {formattedOrig}
                              </span>
                            )}
                          </>
                        ) : formattedOrig ? (
                          <span className="text-base font-normal text-neutral-900 font-mono">
                            {formattedOrig}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500 font-mono font-normal">
                            Check store
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Voting and Actions footer */}
                  <div className="p-5 pt-3 border-t border-neutral-100 flex items-center justify-between font-normal">
                    {/* Upvote / Downvote buttons */}
                    <div className="flex items-center gap-1 bg-neutral-50 p-1 rounded-2xl border border-neutral-200 font-normal">
                      <button
                        type="button"
                        onClick={() => handleVote(item._id, 1)}
                        className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-normal ${item.myVote === 1
                            ? "bg-emerald-700 text-white"
                            : "hover:bg-neutral-200 text-neutral-700"
                          }`}
                        title="Upvote"
                      >
                        <CaretUp size={16} weight="light" />
                        <span>{item.upvotes}</span>
                      </button>

                      <span className="font-mono text-xs font-normal px-1 text-neutral-800">
                        {item.score > 0 ? `+${item.score}` : item.score}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleVote(item._id, -1)}
                        className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-normal ${item.myVote === -1
                            ? "bg-rose-700 text-white"
                            : "hover:bg-neutral-200 text-neutral-700"
                          }`}
                        title="Downvote"
                      >
                        <CaretDown size={16} weight="light" />
                        <span>{item.downvotes}</span>
                      </button>
                    </div>

                    {voteError && voteError.productId === item._id && (
                      <span className="text-2xs text-neutral-500 font-normal px-1">
                        {voteError.message}
                      </span>
                    )}

                    <div className="flex items-center gap-2 font-normal">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition font-normal flex items-center justify-center"
                        title="Open product link"
                      >
                        <ArrowSquareOut size={16} weight="light" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setProductToRemove(item._id)}
                        className="w-8 h-8 rounded-xl text-neutral-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer font-normal flex items-center justify-center"
                        title="Remove product"
                      >
                        <Trash size={16} weight="light" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Custom Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 font-normal">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl text-neutral-900 font-normal">
                Pin Product to Board
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddProductModal(false);
                  setAddProductError(null);
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer font-normal"
              >
                <X size={18} weight="light" />
              </button>
            </div>

            {addProductError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200 font-normal">
                <WarningCircle size={16} weight="light" />
                <span>{addProductError}</span>
              </div>
            )}

            <form onSubmit={handleAddProductSubmit} className="space-y-4 font-normal">
              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Salomon XT-6 Black"
                  className="w-full px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1">
                  Storefront URL
                </label>
                <input
                  type="url"
                  required
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://ssense.com/product/..."
                  className="w-full px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1">
                  Target Price ({currencySymbol} optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="e.g. 199.99"
                  className="w-full px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="h-9 px-4 rounded-xl border border-neutral-200 text-xs font-normal text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isAddingProduct || !customTitle.trim() || !customUrl.trim()
                  }
                  className="h-9 px-5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isAddingProduct ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Pin Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Room Confirmation Dialog */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 font-normal">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-neutral-200 space-y-4">
            <h3 className="font-serif text-xl text-neutral-900 font-normal">
              Archive &ldquo;{teamData.name}&rdquo;?
            </h3>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
              It will be hidden from your active sidebar and can be restored at any time from the Archived Rooms page.
            </p>

            {archiveError && (
              <p className="text-xs text-neutral-500 font-normal">
                {archiveError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="h-9 px-4 rounded-xl border border-neutral-200 text-xs font-normal text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={handleArchiveTeam}
                className="h-9 px-5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isArchiving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Archive</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Product Confirmation Dialog */}
      {productToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 font-normal">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-neutral-200 space-y-4">
            <h3 className="font-serif text-xl text-neutral-900 font-normal">
              Remove Product?
            </h3>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
              Are you sure you want to remove this product from the team board?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToRemove(null)}
                className="h-9 px-4 rounded-xl border border-neutral-200 text-xs font-normal text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemovingProduct}
                onClick={handleConfirmRemoveProduct}
                className="h-9 px-5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isRemovingProduct ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Remove</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <RoomErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        }
      >
        <TeamBoardInner />
      </Suspense>
    </RoomErrorBoundary>
  );
}
