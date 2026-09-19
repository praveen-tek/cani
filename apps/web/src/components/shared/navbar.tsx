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
          <h1 className="font-serif text-4xl text-gray-900 tracking-tight transition-transform duration-200 group-hover:scale-102">
            Cani
          </h1>
          <p className="text-sm text-gray-600">Agentic Way of Shopping</p>
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
                  Shopping on your terms.
                </h2>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Cani is an autonomous shopping assistant designed to replace manual tab-refreshing, price checking, and missing out on limited product drops.
              </p>

              <div className="space-y-4 border-t border-b border-gray-100 py-6 mb-6">
                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Zero spam, 100% intent
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    You only hear from Cani when your exact condition (specific size, color, or price drop threshold) is validated.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Works across any storefront
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    No store partnerships or APIs required. Pin any link from Shopify, Amazon, SSENSE, Nike, or local boutiques.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Privacy by default
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    We only monitor the URLs you ask us to track. No browser history scraping and no selling your shopping data.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-mono">
                  cani.shopping // v1.0
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
                  Features // Autonomous Agent
                </span>
                <h2 className="font-serif text-3xl text-gray-900 leading-tight">
                  Built to watch what you'd rather not.
                </h2>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Cani combines background browser automation, visual diffing, and intent reasoning into one agent.
              </p>

              <div className="space-y-4 border-t border-b border-gray-100 py-6 mb-6">
                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Autonomous SKU & Restock Tracking
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Monitors specific sizes, colors, and variant buttons directly in the DOM so you never miss limited drops.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Real Price Drop Intelligence
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Filters out inflated MSRP tricks, fake discounts, and unverified 3rd-party sellers.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Natural Language Intent
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    No coding or selector pickers. Simply state what you're looking for in plain English.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif text-base text-gray-900">
                    Instant 1-Click Checkout Handoff
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Alerts include direct checkout links with your selected variant ready to buy immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-mono">
                  Autonomous shopping engine
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
