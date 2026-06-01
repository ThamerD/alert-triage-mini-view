# Plan: Alert Triage Mini-View

Working reference for the build. Update as decisions change.

## Confirmed decisions

| Area | Choice |
| --- | --- |
| Framework | Next.js 16.2.6 (App Router) + TypeScript |
| Runtime | Node v22.20.0 |
| Data loading | Static `public/alerts.json`, fetched on mount |
| Detail UI | Side drawer (list stays visible) |
| UX bonus | Severity-colored rows **and** full keyboard shortcuts |
| Backend deliverable | Both: C# ASP.NET endpoint **and** SQL schema (review-only, not wired) |
| Mock data | All 200 hand-written by Claude, committed to repo |
| Severity scale | Critical / High / Medium / Low |
| Status set | New / In Progress / Escalated / Resolved / Suppressed |
| Styling | CSS Modules only (per CLAUDE.md) — no Tailwind, no UI kit |
| Dependencies | next, react, react-dom + TS types only — no runtime libs |
| Screen recording | User handles, not Claude |

## Stack & ground rules

- One `app/page.tsx` marked `"use client"`, top-level state + composition
- State: `useState` + `useReducer` for alerts, `useMemo` for filter/sort
- No state management library, no UI library, no inline styles

## File layout

```
alert-triage-mini-view/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  // "use client", top-level state
│   ├── page.module.css
│   └── globals.css
├── components/
│   ├── AlertList.tsx + .module.css
│   ├── AlertRow.tsx + .module.css        // severity-colored left bar
│   ├── FilterBar.tsx + .module.css       // search, severity, status, source
│   ├── AlertDrawer.tsx + .module.css     // detail + status changer
│   └── SeverityBadge.tsx + .module.css   // shared chip
├── lib/
│   ├── types.ts                  // Alert, Severity, Status, Source
│   ├── filterAlerts.ts           // pure fn: (alerts, filters) => Alert[]
│   └── useKeyboardShortcuts.ts   // j/k navigate, 1-5 status, / search, esc
├── public/
│   └── alerts.json               // 200 hand-written alerts
├── backend/                      // not wired to app — review-only
│   ├── AlertsController.cs
│   └── schema.sql
├── plan.md                       // this file
└── README.md
```

## Data model

```ts
type Severity = "Critical" | "High" | "Medium" | "Low";
type Status   = "New" | "In Progress" | "Escalated" | "Resolved" | "Suppressed";
type Source   = "EDR" | "SIEM" | "IDS" | "Email Gateway" | "Cloud Audit" | "Identity";
type Alert = {
  id: string;            // e.g. "ALT-00042"
  title: string;
  severity: Severity;
  status: Status;
  source: Source;
  createdAt: string;     // ISO
  assignee: string | null;
  description: string;
  entity: string;        // host / user / ip
};
```

## Mock data distribution targets

- 200 alerts total, hand-written by Claude
- Severity: ~10 Critical, ~40 High, ~90 Medium, ~60 Low
- Status: ~110 New, ~40 In Progress, ~20 Escalated, ~20 Resolved, ~10 Suppressed
- Sources: roughly even, EDR slightly heavier
- `createdAt` spread across the 7 days ending 2026-05-31
- Assignee pool: t.azim@corp.com (current user), plus 6–8 other believable emails; many `null` (unassigned), especially New alerts

## UX bonus (combined)

1. **Severity-colored left bar** on each row (red / orange / amber / slate)
2. **Keyboard shortcuts**:
   - `j` / `k` — next / previous alert
   - `/` — focus search input
   - `Esc` — close drawer / blur search
   - `1`–`5` — set selected alert's status
   - `?` — toggle shortcut cheatsheet overlay

Rationale (for README): SOC analysts triage hundreds of alerts per shift; keyboard-first navigation is the single biggest throughput win and a baseline expectation in tools like Splunk SOAR and Chronicle.

## Backend stubs (review-only, in `/backend`)

- **AlertsController.cs** — `PATCH /api/alerts/{id}/status` taking `{ status, note? }`, returns updated alert. Constructor-injected `IAlertsRepository`, validates status against enum, returns 404 / 409 / 200. Production notes inline (auth, idempotency key, audit trail, optimistic concurrency via `rowversion`).
- **schema.sql** — `Alerts` table + `AlertStatusHistory` audit table + parameterized `UPDATE` with `OUTPUT INTO` to write history atomically. Indexes on `(status, severity, created_at)`.

## README contents (≤ 1 page)

- Key decisions and trade-offs
- AI agent usage: how I used Claude Code, what I delegated (data generation, README draft), where I overrode (state shape, keyboard handler scope)
- Production hardening: real auth + RBAC, server-side filter/pagination, websocket alert push, audit log, optimistic concurrency, rate-limit status changes, SLA timers, alert correlation

## Build order

1. ✅ Scaffold (package.json, tsconfig, next.config, next-env)
2. ✅ `lib/types.ts`
3. ⏳ `public/alerts.json` — 200 hand-written alerts
4. `lib/filterAlerts.ts`
5. `FilterBar`, `AlertList`, `AlertRow`, `SeverityBadge` + CSS modules
6. `AlertDrawer` + status change reducer
7. `useKeyboardShortcuts` hook + cheatsheet overlay
8. `app/page.tsx`, `app/layout.tsx`, `app/globals.css`
9. `backend/AlertsController.cs` + `backend/schema.sql`
10. `npm install`, verify `next dev`
11. `README.md`

## Open follow-ups

- None right now — answers locked in after the two clarifying-question passes
