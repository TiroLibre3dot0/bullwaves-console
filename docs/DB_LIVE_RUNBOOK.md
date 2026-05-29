# DB Live Runbook

## Scope
Operational playbook for Creolabs DB Live.

## Main Endpoints
- `GET /api/qlik/creolabs/db-live`
- `GET /api/qlik/creolabs/db-live-ingestion-status`
- `POST /api/qlik/creolabs/db-live-ingestion-control`
- `GET /api/qlik/creolabs/db-live-export`

## Ingestion Control Actions
Use `POST /api/qlik/creolabs/db-live-ingestion-control` with JSON body:

```json
{ "action": "refresh" }
```

Supported actions:
- `refresh`: incremental run
- `full-refresh`: force full window from bootstrap date
- `clear-store`: clear in-memory and persisted store

## Persistence Files
- metadata: `uploads/db-live-ingestion-state.json`
- store snapshot: `uploads/db-live-store.json`
- audit log: `uploads/db-live-audit.log`

Optional env overrides:
- `DB_LIVE_INGESTION_STATE_FILE`
- `DB_LIVE_STORE_FILE`
- `DB_LIVE_AUDIT_LOG_FILE`
- `DB_LIVE_INGEST_INTERVAL_MS` (default `900000`, 15 minutes)
- `DB_LIVE_LOCAL_ARTIFACT_FILE` (default `uploads/traders_ranking_rewards_table.live.json`)

## Ingestion Control Protection
- Manual actions are rate-limited per actor/IP (`6` actions per `5` minutes).
- Exceeded requests return `429` with `Retry-After` header.
- Every ingestion-control action writes an audit event.

## Smoke Test
Run after backend restart:

```bash
npm run db-live:smoke
```

Deep operational smoke (includes clear-store + full-refresh flow):

```bash
npm run db-live:smoke:deep
```

The smoke checks contracts for:
- `db-live-v1.1`
- `db-live-report-templates-v1`
- `db-live-reports-jobs-v1`
- `db-live-export-v1`

## Incident Quick Actions
1. Check status:
   - `GET /api/qlik/creolabs/db-live-ingestion-status`
2. If stale/cold and not in flight:
   - trigger `refresh`
3. If repeated failures (`consecutiveFailures >= 3`):
   - trigger `full-refresh`
4. If inconsistent rows after upstream instability:
   - trigger `clear-store`, then `full-refresh`

## Expected Warnings
- `warmup_in_progress`: first bootstrap still running
- `upstream_source_unavailable`: no-source mode from upstream
- `ingestion_failures`: recent run failures detected
- `scheduler_not_started`: scheduler not initialized yet

## Notes
- Export endpoint is filter/sort-aware and capped by `limit` (`max 20000`).
- Keep report generation work independent from DB Live serving stability.

## Qlik Report Integration (Current Status)
- Current DB Live behavior: direct iframe embed is blocked by tenant policy ("Connessione negata").
- Active fallback: open the report in a new browser tab from DB Live.

Reference report:
- tenant: `creolabs.uk.qlikcloud.com`
- appId: `c6f37daa-0278-42b0-ab9b-813d2b9aafeb`
- sheetId: `4087bfef-0e14-44b1-bfc4-2760c1229462`
- state: `analysis`

Required to enable native embed in DB Live:
- Web Integration ID from tenant admin console
- Allowed origins for Bullwaves:
   - local: `http://localhost:5174`
   - production: `<your-production-domain>`
- Auth mode confirmation:
   - preferred UI embed: OAuth SPA
   - alternative: M2M via backend proxy

Operational note:
- Never expose client secrets in frontend code or shared chat logs.
