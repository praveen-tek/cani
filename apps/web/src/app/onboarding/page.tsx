"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { detectCountry } from "@/lib/detect-country";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Plus,
  Sparkle,
  User,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

const SUGGESTED_INTERESTS = [
  "fashion",
  "gadgets",
  "sneakers",
  "home",
  "fitness",
  "beauty",
  "gaming",
  "books",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.me);
  const user = useQuery(api.users.viewer);
  const saveOnboarding = useMutation(api.profiles.saveOnboarding);

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [country, setCountry] = useState<"IN" | "US">("US");
  const [initialDetectedCountry, setInitialDetectedCountry] = useState<"IN" | "US">("US");
  const [userChangedCountry, setUserChangedCountry] = useState(false);
  const [age, setAge] = useState<number | "">("");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const detected = detectCountry();
    setCountry(detected);
    setInitialDetectedCountry(detected);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/sign-in/");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (profile?.onboardingComplete) {
      const pendingCode = sessionStorage.getItem("pending_invite_code");
      if (pendingCode) {
        sessionStorage.removeItem("pending_invite_code");
        router.push(`/join/?code=${encodeURIComponent(pendingCode)}`);
      } else {
        router.push("/discover/");
      }
    } else if (profile?.name && !name) {
      setName(profile.name);
    } else if (user?.name && !name) {
      setName(user.name);
    }
  }, [profile, user, router, name]);

  const handleAddInterest = (item: string) => {
    const trimmed = item.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed.length > 30) {
      setError("Interest item must be 30 characters or fewer.");
      return;
    }
    if (interests.includes(trimmed)) return;
    if (interests.length >= 15) {
      setError("You can select up to 15 interests.");
      return;
    }
    setInterests([...interests, trimmed]);
    setCustomInterest("");
    setError(null);
  };

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter((i) => i !== item));
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim() || name.trim().length > 60) {
        setError("Please provide a name between 1 and 60 characters.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      const ageNum = typeof age === "number" ? age : parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        setError("Please enter a valid age between 13 and 120.");
        return;
      }
      setAge(ageNum);
      setStep(4);
    } else if (step === 4) {
      if (interests.length === 0) {
        setError("Please select or add at least one interest.");
        return;
      }
      setStep(5);
    }
  };

  const handleFinish = async () => {
    setError(null);
    if (!lookingFor.trim() || lookingFor.trim().length > 300) {
      setError("Please describe what you are looking for (up to 300 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveOnboarding({
        name: name.trim(),
        age: typeof age === "number" ? age : parseInt(age as string, 10),
        interests,
        lookingFor: lookingFor.trim(),
        country,
        countrySource: userChangedCountry ? "user" : "auto",
      });

      const pendingCode = sessionStorage.getItem("pending_invite_code");
      if (pendingCode) {
        sessionStorage.removeItem("pending_invite_code");
        router.push(`/join/?code=${encodeURIComponent(pendingCode)}`);
      } else {
        router.push("/discover/");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save profile. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || (isAuthenticated && profile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-normal">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          <span className="text-xs text-neutral-500 font-mono font-normal">
            Loading onboarding...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between selection:bg-neutral-900 selection:text-white font-normal">
      {/* Header */}
      <header className="px-6 sm:px-10 py-5 flex items-center justify-between border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center p-1 overflow-hidden">
            <Image
              src="/logo.svg"
              alt="Cani Logo"
              width={18}
              height={18}
              className="w-full h-full object-contain invert"
            />
          </div>
          <span className="font-serif text-2xl text-neutral-900 tracking-tight font-normal">
            Cani
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-6 bg-neutral-900"
                  : s < step
                  ? "w-3 bg-neutral-400"
                  : "w-3 bg-neutral-200"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200 shadow-sm">
          {error && (
            <div className="mb-6 flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-normal">
              <WarningCircle size={18} weight="light" className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                  Step 1 • Profile
                </span>
                <h2 className="font-serif text-3xl text-neutral-900 font-normal">
                  What should your shopping agent call you?
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-normal">
                  We will use this name for alerts and team collaboration.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <User size={18} weight="light" />
                </div>
                <input
                  type="text"
                  autoFocus
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                  placeholder="Your full name"
                  className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-sm text-neutral-900 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all font-normal"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                  Step 2 • Market
                </span>
                <h2 className="font-serif text-3xl text-neutral-900 font-normal">
                  Where do you shop?
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-normal">
                  Cani tailors store discovery, local currency, and deal
                  scouting to your country.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCountry("IN");
                    if (initialDetectedCountry !== "IN") {
                      setUserChangedCountry(true);
                    }
                  }}
                  className={`p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between h-32 ${
                    country === "IN"
                      ? "border-neutral-900 bg-neutral-50 shadow-xs"
                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-neutral-400">
                      INR • ₹
                    </span>
                    {country === "IN" && (
                      <Check size={16} weight="light" className="text-neutral-900" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-neutral-900 font-normal">
                      India
                    </h3>
                    <p className="text-2xs text-neutral-500 font-normal">
                      Flipkart, Amazon.in, Myntra, Croma, Nykaa
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCountry("US");
                    if (initialDetectedCountry !== "US") {
                      setUserChangedCountry(true);
                    }
                  }}
                  className={`p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between h-32 ${
                    country === "US"
                      ? "border-neutral-900 bg-neutral-50 shadow-xs"
                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-neutral-400">
                      USD • $
                    </span>
                    {country === "US" && (
                      <Check size={16} weight="light" className="text-neutral-900" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-neutral-900 font-normal">
                      United States
                    </h3>
                    <p className="text-2xs text-neutral-500 font-normal">
                      Amazon, Walmart, Best Buy, Target
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                  Step 3 • Age
                </span>
                <h2 className="font-serif text-3xl text-neutral-900 font-normal">
                  How old are you?
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-normal">
                  Helps Cani personalize product drops and recommendations.
                </p>
              </div>

              <div>
                <input
                  type="number"
                  autoFocus
                  min={13}
                  max={120}
                  value={age}
                  onChange={(e) =>
                    setAge(
                      e.target.value === "" ? "" : parseInt(e.target.value, 10)
                    )
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                  placeholder="Enter your age (e.g. 24)"
                  className="w-full px-4 py-3.5 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-sm text-neutral-900 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all font-normal"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                  Step 4 • Categories &amp; Interests
                </span>
                <h2 className="font-serif text-3xl text-neutral-900 font-normal">
                  What categories do you care about?
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-normal">
                  Choose from popular topics or type your own custom shopping
                  interests.
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {SUGGESTED_INTERESTS.map((item) => {
                    const isSelected = interests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          isSelected
                            ? handleRemoveInterest(item)
                            : handleAddInterest(item)
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal transition cursor-pointer border ${
                          isSelected
                            ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                            : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200"
                        }`}
                      >
                        {isSelected && <Check size={12} weight="light" />}
                        <span className="capitalize">{item}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddInterest(customInterest);
                      }
                    }}
                    placeholder="Add custom interest (press Enter)"
                    className="flex-1 px-4 py-2.5 bg-neutral-50 text-xs text-neutral-900 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddInterest(customInterest)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={14} weight="light" />
                    <span>Add</span>
                  </button>
                </div>

                {interests.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <span className="text-2xs text-neutral-400 block mb-2 font-normal">
                      Selected interests:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {interests.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-2xs font-normal border border-neutral-200"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveInterest(item)}
                            className="hover:text-red-600 transition cursor-pointer"
                          >
                            <X size={10} weight="light" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                  Step 5 • Intent
                </span>
                <h2 className="font-serif text-3xl text-neutral-900 font-normal">
                  What specific items are you looking for right now?
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-normal">
                  Describe what you want Cani to scout across {country === "IN" ? "Indian" : "US"} stores.
                </p>
              </div>

              <div>
                <textarea
                  autoFocus
                  rows={4}
                  maxLength={300}
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder={
                    country === "IN"
                      ? "e.g. Mechanical keyboards under ₹5000, trail running shoes on sale, Sony noise cancelling headphones..."
                      : "e.g. Salomon XT-6 under $180, Arc'teryx outerwear on sale, Sony WH-1000XM5 headphones..."
                  }
                  className="w-full p-4 bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-sm text-neutral-900 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-all resize-none font-normal"
                />
                <span className="text-2xs text-neutral-400 float-right mt-1 font-mono">
                  {lookingFor.length}/300
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(step - 1);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-normal text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
              >
                <ArrowLeft size={14} weight="light" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={14} weight="light" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkle size={14} weight="light" />
                    <span>Complete Setup</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 text-center text-2xs text-neutral-400 border-t border-neutral-200 bg-white font-normal">
        <span>© {new Date().getFullYear()} Cani Inc. Shop with friends, decide together</span>
      </footer>
    </div>
  );
}
