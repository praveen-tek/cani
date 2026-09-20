"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Info, Sparkle, Tag, X } from "@phosphor-icons/react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import type React from "react";

const iconVariants: Variants = {
  rest: {
    width: 0,
    opacity: 0,
    x: -6,
    scale: 0.6,
    marginRight: 0,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 28,
      mass: 0.5,
    },
  },
  hover: {
    width: 16,
    opacity: 1,
    x: 0,
    scale: 1,
    marginRight: 6,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 24,
      mass: 0.5,
    },
  },
};

const getPillVariants = (rotateDeg: number): Variants => ({
  rest: {
    y: 0,
    rotate: 0,
    scale: 1,
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 26,
    },
  },
  hover: {
    y: -2,
    rotate: rotateDeg,
    scale: 1.02,
    backgroundColor: "#f9fafb",
    borderColor: "#9ca3af",
    boxShadow: "0 6px 16px -2px rgba(0, 0, 0, 0.08)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 22,
      mass: 0.8,
    },
  },
  press: {
    scale: 0.95,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20,
    },
  },
});

const getStartedVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    backgroundColor: "#000000",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 26,
    },
  },
  hover: {
    y: -2,
    scale: 1.02,
    backgroundColor: "#18181b",
    boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.25)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 22,
      mass: 0.8,
    },
  },
  press: {
    scale: 0.95,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20,
    },
  },
};

type ModalType = "about" | "features" | null;

const navLinks = [
  { modal: "about" as const, label: "about", icon: Info, rotate: -2 },
  { modal: "features" as const, label: "features", icon: Sparkle, rotate: 2 },
  { href: "/pricing", label: "pricing", icon: Tag, rotate: -1 },
];

export default function Navbar() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  // Handle hash navigation (#about or #features)
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash === "#about") {
        setActiveModal("about");
      } else if (hash === "#features") {
        setActiveModal("features");
      }
    };

    window.addEventListener("hashchange", handleHashCheck);
    handleHashCheck();

    return () => {
      window.removeEventListener("hashchange", handleHashCheck);
    };
  }, []);

  // Handle Escape key to close any active modal
  useEffect(() => {
    if (!activeModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModal]);

  return (
    <>
      <nav className="flex items-center justify-between px-8 py-5 bg-white select-none">
        <div className="flex items-center gap-2.5 flex-1">
          {navLinks.map((item) => {
            const { label, icon: Icon, rotate } = item;
            const modalTarget = "modal" in item ? item.modal : null;
            const href = "href" in item ? item.href : undefined;

            return modalTarget ? (
              <motion.button
                key={label}
                type="button"
                onClick={() => setActiveModal(modalTarget)}
                initial="rest"
                animate="rest"
                whileHover="hover"
                whileTap="press"
                variants={getPillVariants(rotate)}
                className="inline-flex items-center justify-center border rounded-full px-4 py-2 text-md text-gray-800 whitespace-nowrap cursor-pointer origin-center"
              >
                <motion.span
                  variants={iconVariants}
                  className="overflow-hidden inline-flex items-center justify-center shrink-0"
                >
                  <Icon size={16} weight="bold" className="shrink-0 text-gray-800" />
                </motion.span>
                <span className="capitalize">{label}</span>
              </motion.button>
            ) : (
              <motion.a
                key={label}
                href={href}
                initial="rest"
                animate="rest"
                whileHover="hover"
                whileTap="press"
                variants={getPillVariants(rotate)}
                className="inline-flex items-center justify-center border rounded-full px-4 py-2 text-md text-gray-800 whitespace-nowrap cursor-pointer origin-center"
              >
                <motion.span
                  variants={iconVariants}
                  className="overflow-hidden inline-flex items-center justify-center shrink-0"
                >
                  <Icon size={16} weight="bold" className="shrink-0 text-gray-800" />
                </motion.span>
                <span className="capitalize">{label}</span>
              </motion.a>
            );
          })}
        </div>

        <Link href="/" className="flex-1 text-center group cursor-pointer block">
          <span className="font-serif text-4xl text-gray-900 tracking-tight transition-transform duration-200 group-hover:scale-102 block">
            Cani
          </span>
          <p className="text-sm text-gray-600">Shop with friends, decide together</p>
        </Link>

        <div className="flex items-center gap-6 flex-1 justify-end">
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
            </span>
            Early access open
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/discover"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Discover
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 transition cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <motion.a
              href="/sign-in"
              initial="rest"
              animate="rest"
              whileHover="hover"
              whileTap="press"
              variants={getStartedVariants}
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-md text-white whitespace-nowrap cursor-pointer origin-center"
            >
              <motion.span
                variants={iconVariants}
                className="overflow-hidden inline-flex items-center justify-center shrink-0"
              >
                <ArrowRight size={16} weight="bold" className="shrink-0 text-white" />
              </motion.span>
              <span>Get started</span>
            </motion.a>
          )}
        </div>
      </nav>

      {/* Simple, Straightforward About Modal Popup */}
      <AnimatePresence>
        {activeModal === "about" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition cursor-pointer"
                aria-label="Close about dialog"
              >
                <X size={18} weight="bold" />
              </button>

              <div className="mb-6">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-400 block mb-2">
                  About Cani
                </span>
                <h2 className="font-serif text-3xl text-gray-900 leading-tight">
                  Shop together, decide easily.
                </h2>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Cani is a shared shopping board. Search stores, add products to a room, vote with friends and get alerts when prices drop.
              </p>

              <div className="space-y-4 border-t border-b border-gray-100 py-6 mb-6">
                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Search across stores
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Find products from Flipkart, Amazon, Myntra, Walmart and Best Buy in one simple search.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Collaborate in rooms
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Create a shared room, invite friends by link or email, and vote on items with live score updates.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Price and launch alerts
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Watch products for price drops or searches for new launches, with alerts in the app and by email.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-mono">
                  cani.shopping // early access
                </p>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 rounded-full bg-black text-white text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simple, Straightforward Features Modal Popup */}
      <AnimatePresence>
        {activeModal === "features" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition cursor-pointer"
                aria-label="Close features dialog"
              >
                <X size={18} weight="bold" />
              </button>

              <div className="mb-6">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-400 block mb-2">
                  Features // Shared Shopping
                </span>
                <h2 className="font-serif text-3xl text-gray-900 leading-tight">
                  Everything you need to decide together.
                </h2>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Cani brings search, shared rooms, group voting, and price drop alerts into one place.
              </p>

              <div className="space-y-4 border-t border-b border-gray-100 py-6 mb-6">
                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Multi-Store Product Search
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Search stores in India and the US with prices, discounts and ratings in your local currency.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Shared Rooms & Live Voting
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Add items from search or paste links from any store. Vote up or down with live score totals.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Scheduled Price & Launch Alerts
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Set watches to check product prices and new launches on a schedule, delivered via email.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Direct Store Links
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Every product card links directly to the retailer so you buy safely on the store's own site.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-mono">
                  Shared shopping board
                </p>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 rounded-full bg-black text-white text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
