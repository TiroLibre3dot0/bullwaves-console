# Analytics (public share links)

This app can track openings of **public share links** without using your own database, via a hosted analytics provider.

## What gets tracked

When someone opens a public share page, the app emits an event:

- Event name: `public_share_open`
- Properties:
  - `kind`: which share page was opened (e.g. `project_board`, `flows`, `weekly_map`)
  - `share_id`: a **stable hash** of the share token (the raw token is never sent)
  - `generated_at`: if available in the share payload

The analytics provider will automatically record:

- Timestamp
- Device / OS / browser
- Referrer (where the user came from)
- Page URL

## Provider: Plausible

### Environment variables

Set these Vite env vars (e.g. in `.env.local`):

- `VITE_ANALYTICS_PROVIDER=plausible`
- `VITE_PLAUSIBLE_DOMAIN=your-domain.com`
- (optional) `VITE_PLAUSIBLE_SRC=https://plausible.io/js/script.js`

### Console: Custom Events page

The internal console includes a **Custom Events** page (route: `/custom-events`) that shows aggregated visibility for the `public_share_open` event.

This page queries Plausible via a server-side endpoint so the API key is not exposed in the browser.

Set these server env vars (Vercel / Node runtime env):

- `PLAUSIBLE_STATS_API_KEY=...` (Plausible Stats API key)
- `PLAUSIBLE_SITE_ID=your-domain.com` (the Plausible site id / domain)

Template file (safe to commit): [Bullwaves_new/.env.server.example](Bullwaves_new/.env.server.example)

Healthcheck endpoint (should return `configured: true` when env vars are set):

- `/api/analytics/health`

Server endpoint: [api/analytics/public-share-open.js](api/analytics/public-share-open.js)

### Where the code lives

- Script injection + helpers: [src/utils/analytics.js](src/utils/analytics.js)
- Global init call: [src/main.jsx](src/main.jsx)
- Instrumented share pages:
  - [src/features/project-board/pages/PublicProjectBoardSharePage.jsx](src/features/project-board/pages/PublicProjectBoardSharePage.jsx)
  - [src/features/flows/pages/PublicFlowsSharePage.jsx](src/features/flows/pages/PublicFlowsSharePage.jsx)
  - [src/features/roadmap/pages/PublicWeeklyMapPage.jsx](src/features/roadmap/pages/PublicWeeklyMapPage.jsx)
  - [src/features/roadmap/pages/PublicWeeklyExecutionHistoryPage.jsx](src/features/roadmap/pages/PublicWeeklyExecutionHistoryPage.jsx)
  - [src/features/marketing-plan/pages/PublicMarketingPlanSharePage.tsx](src/features/marketing-plan/pages/PublicMarketingPlanSharePage.tsx)
  - [src/features/affiliate-analysis/pages/PublicAffiliateAnalysisSharePage.jsx](src/features/affiliate-analysis/pages/PublicAffiliateAnalysisSharePage.jsx)
  - [src/pages/share/ShareOrgChartTrueTree.jsx](src/pages/share/ShareOrgChartTrueTree.jsx)
  - [src/features/support/pages/PublicSupportBotListPage.jsx](src/features/support/pages/PublicSupportBotListPage.jsx)

## Quick verification

1. Configure the env vars above.
2. Run the app.
3. Open a public share URL in an incognito/private window.
4. In Plausible, check events for `public_share_open` and break down by `kind` / `share_id`.
