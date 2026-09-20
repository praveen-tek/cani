import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal",
  alternates: {
    canonical: null,
  },
};

export default function LegalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
