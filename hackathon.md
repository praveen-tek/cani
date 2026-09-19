# Hackathon log

- **Project:** Cani
- **Event:** Convex All Gas Hackathon
- **What it does:** A personal shopping agent for scouting deals and drops with Firecrawl, discovering products across global stores, and collaborating on team voting boards.
- **Live app:** not deployed
- **Repo:** https://github.com/praveen-tek/erxis
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed
- **Components:** none
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions
- **Auth:** Convex Auth
- **AI models:** none
- **Started:** 2026-08-27T00:48:17Z
- **Last updated:** 2026-09-19T07:04:00Z

## Log

### 2026-08-27 - 577bfb8
Initialized a Vite TypeScript web starter and added the project-local hackathon build log
(`web/src/main.ts`, `web/src/style.css`, `hackathon.md`).

### 2026-08-27 - 799f93b
Moved the starter to React and added Tailwind CSS. The initial interface includes an interactive
local counter (`web/src/App.tsx`, `web/src/index.css`, `web/vite.config.ts`).

### 2026-08-27 - ec6ef35
Restructured the frontend as an `apps/web` package and added pnpm workspace and Turborepo
configuration for the monorepo (`apps/web`, `pnpm-workspace.yaml`, `turbo.json`).

### 2026-08-27 - 617d938
Documented erxis as a personal shopping agent and added project branding. The planned
watch-and-alert flow covers product-page pinning, natural-language watch instructions,
change detection, relevance filtering, and email alerts (`README.md`, `assets/banner.png`).

### 2026-08-27 - a3f65a2
Added a WXT + React browser-extension scaffold, including popup, background, and content-script
entry points. The content script is presently limited to a Google URL match and starter output
(`apps/extensions/wxt.config.ts`, `apps/extensions/entrypoints`).

### 2026-08-27 - c4216f9
Refreshed the project banner and changed the pre-commit validation command to run Turborepo's
build/type-check task (`assets/banner.png`, `.husky/pre-commit`).

### 2026-08-30 - working tree
Replaced the Vite starter with a Next.js product site for Cani, including the shopping-agent
overview, feature and workflow sections, FAQ, call to action, and branded interactive visuals.
Expanded the client-side walkthrough with selectable product-watch scenarios, animated preview
steps, a pricing page, and legal-policy pages linked from the navigation and footer. The site
continues to present the planned watch-and-alert experience; it does not yet implement that
backend flow (`apps/web/src/app`, `apps/web/src/components`, `apps/web/package.json`).

### 2026-09-01 - working tree
Configured Better Auth with Convex as the backend authentication provider. Added the `betterAuth`
Convex component (`@convex-dev/better-auth`), Convex schema, HTTP router auth endpoints, client
and Next.js server helpers, `ConvexClientProvider` root layout integration, user query functions,
and an authentication interface with email/password and social login (`apps/web/convex`,
`apps/web/src/lib/auth-client.ts`, `apps/web/src/lib/auth-server.ts`, `apps/web/src/app/(auth)/sign-in`).

### 2026-09-19 - working tree
Migrated authentication from Better Auth to Convex Auth (`@convex-dev/auth`). Configured Google OAuth
as the single authentication provider, defined the auth schema tables, wired HTTP routes on the router,
created a `viewer` query to resolve the authenticated user record, and integrated `ConvexAuthProvider`
and `useAuthActions` in the Next.js frontend (`apps/web/convex/auth.ts`, `apps/web/convex/auth.config.ts`,
`apps/web/convex/http.ts`, `apps/web/convex/schema.ts`, `apps/web/convex/users.ts`,
`apps/web/src/components/providers/convex-client-provider.tsx`, `apps/web/src/app/(auth)/sign-in/page.tsx`).

### 2026-09-19 - working tree
Built country-aware deal scouting (India and US) and team voting boards with live upvote/downvote scoring,
invite link generation, onboarding market auto-detection, a clean dashboard layout with collapsible shadcn sidebar,
and a full profile and settings page with danger zone controls. Convex features: schema, tables, indexes, queries,
mutations, actions, HTTP actions (`apps/web/convex/suggestions.ts`, `apps/web/convex/profiles.ts`,
`apps/web/convex/teams.ts`, `apps/web/convex/votes.ts`, `apps/web/convex/products.ts`, `apps/web/src/app/(app)`).

### 2026-09-19 - working tree
Rebuilt scouting and added a Discover search page powered purely by Firecrawl, with natural-language multi-store
searches, store filtering chips, and sort controls. Created a responsive round-robin Masonry layout component
with varied-height skeleton loading, uncropped natural aspect ratio product cards with referrer-policy hotlink
protection, Flipkart image resolution upscaling, and error fallbacks (`apps/web/convex/discover.ts`,
`apps/web/convex/lib/firecrawl.ts`, `apps/web/src/components/masonry.tsx`, `apps/web/src/components/product-card.tsx`,
`apps/web/src/lib/image-url.ts`, `apps/web/src/app/(app)/discover/page.tsx`, `apps/web/src/app/(app)/dashboard/page.tsx`).
