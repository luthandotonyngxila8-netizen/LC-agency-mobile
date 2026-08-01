# Finini Dashboard — Week One Plan

Personal task/project management demo for Luyanda Finini + one helper. React 19 +
TypeScript + Vite, plain CSS with design tokens, mobile-first.

This plan is kept in sync with what's actually in the repo. Status reflects the
codebase as found, not just what was requested — items below were already built
across the first two commits (`61fd507`, `54fc396`) before this plan file existed.

## Scope

- [x] React 19 + TypeScript + Vite project scaffold
- [x] Plain CSS with design tokens, mobile-first (`src/index.css`, breakpoints at
      640px/960px)
- [x] `TaskStore` interface with a `localStorage` implementation; all persistence
      goes through it (`src/lib/store.ts`) — no component talks to storage directly
- [x] Week maths, health, urgency ordering in `src/lib/progress.ts`, covered by
      `src/lib/progress.test.ts` (16 tests passing: inclusive ranges, day-7/8
      rollover, partial final weeks, phases, health, urgency sort)
- [x] `Dashboard` — summary stats, focus card (closest deadline), filterable task list
- [x] `TaskCard` — compact row with health pill, week progress, status/share tags
- [x] `TaskDetail` — pop-up with timeline, status control, description, end state,
      dates, access list
- [x] `TaskForm` — create/edit with live timeline preview and validation
- [x] `ShareDialog` — per-task invite, permission levels (view/comment/edit), share
      link, revoke
- [x] `Modal` — dialog shell, bottom-sheet on mobile, Escape-to-close, focus on open
- [x] `WeekProgress` — segmented week bar (hero + card variants), falls back to a
      continuous bar past 14 weeks
- [x] `useTasks` hook — single source of truth for the task list, wraps the store
- [x] Seed data (`src/lib/seed.ts`) generated relative to today
- [x] `npm test`, `npm run lint`, `npm run build` all passing
- [x] Single-file demo bundle (`npm run build:demo` → `demo/finini-dashboard-demo.html`)

## Remaining / next up

- [x] Test coverage for `src/lib/store.ts` (`LocalTaskStore`) — create, update,
      remove, share add/update/remove, and the in-memory fallback path when
      `localStorage` is unavailable. Added `src/lib/store.test.ts` (11 tests,
      using a minimal in-memory `Storage` mock so no jsdom dependency is needed).
- [x] Light interaction coverage for the dialog flow (open → edit → save). Added
      `src/App.test.tsx` (5 tests) covering opening a task from the dashboard,
      editing and saving a title, persistence through the store, changing status,
      and closing the dialog. Wired up `@testing-library/react`,
      `@testing-library/user-event` and `jsdom` as devDependencies; the component
      tests opt into jsdom per-file via a `// @vitest-environment jsdom` docblock
      so the existing node-environment lib tests are untouched.

All planned week-one scope is complete: 32 tests passing across `progress.ts`,
`store.ts` and the App dialog flow, with `npm run lint` and `npm run build` clean.

## Notes

- Storage, auth, and sync are deliberately mocked (see `README.md`) — the
  `TaskStore` interface is the seam for swapping in a real backend later.
- No scope items are blocked; everything above is either done or a coverage
  improvement on already-shipped code.
