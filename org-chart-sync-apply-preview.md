# Org Chart Sync Apply Preview (Dry Run)

Generated: 2026-03-09T17:34:36.292Z

Input: org-chart-sync-proposed-updates.json

Org source: src/pages/orgChartData.js
CSV source: Organigramma/Bullwaves Active Employees 2026 - Sheet1.csv

## Proposed Updates (all)

| Section | RoleIndex | Name | Email | Field | Org | CSV | Safety | Match |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| management-team | 1 | Francesco Ceccarini | francesco@bullwaves.com | division | Operations | Shareholder | review: role metadata change | email (1) |
| management-team | 1 | Francesco Ceccarini | francesco@bullwaves.com | department | Operations | Shareholder | review: role metadata change | email (1) |
| management-team | 1 | Francesco Ceccarini | francesco@bullwaves.com | region | Israel | Italy | review: field change | email (1) |
| dealing | 1 | Chris Psomas | chris.psomas@bullwaves.com | title | Head of Operations (Trading & Dealing) | Head of Operations | review: role metadata change | email (1) |
| business-development | 5 | Ghassan Zaghdoud | ghassan.z@bullwaves.com | department | Sales - Dubai | BDM - Dubai | review: role metadata change | email (1) |
| support-team | 10 | Nevena Planic | nevena.planic@bullwaves.com | title | Hybrid - operation & support | Support Agent | review: role metadata change | email (1) |
| support-team | 10 | Nevena Planic | nevena.planic@bullwaves.com | division | Technology | Operations | review: role metadata change | email (1) |
| support-team | 2 | Sonja Djuric | sonja.djuric@bullwaves.com | email | sonja.djuric@bullwaves.com | sonja.djruric@bullwaves.com | review: email differs by small edit distance (possible typo, d=1) | name (0.98) |
| support-team | 8 | Tamara Aramovic | tamara.aramovic@bullwaves.com | email | tamara.aramovic@bullwaves.com | tamara.avramovic@bullwaves.com | review: email differs by small edit distance (possible typo, d=1) | name (0.98) |

## Proposed Adds

No missing employees detected.

## Candidate Removals (Preview Only)

| Section | Name | Title | Email | Classification |
| --- | --- | --- | --- | --- |
| marketing | Daniel Taddei | Marketing Lead |  | uncertain / manual review needed |
| compliance | Terina | Compliance Officer |  | uncertain / manual review needed |

## Confirmed Duplicates / Multi-role Entries (Preserve)

| Section | Name | Title | Email | Classification |
| --- | --- | --- | --- | --- |
| management-team | Filippo De Rosa | Non Executive Director | filippo@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |
| support-team | Tamara Popovic Yakimov | Head of Support | tamara@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |
| operations | Paolo Vullo | Head of Operations | paolo.v@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |
| affiliation | Stefan Popovski | Shareholder / Affiliation Lead | partners@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |
| payments | Tamara Popovic Yakimov | Head of Support / PSP Oversight | tamara@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |
| dealing | Renato Pezzi | Shareholder (Dealing & PSPs) | renato@bullwaves.com | confirmed by CSV (duplicate/multi-role entry) — preserve |

---

This is a dry-run preview. It does not modify src/pages/orgChartData.js.
Use the pointers (Section + RoleIndex) to apply edits manually inside orgChartData.js.
