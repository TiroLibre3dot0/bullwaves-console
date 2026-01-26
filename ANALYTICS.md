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

La console interna include una pagina **Custom Events** (`/custom-events`) che mostra i conteggi aggregati per l’evento `public_share_open`.

La pagina interroga Plausible tramite un endpoint server-side, così la chiave API non è mai esposta al browser.

**Robustezza:**
- Se esiste un goal custom chiamato `public_share_open`, la console mostra i conteggi goal (conversions).
- Se il goal non esiste, la console conta direttamente l’evento custom `public_share_open` (fallback automatico, nessuna configurazione manuale obbligatoria).

Impostare queste variabili d’ambiente server (Vercel/Node):
- `PLAUSIBLE_STATS_API_KEY=...` (API key Plausible)
- `PLAUSIBLE_SITE_ID=your-domain.com` (site id Plausible)

File template: [Bullwaves_new/.env.server.example](Bullwaves_new/.env.server.example)

Endpoint healthcheck (deve restituire `configured: true` se le env sono ok):
- `/api/analytics/health`

Endpoint server: [serverless/handlers/analytics.js](serverless/handlers/analytics.js)

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
