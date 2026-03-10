# Org Chart Sync Report (Preview)

Generated: 2026-03-09T18:38:45.217Z

Reference CSV: Organigramma/Bullwaves Active Employees 2026 - Sheet1.csv

Current org chart source of truth: src/pages/orgChartData.js

## 1) Executive Summary

| Metric | Value |
| --- | --- |
| Total current org chart roles (all sections) | 66 |
| Current org chart employee-candidate roles | 51 |
| Current org chart structural/custom roles preserved | 15 |
| Total CSV employees | 43 |
| Matched records | 43 |
| New people to add | 0 |
| Existing people to update | 6 |
| Candidate removals (unmatched org people) | 2 |
| Confirmed duplicates/multi-role entries | 6 |
| Ambiguous matches | 4 |
| Email collisions/warnings | 6 |

## 2) People to Add

No missing employees detected.

## 3) People to Update

### Francesco Ceccarini (management-team)
Match: email · confidence=1 · reason=email match
| Field | Current (org chart) | CSV |
| --- | --- | --- |
| division | Operations | Shareholder |
| department | Operations | Shareholder |
| region | Israel | Italy |

### Chris Psomas (dealing)
Match: email · confidence=1 · reason=email match
| Field | Current (org chart) | CSV |
| --- | --- | --- |
| title | Head of Operations (Trading & Dealing) | Head of Operations |

### Ghassan Zaghdoud (business-development)
Match: email · confidence=1 · reason=email match
| Field | Current (org chart) | CSV |
| --- | --- | --- |
| department | Sales - Dubai | BDM - Dubai |

### Nevena Planic (support-team)
Match: email · confidence=1 · reason=email match
| Field | Current (org chart) | CSV |
| --- | --- | --- |
| title | Hybrid - operation & support | Support Agent |
| division | Technology | Operations |

### Sonja Djuric (support-team)
Match: name · confidence=0.98 · reason=unique exact name match
| Field | Current (org chart) | CSV |
| --- | --- | --- |
| email | sonja.djuric@bullwaves.com | sonja.djruric@bullwaves.com |

### Tamara Aramovic (support-team)
Match: name · confidence=0.98 · reason=unique exact name match
| Field | Current (org chart) | CSV |
| --- | --- | --- |
| email | tamara.aramovic@bullwaves.com | tamara.avramovic@bullwaves.com |


## 4) Candidate Removals

These org chart entries were not found in the CSV. IMPORTANT: no deletions are performed; this is preview-only.
| Section | Name/Label | Title | Email | Classification |
| --- | --- | --- | --- | --- |
| marketing | Daniel Taddei | Marketing Lead |  | uncertain / manual review needed |
| compliance | Terina | Compliance Officer |  | uncertain / manual review needed |

### Confirmed duplicates / multi-role entries (preserve)

| Section | Name | Title | Email | Classification |
| --- | --- | --- | --- | --- |
| management-team | Filippo De Rosa | Non Executive Director | filippo@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |
| support-team | Tamara Popovic Yakimov | Head of Support | tamara@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |
| operations | Paolo Vullo | Head of Operations | paolo.v@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |
| affiliation | Stefan Popovski | Shareholder / Affiliation Lead | partners@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |
| payments | Tamara Popovic Yakimov | Head of Support / PSP Oversight | tamara@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |
| dealing | Renato Pezzi | Shareholder (Dealing & PSPs) | renato@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |

## 5) Ambiguities and Warnings

### Email collisions / shared inboxes
| Email | Generic? | CSV Count | Org Count |
| --- | --- | --- | --- |
| affiliates@bullwaves.com | yes | 1 | 1 |
| filippo@bullwaves.com | no | 1 | 2 |
| renato@bullwaves.com | no | 1 | 2 |
| partners@bullwaves.com | yes | 1 | 2 |
| tamara@bullwaves.com | no | 1 | 3 |
| paolo.v@bullwaves.com | no | 1 | 2 |

### Ambiguous matches
| Kind | Details |
| --- | --- |
| email-collision-in-org | {"kind":"email-collision-in-org","email":"renato@bullwaves.com","generic":false,"csv":{"name":"Renato Pezzi","title":"Shareholder","division":"Shareholder","department":"Shareholde |
| email-collision-in-org | {"kind":"email-collision-in-org","email":"partners@bullwaves.com","generic":true,"csv":{"name":"Stefan Popovski","title":"Shareholder","division":"Shareholder","department":"Shareh |
| email-collision-in-org | {"kind":"email-collision-in-org","email":"tamara@bullwaves.com","generic":false,"csv":{"name":"Tamara Popovic Yakimov","title":"Head of Support","division":"Operations","department |
| email-collision-in-org | {"kind":"email-collision-in-org","email":"paolo.v@bullwaves.com","generic":false,"csv":{"name":"Paolo Vullo","title":"Head of Operations","division":"Operations","department":"Oper |

## 6) Proposed Integration Plan

- Preserve existing org chart hierarchy and section structure by default.
- Apply updates only for high-confidence matches (unique email or unique exact name).
- Do not remove unmatched nodes automatically; keep them as candidate removals for manual review.
- Add missing employees only with manual placement confirmation (CSV has no manager relationships).
- Keep shared inbox emails as warnings; prefer name-based confirmation for those.

---

### Implementation notes (current org chart sources)
- Internal org chart page: src/pages/OrgChart.jsx renders cards from sections in src/pages/orgChartData.js.
- Public share people view: public/share/org-chart-people.json is generated from src/pages/orgChartData.js via scripts/generate_share_org_people_index.mjs and injected into an existing fixed structure (ShareOrgChartTrueTree).
- Public diagram view: src/pages/share/ShareOrgChart.jsx builds a derived model via src/components/orgchart/orgModel.js (no emails).
