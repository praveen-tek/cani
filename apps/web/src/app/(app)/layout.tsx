import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Cani",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  alternates: {
    canonical: null,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
