"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
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

  // The invite code may arrive as ?code= (direct link) or ?invite= (post-auth redirect).
  // We use ?invite= in the redirectTo so the OAuth ?code= param is not intercepted
  // by the ConvexAuthProvider, which strips any ?code= it finds on mount.
  const rawCode = searchParams.get("invite") || searchParams.get("code");
  const code = (rawCode || "").trim();

  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const viewer = useQuery(api.users.viewer);

  const preview = useQuery(
    api.invites.preview,
    code ? { code } : "skip"
  );
  const acceptInvite = useMutation(api.invites.accept);

  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    if (code && typeof window !== "undefined") {
      try { sessionStorage.setItem("pending_invite_code", code); } catch { /* ignore */ }
    }
  }, [code]);

  const handleGoogleSignIn = async () => {
    if (!code) return;
    setSignInError(null);
    try {
      // Use ?invite= so the OAuth library's ?code= stripping doesn't eat the invite code.
      await signIn("google", { redirectTo: `/join?invite=${encodeURIComponent(code)}` });
    } catch (err: unknown) {
      setSignInError(err instanceof Error ? err.message : "Failed to sign in.");
    }
  };

  const handleJoinTeam = async () => {
    if (!code || isAuthLoading || !isAuthenticated || isJoining) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await acceptInvite({ code });
      router.push(`/team?id=${res.teamId}`);
    } catch (err: unknown) {
      const msg =
        err instanceof ConvexError
          ? (err.data as string)
          : err instanceof Error
          ? err.message
          : "Failed to join room.";
      setJoinError(msg);
      setIsJoining(false);
    }
  };

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] font-normal">
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 text-center space-y-4 max-w-md shadow-xl">
          <WarningCircle size={36} weight="light" className="mx-auto text-neutral-500" />
          <h3 className="font-serif text-2xl text-neutral-900 font-normal">Missing Invite Link</h3>
          <p className="text-xs text-neutral-500 font-normal">
            This invite URL is missing an access code. Please request a new invite link from your room owner.
          </p>
          <Link
            href="/discover"
            className="inline-block px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition"
          >
            Go to Discover
          </Link>
        </div>
      </div>
    );
  }

  if (preview === undefined || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-normal">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <span className="text-xs text-neutral-500 font-mono font-normal">Loading invite details...</span>
        </div>
      </div>
    );
  }

  const isValid = preview.status === "valid";

  return (
    <div className="min-h-screen bg-[#f4f9ff] flex flex-col justify-between selection:bg-neutral-900 selection:text-white font-normal">
      <header className="px-8 sm:px-14 py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center p-1.5 overflow-hidden bg-black text-white">
            <Image src="/logo.svg" alt="Cani Logo" width={20} height={20} className="w-full h-full object-contain" />
          </div>
          <span className="font-serif text-xl text-neutral-900 font-normal tracking-tight">Cani</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
            <Buildings size={28} weight="light" />
          </div>

          {isValid ? (
            <div>
              <span className="text-2xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">Room Invitation</span>
              <h2 className="font-serif text-3xl text-neutral-900 font-normal">{preview.teamName}</h2>
              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 mt-2 font-normal">
                <Users size={14} weight="light" />
                <span>{preview.memberCount} member(s) already in this room</span>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-2xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">Room Invitation</span>
              <h2 className="font-serif text-2xl text-neutral-900 font-normal">
                {preview.status === "expired" ? "Invite Expired"
                  : preview.status === "revoked" ? "Invite Revoked"
                  : preview.status === "full" ? "Room Full"
                  : "Invite Not Found"}
              </h2>
            </div>
          )}

          {!isValid ? (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs space-y-2 font-normal">
              <p>
                {preview.status === "expired" ? "This invite link has expired."
                  : preview.status === "revoked" ? "This invite link has been revoked by the room owner."
                  : preview.status === "full" ? "This invite has reached its maximum member capacity."
                  : "This invite link does not exist or has been deleted."}
              </p>
              <Link href="/discover" className="text-2xs underline block text-neutral-900 font-normal">Return to Discover</Link>
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-neutral-500 font-normal">Sign in with Google to accept this invite and join the room.</p>
              {signInError && (
                <p className="text-xs text-red-600 font-normal">{signInError}</p>
              )}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white hover:bg-neutral-50 rounded-2xl border border-neutral-200 shadow-xs text-xs font-normal text-neutral-800 cursor-pointer transition active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-neutral-500 font-normal">
                Signed in as {viewer?.email || viewer?.name || "User"}
              </p>

              {preview.isAlreadyMember ? (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-600 font-normal">You are already in this room</p>
                  <Link
                    href={`/team?id=${preview.teamId}`}
                    className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    Open room
                  </Link>
                </div>
              ) : (
                <>
                  {joinError && (
                    <p className="text-xs text-red-600 font-normal">{joinError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleJoinTeam}
                    disabled={isJoining}
                    className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isJoining ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkle size={14} weight="light" />
                        <span>Join room</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="px-8 py-4 text-center text-2xs text-neutral-400 border-t border-neutral-200/60 bg-white/50 font-normal">
        <span>© {new Date().getFullYear()} Cani Inc. Autonomous Shopping Assistant</span>
      </footer>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white font-normal">
          <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        </div>
      }
    >
      <JoinPageInner />
    </Suspense>
  );
}
