"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import {
  Buildings,
  Users,
  WarningCircle,
  Sparkle,
} from "@phosphor-icons/react";

function JoinPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = (searchParams.get("code") || "").trim();

  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const profile = useQuery(api.profiles.me);
  const preview = useQuery(
    api.invites.preview,
    code ? { code } : "skip"
  );
  const acceptInvite = useMutation(api.invites.accept);

  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code && isAuthenticated && profile !== undefined && (!profile || !profile.onboardingComplete)) {
      sessionStorage.setItem("pending_invite_code", code);
      router.push("/onboarding");
    }
  }, [code, isAuthenticated, profile, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", { redirectTo: `/join?code=${encodeURIComponent(code)}` });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google.");
    }
  };

  const handleJoinTeam = async () => {
    if (!code) return;
    setIsJoining(true);
    setError(null);
    try {
      const res = await acceptInvite({ code });
      router.push(`/team?id=${res.teamId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join team.");
      setIsJoining(false);
    }
  };

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-4 max-w-md shadow-xl">
          <WarningCircle size={36} className="mx-auto text-amber-500" weight="fill" />
          <h3 className="font-serif text-2xl text-gray-900 font-semibold">Missing Invite Link</h3>
          <p className="text-xs text-gray-500">
            This invite URL is missing an access code. Please request a new invite link from your team owner.
          </p>
          <Link
            href="/discover"
            className="inline-block px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold"
          >
            Go to Discover
          </Link>
        </div>
      </div>
    );
  }

  if (preview === undefined || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Loading invite details...</span>
        </div>
      </div>
    );
  }

  const isInvalid = preview.status !== "valid";

  return (
    <div className="min-h-screen bg-[#f4f9ff] flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Header */}
      <header className="px-8 sm:px-14 py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center p-1.5 overflow-hidden bg-black text-white">
            <Image
              src="/logo.svg"
              alt="Cani Logo"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-serif text-xl text-gray-900 font-semibold tracking-tight">Cani</span>
        </Link>
      </header>

      {/* Center Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-gray-200/80 shadow-xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
            <Buildings size={28} weight="fill" />
          </div>

          <div>
            <span className="text-2xs font-mono uppercase tracking-wider text-gray-400 block mb-1">
              Team Invitation
            </span>
            <h2 className="font-serif text-3xl text-gray-900 font-semibold">
              {preview.teamName || "Shopping Team"}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mt-2">
              <Users size={14} />
              <span>{preview.memberCount} member(s) already in this team</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200 text-left">
              <WarningCircle size={16} weight="fill" className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isInvalid ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
              <p className="font-medium">
                {preview.status === "expired"
                  ? "This invite link has expired."
                  : preview.status === "revoked"
                  ? "This invite link has been revoked by the team owner."
                  : preview.status === "full"
                  ? "This invite has reached its maximum member capacity."
                  : "This invite code is invalid."}
              </p>
              <Link href="/discover" className="text-2xs underline block text-amber-900 font-medium">
                Return to Discover
              </Link>
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-gray-500">
                Sign in with Google to accept this invite and join the team board.
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 shadow-xs text-xs font-semibold text-gray-800 cursor-pointer transition active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleJoinTeam}
                disabled={isJoining}
                className="w-full py-3.5 px-6 rounded-2xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isJoining ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkle size={14} weight="bold" />
                    <span>Join Team Board</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 text-center text-2xs text-gray-400 border-t border-gray-200/60 bg-white/50">
        <span>© {new Date().getFullYear()} Cani Inc. Autonomous Shopping Assistant</span>
      </footer>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
        </div>
      }
    >
      <JoinPageInner />
    </Suspense>
  );
}
