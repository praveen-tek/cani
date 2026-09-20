# Hackathon log

- **Project:** Cani
- **Event:** Convex All Gas Hackathon
- **What it does:** Shared shopping board to search stores across India and the US, add products to rooms, vote with friends, and get scheduled alerts on price drops and deals.
- **Live app:** not deployed
- **Repo:** https://github.com/praveen-tek/erxis
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed
- **Components:** none
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions
- **Auth:** Convex Auth
- **AI models:** none
- **Started:** 2026-08-27T00:48:17Z
- **Last updated:** 2026-09-20T05:26:00Z

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
Documented erxis as a personal shopping agent and added project branding (`README.md`, `assets/banner.png`).

### 2026-08-27 - a3f65a2
Added a WXT + React browser-extension scaffold, including popup, background, and content-script
entry points (`apps/extensions/wxt.config.ts`, `apps/extensions/entrypoints`).

### 2026-08-27 - c4216f9
Refreshed the project banner and changed the pre-commit validation command to run Turborepo's
build/type-check task (`assets/banner.png`, `.husky/pre-commit`).

### 2026-09-19 - 501bd47
Migrated from Vite to Next.js static export with Convex Auth (`@convex-dev/auth`, Google OAuth).
Built country-aware store search (India and US) powered by Firecrawl, team voting rooms with live
upvote/downvote scoring, market auto-detection, and a responsive round-robin masonry layout with
natural aspect ratio product cards (`apps/web/convex`, `apps/web/src/app`, `apps/web/src/components`).

### 2026-09-19 - 8d444b6
Fixed invite join flow, added team archive controls and archived rooms view, refined discover query
clearing, and improved masonry product board updates (`apps/web/convex/invites.ts`,
`apps/web/convex/teams.ts`, `apps/web/src/app/(app)/archived/page.tsx`, `apps/web/src/app/join/page.tsx`).

### 2026-09-20 - working tree
Added Firecrawl scheduled price/deal monitors with webhooks in `apps/web/convex/http.ts`, monitor
management actions/queries in `apps/web/convex/monitors.ts`, and a dedicated Watch & Alerts page in
`apps/web/src/app/(app)/watch/page.tsx`. Integrated AgentMail transactional emails for room invitations
and price drop / deal monitor alerts (`apps/web/convex/lib/email.ts`, `apps/web/convex/mail.ts`,
`apps/web/convex/invites.ts`). Built static export SEO metadata (`apps/web/src/app/robots.ts`,
`apps/web/src/app/sitemap.ts`, `apps/web/src/lib/site.ts`) and rewrote all public landing pages and
copy to reflect Cani's shared shopping board with live room voting and scheduled price alerts.
