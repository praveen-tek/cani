"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import {
  CheckCircle,
  Clock,
  EnvelopeSimple,
  FileText,
  GoogleLogo,
  Info,
  LockKey,
  Plus,
  Question,
  ShieldCheck,
  Sparkle,
  Tag,
  Trash,
  User,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

const POPULAR_CATEGORIES = [
  "Streetwear",
  "Sneakers",
  "Tech & Electronics",
  "Minimalist Home",
  "Outdoor & Trail",
  "Coffee & Espresso",
  "Workwear",
  "Vintage Watches",
  "Audio & Headphones",
  "Desk Setup",
];

export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer);
  const profile = useQuery(api.profiles.me);
  const teams = useQuery(api.teams.listMine);
  const suggestions = useQuery(api.suggestions.listMine);

  const updateProfile = useMutation(api.profiles.update);
  const clearSuggestions = useMutation(api.profiles.clearSuggestions);
  const deleteAccount = useMutation(api.profiles.deleteAccount);

  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(25);
  const [lookingFor, setLookingFor] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterestInput, setCustomInterestInput] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isClearingDeals, setIsClearingDeals] = useState(false);
  const [clearDealsStatus, setClearDealsStatus] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAge(profile.age || 25);
      setLookingFor(profile.lookingFor || "");
      setInterests(profile.interests || []);
    } else if (viewer) {
      setName(viewer.name || "");
    }
  }, [profile, viewer]);

  const handleToggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((i) => i !== tag));
    } else {
      if (interests.length >= 15) return;
      setInterests([...interests, tag]);
    }
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInterestInput.trim();
    if (!clean) return;
    if (interests.includes(clean)) {
      setCustomInterestInput("");
      return;
    }
    if (interests.length >= 15) {
      setSaveStatus({
        type: "error",
        message: "Maximum 15 interest tags allowed.",
      });
      return;
    }
    setInterests([...interests, clean]);
    setCustomInterestInput("");
  };

  const handleRemoveInterest = (tag: string) => {
    setInterests(interests.filter((i) => i !== tag));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSaveStatus({ type: "error", message: "Name is required." });
      return;
    }
    if (interests.length === 0) {
      setSaveStatus({
        type: "error",
        message: "Please select at least one interest.",
      });
      return;
    }
    if (!lookingFor.trim()) {
      setSaveStatus({
        type: "error",
        message: "Looking for description is required.",
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    try {
      await updateProfile({
        name: name.trim(),
        age: Number(age),
        interests,
        lookingFor: lookingFor.trim(),
      });
      setSaveStatus({
        type: "success",
        message: "Profile preferences updated successfully.",
      });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      setSaveStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDeals = async () => {
    if (
      !confirm(
        "Clear all currently scouted suggestions? You can re-generate new deals at any time."
      )
    )
      return;
    setIsClearingDeals(true);
    try {
      const res = await clearSuggestions();
      setClearDealsStatus(`Cleared ${res.count} suggestions from cache.`);
      setTimeout(() => setClearDealsStatus(null), 3000);
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Failed to clear suggestions."
      );
    } finally {
      setIsClearingDeals(false);
    }
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText.trim().toLowerCase() !== "delete my account") {
      setDeleteError("Please type 'delete my account' to confirm.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      await signOut();
      router.push("/");
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete account."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-10 selection:bg-neutral-900 selection:text-white font-normal pb-16">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          {viewer?.image ? (
            <img
              src={viewer.image}
              alt={viewer.name || "User"}
              className="w-16 h-16 rounded-full object-cover shrink-0 border border-neutral-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-neutral-100 text-neutral-800 font-serif text-2xl flex items-center justify-center font-normal shrink-0 border border-neutral-200">
              {viewer?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}

          <div className="space-y-1">
            <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900 font-normal">
              {profile?.name || viewer?.name || "Shopper"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-normal">
              <EnvelopeSimple size={14} weight="light" />
              <span>{viewer?.email || "Connected via Google"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
            <span className="block text-xs font-mono text-neutral-900 font-normal">
              {teams?.length || 0}
            </span>
            <span className="text-2xs text-neutral-500 font-normal">
              Teams
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
            <span className="block text-xs font-mono text-neutral-900 font-normal">
              {suggestions?.length || 0}
            </span>
            <span className="text-2xs text-neutral-500 font-normal">
              Scouted Deals
            </span>
          </div>
        </div>
      </div>

      {/* Shopping Preferences Form */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkle size={20} weight="light" className="text-neutral-700" />
            <h2 className="font-serif text-xl text-neutral-900 font-normal">
              Shopping Preferences &amp; Interests
            </h2>
          </div>
          <span className="text-2xs font-mono text-neutral-400 font-normal">
            Used for Firecrawl searches
          </span>
        </div>

        {saveStatus && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border font-normal ${
              saveStatus.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {saveStatus.type === "success" ? (
              <CheckCircle size={16} weight="light" className="shrink-0" />
            ) : (
              <WarningCircle size={16} weight="light" className="shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6 font-normal">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-normal text-neutral-700">
                Display Name
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-neutral-700">
                Age
              </label>
              <input
                type="number"
                min={13}
                max={120}
                required
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-normal text-neutral-700">
              Primary Focus (&ldquo;Looking For&rdquo;)
            </label>
            <p className="text-2xs text-neutral-500">
              Describe the products, aesthetic, or items you want Cani to scout
              across stores.
            </p>
            <textarea
              rows={3}
              required
              maxLength={300}
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="e.g. Salomon trail shoes, mechanical keyboards, Arc'teryx outerwear on sale..."
              className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-normal text-neutral-700">
              Interest Tags ({interests.length}/15)
            </label>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              {interests.length === 0 ? (
                <span className="text-2xs text-neutral-400 p-1">
                  No interests selected yet. Click from suggested categories
                  below or type a custom tag.
                </span>
              ) : (
                interests.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-normal"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(tag)}
                      className="hover:text-neutral-300 transition cursor-pointer"
                    >
                      <X size={12} weight="light" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customInterestInput}
                onChange={(e) => setCustomInterestInput(e.target.value)}
                placeholder="Add custom interest tag..."
                maxLength={30}
                className="flex-1 px-4 py-2 bg-neutral-50 text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                disabled={!customInterestInput.trim()}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-normal transition disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus size={14} weight="light" />
                <span>Add Tag</span>
              </button>
            </div>

            {/* Suggested Categories */}
            <div className="space-y-1.5 pt-2">
              <span className="text-2xs text-neutral-400 font-normal">
                Suggested categories:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CATEGORIES.map((cat) => {
                  const isSelected = interests.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleToggleInterest(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-normal transition cursor-pointer border ${
                        isSelected
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-neutral-100">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle size={16} weight="light" />
              )}
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </section>

      {/* Account & Authentication Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 space-y-5 font-normal">
        <div className="flex items-center gap-2.5">
          <LockKey size={20} weight="light" className="text-neutral-700" />
          <h2 className="font-serif text-xl text-neutral-900 font-normal">
            Account &amp; Security
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GoogleLogo size={20} weight="light" className="text-neutral-700" />
              <div>
                <p className="text-xs text-neutral-900 font-normal">
                  Google Authentication
                </p>
                <p className="text-2xs text-neutral-500 font-normal">
                  Primary Single Sign-On Provider
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-2xs font-normal border border-emerald-200">
              Connected
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} weight="light" className="text-neutral-700" />
              <div>
                <p className="text-xs text-neutral-900 font-normal">
                  Session Status
                </p>
                <p className="text-2xs text-neutral-500 font-normal">
                  Signed in securely
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-xs text-neutral-600 hover:text-neutral-900 underline transition font-normal cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      {/* Help, FAQ & Support Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 space-y-6 font-normal">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Question size={20} weight="light" className="text-neutral-700" />
            <h2 className="font-serif text-xl text-neutral-900 font-normal">
              Help &amp; Frequently Asked Questions
            </h2>
          </div>
          <span className="text-2xs font-mono text-neutral-400 font-normal">
            Cani Guide
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-neutral-200 space-y-1.5">
            <h3 className="text-xs text-neutral-900 font-normal flex items-center gap-2">
              <Sparkle size={14} weight="light" className="text-neutral-600" />
              <span>How does Cani find deals and drops?</span>
            </h3>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
              Cani uses Firecrawl search automation to continuously scout
              curated storefronts and marketplaces matching your &ldquo;Looking
              For&rdquo; interests and category tags.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-200 space-y-1.5">
            <h3 className="text-xs text-neutral-900 font-normal flex items-center gap-2">
              <UsersThree size={14} weight="light" className="text-neutral-600" />
              <span>How does team voting work?</span>
            </h3>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
              When you add a product suggestion or custom URL to a team board,
              all team members can upvote or downvote the item in real time to
              help rank the best purchases.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-200 space-y-1.5">
            <h3 className="text-xs text-neutral-900 font-normal flex items-center gap-2">
              <Tag size={14} weight="light" className="text-neutral-600" />
              <span>Can I pin any shopping link?</span>
            </h3>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
              Yes. Inside any team board, click &ldquo;Add Product&rdquo; to pin
              any storefront URL, title, and target price directly to your
              collaborative board.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-800 font-normal">
              Have questions or feedback?
            </p>
            <p className="text-2xs text-neutral-500 font-normal">
              Our support team is always here to assist.
            </p>
          </div>
          <a
            href="mailto:support@cani.app"
            className="px-4 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-normal text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            Contact Support
          </a>
        </div>
      </section>

      {/* Privacy, Compliance & Legal (P&C) Links */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 space-y-4 font-normal">
        <div className="flex items-center gap-2.5">
          <FileText size={20} weight="light" className="text-neutral-700" />
          <h2 className="font-serif text-xl text-neutral-900 font-normal">
            Legal &amp; Privacy Policies
          </h2>
        </div>
        <p className="text-xs text-neutral-500 font-normal">
          Review our terms, compliance frameworks, security certifications, and
          data handling standards.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <Link
            href="/terms"
            className="p-3 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-xs font-normal text-neutral-700 flex items-center justify-between"
          >
            <span>Terms of Service</span>
            <span className="text-neutral-400">&rarr;</span>
          </Link>
          <Link
            href="/privacy"
            className="p-3 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-xs font-normal text-neutral-700 flex items-center justify-between"
          >
            <span>Privacy Policy</span>
            <span className="text-neutral-400">&rarr;</span>
          </Link>
          <Link
            href="/security"
            className="p-3 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-xs font-normal text-neutral-700 flex items-center justify-between"
          >
            <span>Security Standards</span>
            <span className="text-neutral-400">&rarr;</span>
          </Link>
          <Link
            href="/cookies"
            className="p-3 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-xs font-normal text-neutral-700 flex items-center justify-between"
          >
            <span>Cookie Settings</span>
            <span className="text-neutral-400">&rarr;</span>
          </Link>
          <Link
            href="/subprocessors"
            className="p-3 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-xs font-normal text-neutral-700 flex items-center justify-between"
          >
            <span>Subprocessors</span>
            <span className="text-neutral-400">&rarr;</span>
          </Link>
          <Link
            href="/pricing"
            className="p-3 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-xs font-normal text-neutral-700 flex items-center justify-between"
          >
            <span>Pricing &amp; Plans</span>
            <span className="text-neutral-400">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-red-200/80 space-y-5 font-normal">
        <div className="flex items-center gap-2.5">
          <Trash size={20} weight="light" className="text-red-600" />
          <h2 className="font-serif text-xl text-red-700 font-normal">
            Danger Zone
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-red-50/40 border border-red-100">
            <div>
              <p className="text-xs font-normal text-neutral-900">
                Clear Scouted Deals Cache
              </p>
              <p className="text-2xs text-neutral-500 font-normal">
                Reset your &ldquo;For You&rdquo; suggested deals history.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearDeals}
              disabled={isClearingDeals}
              className="px-4 py-2 rounded-xl bg-white border border-red-200 text-xs text-red-700 font-normal hover:bg-red-50 transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isClearingDeals ? "Clearing..." : "Clear Deals"}
            </button>
          </div>

          {clearDealsStatus && (
            <p className="text-2xs text-emerald-700 font-normal">
              {clearDealsStatus}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-red-50/40 border border-red-100">
            <div>
              <p className="text-xs font-normal text-neutral-900">
                Delete Account
              </p>
              <p className="text-2xs text-neutral-500 font-normal">
                Permanently delete your account, preferences, and all team
                memberships.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-normal hover:bg-red-700 transition cursor-pointer shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </section>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-normal">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl text-red-700 font-normal">
                Delete Account
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-900 transition cursor-pointer"
              >
                <X size={18} weight="light" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 font-normal leading-relaxed">
              This action is permanent. All your profile settings, shopping
              history, votes, and owned teams will be deleted immediately.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200 font-normal">
                <WarningCircle size={16} weight="light" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1">
                  Type <span className="font-mono text-neutral-900">delete my account</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete my account"
                  className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-xs font-normal text-neutral-900 rounded-xl border border-neutral-200 focus:border-red-600 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-normal text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isDeleting ||
                    deleteConfirmText.trim().toLowerCase() !==
                      "delete my account"
                  }
                  className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-normal hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isDeleting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Permanently Delete</span>
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
