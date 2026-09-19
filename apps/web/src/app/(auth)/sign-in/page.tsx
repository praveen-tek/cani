"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { WarningCircle } from "@phosphor-icons/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/discover");
    }
  }, [isAuthenticated, router]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signIn("google", { redirectTo: "/discover" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#d9effe] selection:bg-neutral-900 selection:text-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#a1d8fd] via-[#cae9ff] to-[#f4f9ff]" />
        <div className="absolute -bottom-24 -left-24 w-[700px] h-[500px] bg-white/70 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-0 w-[800px] h-[600px] bg-white/80 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-white/40 rounded-full blur-2xl" />

        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] opacity-35"
          viewBox="0 0 1200 1200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="600" cy="600" r="280" stroke="white" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx="600" cy="600" r="420" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <circle cx="600" cy="600" r="560" stroke="white" strokeWidth="1.5" opacity="0.5" strokeDasharray="8 8" />
          <circle cx="600" cy="600" r="700" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </div>

      <header className="relative z-10 px-8 sm:px-14 py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 p-1.5 overflow-hidden">
            <Image
              src="/logo.svg"
              alt="Cani Logo"
              width={20}
              height={20}
              className="w-full h-full object-contain invert"
            />
          </div>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] rounded-[36px] bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_20px_60px_-15px_rgba(50,90,130,0.18),0_0_0_1px_rgba(255,255,255,0.8)_inset] p-8 sm:p-9 relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#bde4ff]/35 to-transparent pointer-events-none" />

          <div className="relative flex justify-center mb-6">
            <div className="w-12 h-12 flex items-center justify-center text-gray-800">
              <Image
                src="/logo.svg"
                alt="Cani Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain invert"
              />
            </div>
          </div>

          <div className="text-center mb-6 relative">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Sign in to Cani
            </h1>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed px-4">
              Deploy autonomous agents to watch restocks, price drops, and sizes. For free
            </p>
          </div>

          <div className="space-y-4 relative">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs"
              >
                <WarningCircle size={16} className="shrink-0" weight="fill" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isAuthLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white hover:bg-gray-50/90 rounded-2xl border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] text-xs font-semibold text-gray-800 disabled:opacity-50"
              aria-label="Continue with Google"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
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
                </>
              )}
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 px-8 py-6 text-center text-2xs text-gray-500/80 flex items-center justify-center gap-4">
        <span>© {new Date().getFullYear()} Cani Inc.</span>
        <span>•</span>
        <Link href="/terms" className="hover:text-gray-900 underline transition">
          Terms
        </Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-gray-900 underline transition">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
