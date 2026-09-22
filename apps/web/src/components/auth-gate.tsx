"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.me);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && profile !== undefined) {
      if (!profile || !profile.onboardingComplete) {
        router.replace("/onboarding/");
      }
    }
  }, [isAuthenticated, isAuthLoading, profile, router]);

  if (isAuthLoading || (isAuthenticated && profile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center space-y-4">
          <h2 className="font-serif text-2xl text-gray-900 font-normal">Sign in required</h2>
          <p className="text-xs text-gray-500 leading-relaxed font-normal">
            Please sign in to access your Cani shopping dashboard and teams.
          </p>
          <Link
            href="/sign-in/"
            className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-black text-white text-xs font-normal hover:bg-neutral-800 transition"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!profile || !profile.onboardingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Redirecting to onboarding...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
