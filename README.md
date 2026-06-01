# Alert Triage Mini-View

A Next.js 16 + TypeScript triage page for security alerts. Sortable
and filterable list, side drawer for detail, in-memory status changes,
keyboard-driven workflow.

## Demo


https://github.com/user-attachments/assets/254fc1d6-c422-4d87-a996-897f74dcd09b



## Run

```
npm install
npm run dev      # http://localhost:3000
```

Built and verified against **Node v22.20.0 / Next.js v16.2.6**.

## What's in here

```
app/                  Next.js App Router page + layout + global CSS
components/           AlertList, AlertRow, FilterBar, AlertDrawer, HelpOverlay, SeverityBadge
lib/                  types.ts, filterAlerts.ts, useKeyboardShortcuts.ts
public/alerts.json    200 mock alerts
backend/              C# ASP.NET controller + SQL schema (review-only, not wired)
plan.md               The plan created with the coding agent before building
```

## Key decisions and trade-offs

- **No runtime dependencies beyond Next/React.** No Tailwind, no UI kit, no
  state library. Reasoning: the exercise is small, and bringing in a UI kit
  would obscure the bits worth showing (state shape, keyboard hook, filter
  pipeline). CSS Modules per component.
- **App Router, single client page.** All state lives in `app/page.tsx`. A
  `useReducer` owns the alerts collection; filters and selection are local
  `useState`. Pure functions (`filterAndSort`) sit in `lib/` and are
  memoized at the page level.
- **Side drawer over modal.** Keeps the list in view while reading the
  detail. Standard SOC pattern, matches Splunk SOAR / Chronicle / Sentinel.
- **Static `public/alerts.json` fetched on mount** rather than imported as a
  module. Mimics a real API call and makes it trivial to swap for a backend.
- **Severity-driven visual scan-ability.** Red/orange/amber/slate left bar
  on every row, plus colored severity badge.
- **Keyboard-first.** `j`/`k` navigate, `1-5` set status, `/` focuses
  search, `Esc` closes the drawer, `?` toggles a cheatsheet. SOC analysts
  triage hundreds of alerts per shift, and keyboard navigation is the
  single biggest throughput win and a baseline expectation in tools they
  already use.
- **`createdAt` shown as relative time** ("4m ago", "2h ago") with a
  30-second tick. Absolute timestamp is shown in the drawer.

## UX improvement (the bonus)

**Full keyboard shortcuts.** `j`/`k` to walk the queue, `1-5` to set
status on the focused alert, `/` to jump into search, `Esc` to close,
`?` for a cheatsheet. SOC analysts triage hundreds of alerts per shift
and live on the keyboard. Cutting the mouse out of the inner loop is
the single biggest throughput win in a triage UI.

## How I used AI coding agents

Built with Claude Code. What I delegated vs. drove:

- **Delegated:** boilerplate (tsconfig, layout.tsx, CSS module bodies),
  the 200-alert JSON corpus (with my distribution targets: ~5% Critical,
  ~55% New, source/severity balanced), C# / SQL boilerplate.
- **Drove (overrode the default suggestion):** chose App Router up front;
  rejected Tailwind / shadcn;
  rejected a modal in favour of a drawer; drove the UX improvement "bonus"
  ; made the
  agent ask clarifying questions before writing any code, so we built the
  right thing the first time.
- **Pattern:** two rounds of structured "A / B / C with tradeoffs"
  questions up front, then a written `plan.md` checked into the repo
  before code was touched. Adjust and confirm plan before writing code.
  Then: build, review, test, fix, commit.

## What I'd do differently for production

- **Real backend.** `backend/AlertsController.cs` + `backend/schema.sql`
  sketch it: PATCH endpoint with rowversion concurrency, atomic audit row
  via `OUTPUT INTO`, idempotency-key header, `[Authorize]` + analyst-role
  policy, structured logs, status-change metric, domain event onto a bus
  for SOAR / SLA / correlation downstream.
- **Server-side filter, sort, pagination** with a covering index on
  `(status, severity, created_at DESC)`. At real volume the
  fetch-everything-and-filter-in-React approach falls over fast.
- **Push, not poll.** WebSocket or SSE so new alerts appear without
  refresh, and so a colleague's status change is reflected immediately.
- **State-machine validation** on transitions (no `Suppressed -> New`
  without a reopen role), enforced both in C# and as a SQL CHECK.
- **Bulk operations + saved views** (the next two UX wins I'd add):
  multi-select with shift-click, "mark N as Resolved", and one-click
  filter chips like "My open criticals" or "Unassigned new in last 1h".
- **SLA timers and aging.** Color the relative-time chip red once it
  crosses the SLA threshold for that severity.
- **Alert correlation.** Group beaconing on the same host, multiple
  failed-login sources, etc., so the analyst triages a cluster instead of
  300 near-identical events.
- **Tests.** `filterAndSort` is pure and ready to unit-test; component
  tests with React Testing Library for the keyboard hook and drawer
  status changes; Playwright for the end-to-end triage flow.
- **Telemetry.** Time-to-acknowledge, time-to-resolve, status-change rate
  per analyst. These are the metrics that tell you whether the UX is
  actually helping the team move faster.
