import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async redirect({ redirectTo }) {
      const siteUrl = process.env.SITE_URL || process.env.CONVEX_SITE_URL || "";
      const cleanSiteUrl = siteUrl.replace(/\/+$/, "");
      if (redirectTo.startsWith("/")) {
        return `${cleanSiteUrl}${redirectTo}`;
      }
      if (cleanSiteUrl && redirectTo.startsWith(cleanSiteUrl)) {
        return redirectTo;
      }
      return cleanSiteUrl ? `${cleanSiteUrl}/discover/` : redirectTo;
    },
  },
});
