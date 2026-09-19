"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  ArrowSquareOut,
  CaretDown,
  CaretUp,
  Check,
  Copy,
  LinkSimple,
  Plus,
  Trash,
  Users,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

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

function TeamBoardInner() {
  const searchParams = useSearchParams();
  const teamIdStr = searchParams.get("id");
  const teamId = (teamIdStr || "") as Id<"teams">;

  const teamData = useQuery(
    api.teams.get,
    teamIdStr ? { teamId } : "skip"
  );
  const products = useQuery(
    api.products.listForTeam,
    teamIdStr ? { teamId } : "skip"
  );

  const castVote = useMutation(api.votes.cast);
  const removeProduct = useMutation(api.products.remove);
  const createInvite = useMutation(api.invites.create);
  const addCustomProduct = useMutation(api.products.addToTeam);
  const addProductByUrl = useAction(api.products.addByUrl);

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const [pasteUrl, setPasteUrl] = useState("");
  const [isAddingByUrl, setIsAddingByUrl] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState<string | null>(null);


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
    try {
      const res = await createInvite({ teamId });
      const fullUrl = `${window.location.origin}/join?code=${res.code}`;
      setInviteUrl(fullUrl);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate invite.");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVote = async (productId: Id<"products">, value: 1 | -1) => {
    try {
      await castVote({ productId, value });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to vote.");
    }
  };

  const handleRemoveProduct = async (productId: Id<"products">) => {
    if (
      !confirm(
        "Are you sure you want to remove this product from the team board?"
      )
    )
      return;
    try {
      await removeProduct({ productId });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove product.");
    }
  };

  const handlePasteUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteUrl.trim()) return;

    setIsAddingByUrl(true);
    setPasteError(null);
    try {
      await addProductByUrl({
        teamId,
        url: pasteUrl.trim(),
      });
      setPasteUrl("");
    } catch (err: unknown) {
      setPasteError(
        err instanceof Error ? err.message : "Failed to add product."
      );
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
      setAddProductError(
        err instanceof Error ? err.message : "Failed to add product."
      );
    } finally {
      setIsAddingProduct(false);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8 selection:bg-neutral-900 selection:text-white font-normal">
      {/* Team Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition text-neutral-700"
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
          <button
            type="button"
            onClick={() => setShowAddProductModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-normal hover:bg-neutral-800 transition cursor-pointer"
          >
            <Plus size={14} weight="light" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Team Header & Invite Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Members list */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 space-y-3 font-normal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} weight="light" className="text-neutral-700" />
              <h3 className="font-serif text-base text-neutral-900 font-normal">
                Team Members
              </h3>
            </div>
            <span className="text-2xs font-mono text-neutral-400 font-normal">
              {teamData.members.length} member(s)
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pt-1 font-normal">
            {teamData.members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 text-xs font-normal"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center font-normal font-serif text-2xs">
                    {m.name?.[0]?.toUpperCase() || "M"}
                  </div>
                  <span className="font-normal text-neutral-800">{m.name}</span>
                </div>
                <span className="text-2xs font-mono uppercase text-neutral-400 font-normal">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Panel */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-neutral-200/80 flex flex-col justify-between space-y-4 font-normal">
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
                className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-neutral-800 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer disabled:opacity-50"
              >
                {isCreatingInvite ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LinkSimple size={14} weight="light" />
                )}
                <span>Generate Invite Link</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Board Grid */}
      <section className="space-y-4 font-normal">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-neutral-900 font-normal">
            Product Board
          </h2>
          <span className="text-2xs text-neutral-400 font-mono font-normal">
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
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isAddingByUrl || !pasteUrl.trim()}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {isAddingByUrl ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus size={14} weight="light" />
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
        </div>

        {products === undefined ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 text-xs font-normal text-neutral-400">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer"
            >
              <Plus size={14} weight="light" />
              <span>Add custom product</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((item) => {
              const itemCurrency = item.currency || "USD";
              const itemLocale = itemCurrency === "INR" ? "en-IN" : "en-US";
              const formattedSale = formatPrice(item.salePrice, itemCurrency, itemLocale);
              const formattedOrig = formatPrice(item.price, itemCurrency, itemLocale);

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl border border-neutral-200/80 overflow-hidden hover:border-neutral-300 transition-all flex flex-col justify-between font-normal"
                >
                  <div>
                    {item.imageUrl ? (
                      <div className="relative w-full h-48 bg-neutral-100 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-28 bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs font-mono font-normal">
                        {item.source}
                      </div>
                    )}

                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between text-2xs font-normal">
                        <span className="font-mono text-neutral-400 uppercase font-normal">
                          {item.source}
                        </span>
                        <span className="text-neutral-400 font-normal">
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
                              <span className="text-xs text-neutral-400 line-through font-mono font-normal">
                                {formattedOrig}
                              </span>
                            )}
                          </>
                        ) : formattedOrig ? (
                          <span className="text-base font-normal text-neutral-900 font-mono">
                            {formattedOrig}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400 font-mono font-normal">
                            Check store
                          </span>
                        )}
                      </div>
                    </div>
                  </div>


                {/* Voting and Actions footer */}
                <div className="p-5 pt-3 border-t border-neutral-100 flex items-center justify-between font-normal">
                  {/* Upvote / Downvote buttons */}
                  <div className="flex items-center gap-1 bg-neutral-50 p-1 rounded-2xl border border-neutral-200/80 font-normal">
                    <button
                      type="button"
                      onClick={() => handleVote(item._id, 1)}
                      className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-normal ${
                        item.myVote === 1
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
                      className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-normal ${
                        item.myVote === -1
                          ? "bg-rose-700 text-white"
                          : "hover:bg-neutral-200 text-neutral-700"
                      }`}
                      title="Downvote"
                    >
                      <CaretDown size={16} weight="light" />
                      <span>{item.downvotes}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 font-normal">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition font-normal"
                      title="Open product link"
                    >
                      <ArrowSquareOut size={16} weight="light" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(item._id)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer font-normal"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-normal">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl text-neutral-900 font-normal">
                Pin Product to Board
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-900 transition cursor-pointer font-normal"
              >
                <X size={18} weight="light" />
              </button>
            </div>

            {addProductError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200 font-normal">
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
                  className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-black focus:outline-none transition-all"
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
                  className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-black focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1">
                  Target Price ($ optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="e.g. 199.99"
                  className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-black focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-normal text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isAddingProduct || !customTitle.trim() || !customUrl.trim()
                  }
                  className="px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        </div>
      }
    >
      <TeamBoardInner />
    </Suspense>
  );
}
