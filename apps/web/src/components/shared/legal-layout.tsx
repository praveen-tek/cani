"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import AnimatedContent from "@/components/animation/animate";
import { ShieldCheck, FileText, Lock, UsersThree, Cookie } from "@phosphor-icons/react";
import type React from "react";

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

const LEGAL_DOCS = [
  { href: "/terms", label: "Terms of Service", icon: FileText },
  { href: "/privacy", label: "Privacy Policy", icon: Lock },
  { href: "/subprocessors", label: "Subprocessors", icon: UsersThree },
  { href: "/cookies", label: "Cookie Policy", icon: Cookie },
  { href: "/security", label: "Security & Trust", icon: ShieldCheck },
];

export function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  const pathname = usePathname();

  return (
    <>
      <Navbar />

      <main className="bg-white min-h-screen">
        {/* Header Banner */}
        <section className="border-b border-gray-100 px-6 sm:px-8 pt-16 pb-12">
          <div className="max-w-5xl mx-auto">
            <AnimatedContent distance={30} direction="vertical" delay={0.1}>
              <span className="text-xs font-mono uppercase tracking-wider text-gray-400 block mb-3">
                Legal & Governance // Cani Inc.
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl text-gray-900 leading-tight">
                {title}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mt-3 max-w-2xl">
                {subtitle}
              </p>
              <div className="flex items-center gap-4 mt-6 text-xs text-gray-400 font-mono">
                <span>Last updated: {lastUpdated}</span>
                <span>•</span>
                <span>Version 1.4</span>
              </div>
            </AnimatedContent>
          </div>
        </section>

        {/* Content & Navigation Grid */}
        <section className="px-6 sm:px-8 py-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
                Legal Documents
              </p>
              {LEGAL_DOCS.map((doc) => {
                const isActive = pathname === doc.href;
                const Icon = doc.icon;
                return (
                  <Link
                    key={doc.href}
                    href={doc.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-black text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                    }`}
                  >
                    <Icon size={16} weight={isActive ? "bold" : "regular"} />
                    <span>{doc.label}</span>
                  </Link>
                );
              })}

              <div className="p-4 mt-8 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                <p className="font-semibold text-gray-900 mb-1">
                  Questions or Notices?
                </p>
                <p className="text-gray-500 leading-relaxed">
                  For compliance inquiries or DPA requests, reach our legal counsel at:
                </p>
                <a
                  href="mailto:legal@cani.shopping"
                  className="text-gray-900 font-medium hover:underline block mt-2"
                >
                  legal@cani.shopping
                </a>
              </div>
            </aside>

            {/* Document Body */}
            <article className="lg:col-span-8 prose prose-neutral max-w-none text-gray-700 text-sm leading-relaxed space-y-8">
              {children}
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
