import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Cani is free to use during early access. Search stores, share rooms, vote with friends, and track price drops.",
  alternates: {
    canonical: "/pricing/",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
