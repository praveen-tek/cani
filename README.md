![banner](assets/banner.png)

<p align="center">
    <code>Shared shopping boards, multi-store discovery, team voting, and price drop alerts</code>
    <br />
    <br />
    <a href="https://github.com/praveen-tek/cani/issues">Issues</a>
    ·
    <a href="https://github.com/praveen-tek/cani">Repository</a>
</p>

## About Cani

**Cani** is a collaborative shopping platform and shared decision board. Search across multiple major retailers in India and the US in one go, pin products to team rooms, vote on purchases with friends and teammates, and set up scheduled Firecrawl monitors that automatically alert you when prices drop or deals go live.

---

## Features

- **Multi-Store Product Discovery:** Natural-language search across regional retailers in India (Amazon, Flipkart, Myntra, Tata CLiQ) and the US (Amazon, Walmart, Target, Best Buy) powered by Firecrawl with live prices, sales tags, and ratings.
- **Shared Rooms & Team Voting:** Collaborate on group purchases, pin items to shared room boards, and vote with realtime upvote/downvote scoring.
- **Price & Deal Monitoring:** Automated background tracking for product price drops, stock changes, and deal launches with instant webhook alerts.
- **Transactional Notifications:** Instant email invites to rooms and alert notifications delivered via AgentMail.
- **Cost Protection & Rate Limits:** Built-in rate limiting, structural caps, and TTL search caching powered by `@convex-dev/rate-limiter`.
- **Real-Time Backend & Auth:** Instant database synchronization, reactive queries, scheduled maintenance crons, and Google OAuth via Convex Auth.

---

## Tech Stack

- **Frontend:** Next.js (App Router, Static Export), React, Tailwind CSS, Phosphor Icons
- **Backend:** Convex Cloud (Queries, Mutations, Actions, HTTP Router, Scheduled Crons)
- **Auth:** Convex Auth (`@convex-dev/auth`, Google OAuth)
- **Rate Limiting:** Official Convex Rate Limiter (`@convex-dev/rate-limiter`)
- **Search & Monitoring:** Firecrawl API
- **Transactional Email:** AgentMail API
- **Monorepo Tooling:** Turborepo, pnpm workspaces

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Convex CLI](https://docs.convex.dev/)

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Set up your environment keys in your Convex cloud deployment:

```bash
pnpm exec convex env set AUTH_GOOGLE_ID <your_google_client_id>
pnpm exec convex env set AUTH_GOOGLE_SECRET <your_google_client_secret>
pnpm exec convex env set FIRECRAWL_API_KEY <your_firecrawl_key>
pnpm exec convex env set AGENTMAIL_API_KEY <your_agentmail_key>
pnpm exec convex env set CONVEX_SITE_URL <your_convex_site_url>
```

### 4. Run Development Server

In one terminal, start Convex backend sync:

```bash
pnpm --filter web exec convex dev
```

In another terminal, start Next.js:

```bash
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License

This project is licensed under the **[AGPLv3 License](https://www.gnu.org/licenses/agpl-3.0.html)**.