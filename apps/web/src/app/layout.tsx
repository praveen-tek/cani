import type { Metadata } from "next";
import { Outfit, Raleway } from "next/font/google";
import "../styles/globals.css";
import { cn } from "@/lib/utils";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";

const ralewayHeading = Raleway({
  subsets: ["latin"],
  variable: "--font-heading",
});

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Cani — Agentic Way of Shopping",
  description:
    "Cani watches products you care about and acts on your behalf — restocks, price drops, and new releases, handled for you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        outfit.variable,
        ralewayHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}