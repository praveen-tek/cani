import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You are invited to a room",
  description: "Join a shared shopping room on Cani.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  referrer: "no-referrer",
  alternates: {
    canonical: null,
  },
  openGraph: {
    title: "You are invited to a room on Cani",
    description:
      "Join a shared shopping room and vote on what to buy together.",
    url: "/join/",
  },
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
