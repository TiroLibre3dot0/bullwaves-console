# Acuity API Links Reference

Last updated: 2026-05-04

## Support Confirmation (Acuity)

- Root cause confirmed by Acuity support: for Bullwaves account, Market Insight / Acuity News / Acuity Events are permissioned for English only.
- Working LanguageCode for those endpoints: `en-gb`
- Failing LanguageCode for those endpoints: `it-it` (returns 403)

## Language Policy Applied (Bullwaves)

- `en-gb` applied to endpoints that accept `LanguageCode` in our flow:
  - POST /api/signalcentrereports
  - POST /api/signalcentre/products
  - POST /api/marketinsights
  - POST /api/AcuityNews
  - POST /api/AcuityEvents
- No `LanguageCode` field used for:
  - POST /api/percentagepositivity/multiassets
  - POST /api/sentiment/value/multiassets
    - validated model: {"AssetIds":[50],"SentimentTypeId":12,"Period":1}

## Knowledge Base - Main APIs

- API docs hub: https://knowledgebase.acuitytrading.com/en/acuity-client-knowledge-base/api-documentation
- Signal Centre API: https://knowledgebase.acuitytrading.com/en/acuity-client-knowledge-base/signal-centre-api-documentation
- Acuity Technical Analysis Patterns API: https://knowledgebase.acuitytrading.com/en/acuity-client-knowledge-base/acuity-technical-analysis-patterns-api
- Acuity Sentiment API: https://knowledgebase.acuitytrading.com/en/acuity-client-knowledge-base/acuity-sentiment-api-documentation
- Acuity Market Companion API: https://knowledgebase.acuitytrading.com/en/acuity-client-knowledge-base/acuity-market-insights-api
- Acuity Corporate Events API: https://knowledgebase.acuitytrading.com/en/acuity-client-knowledge-base/acuity-corporate-events-api
- Acuity News Service API: https://knowledgebase.acuitytrading.com/en/acuity-client-knowledge-base/acuity-news-service-api-documentation
- FXStreet News API: https://knowledgebase.acuitytrading.com/en/acuity-client-knowledge-base/fxstreet-news-api-documentation
- FXStreet Calendar API: https://knowledgebase.acuitytrading.com/en/acuity-client-knowledge-base/fxstreet-calendar-api-guide

## Acuity Core API Docs

- API overview: https://api.acuitytrading.com/
- Swagger: https://api.acuitytrading.com/swagger/index.html
- Security/Auth: https://api.acuitytrading.com/Security
- Streaming docs: https://api.acuitytrading.com/Streaming

## REST Endpoints to Test/Track

- POST /api/signalcentrereports
- POST /api/signalcentre/products
- POST /api/percentagepositivity/multiassets
- POST /api/sentiment/value/multiassets
- POST /api/marketinsights
- POST /api/AcuityNews
- POST /api/fxnews
- POST /api/fxevents
- POST /api/AcuityEvents

## Notes

- Working in current account (observed):
  - /api/signalcentrereports (200)
  - /api/signalcentre/products (200)
  - /api/percentagepositivity/multiassets (200)
  - /api/sentiment/value/multiassets (200)
  - /api/marketinsights (200 with en-gb)
  - /api/AcuityNews (200 with en-gb)
  - /api/AcuityEvents (200 with en-gb)

- Blocked in current account (observed):
  - /api/fxevents (403 Forbidden)
  - /api/fxnews (403 Forbidden) — expected from subscription discussion

- Request models validated (current):
  - /api/signalcentrereports
    - {"StartDate":"2026-05-01","EndDate":"2026-05-04","LanguageCode":"en-gb","Period":"intraday","IncludeExpired":false,"Count":5}
  - /api/signalcentre/products
    - {"LanguageCode":"en-gb","Count":5}
  - /api/percentagepositivity/multiassets
    - {"AssetIds":[50],"SentimentTypeId":13,"Period":1}
  - /api/sentiment/value/multiassets
    - {"AssetIds":[50],"SentimentTypeId":12,"Period":1}
  - /api/marketinsights
    - {"StartDate":"2026-05-01","EndDate":"2026-05-04","LanguageCode":"en-gb","ArticleTypes":["macroeconomicAsset"],"Count":5}
  - /api/AcuityNews
    - {"StartDate":"2026-05-01","EndDate":"2026-05-04","LanguageCode":"en-gb","Count":5}
  - /api/AcuityEvents
    - {"StartDate":"2026-05-01","EndDate":"2026-05-31","LanguageCode":"en-gb","Count":5}
  - /api/fxevents
    - {"StartDate":"2026-05-01","EndDate":"2026-05-31","LanguageCode":"it-it","Count":5} -> 403 (not entitled)

- Updated request models after support confirmation:
  - /api/marketinsights
    - {"StartDate":"2026-05-01","EndDate":"2026-05-04","LanguageCode":"en-gb","ArticleTypes":["macroeconomicAsset"],"Count":5}
  - /api/AcuityNews
    - {"StartDate":"2026-05-01","EndDate":"2026-05-04","LanguageCode":"en-gb","Count":5}
  - /api/AcuityEvents
    - {"StartDate":"2026-05-01","EndDate":"2026-05-31","LanguageCode":"en-gb","Count":5}

- Casing check:
  - /api/AcuityNews and /api/acuitynews both return 403 (same result)
  - /api/AcuityEvents and /api/acuityevents both return 200 (same result)
