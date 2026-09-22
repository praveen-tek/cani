import type { NextConfig } from "next";

const convexUrl =
  process.env.VITE_CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
const derivedSiteUrl = convexUrl
  ? convexUrl.replace(".convex.cloud", ".convex.site")
  : undefined;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? derivedSiteUrl ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_CONVEX_URL: convexUrl,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
};

export default nextConfig;