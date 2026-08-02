# Finini Dashboard — Week One Plan

Personal task/project management app for Luyanda Finini, with per-task access for
one helper. React 19 + TypeScript + Vite, plain CSS with design tokens,
mobile-first.

## Status

**The validation demo is complete. The week-one build is not started.**

Those are different things and the distinction matters. The demo exists to show
the client the timeline concept; week one is the first paid increment that turns
it into something he can actually use across two devices.

## Done — the validation demo

Built across `61fd507`, `54fc396`, `232f388` and `a04d669`.

- [x] React 19 + TypeScript + Vite scaffold
- [x] Plain CSS with design tokens, mobile-first (breakpoints at 640px / 960px)
- [x] `TaskStore` interface with a localStorage implementation — all persistence
      goes through it, no component touches storage directly
- [x] Week maths, health and urgency ordering in `src/lib/progress.ts`
- [x] `Dashboard`, `TaskCard`, `TaskDetail`, `TaskForm`, `ShareDialog`, `Modal`,
      `WeekProgress`, `useTasks`
- [x] Seed data generated relative to today
- [x] Single-file demo bundle (`npm run build:demo`)
- [x] Test coverage: `progress.test.ts` (16), `store.test.ts` (11),
      `App.test.tsx` (5) — 32 passing, lint and build clean

## Not started — the week-one build

None of the below exists yet. Ordered by dependency.

- [ ] **Notes against tasks.** `TaskNote` type, store methods, UI in `TaskDetail`.
      Prerequisite for both stall detection and AI summaries — without notes
      there is nothing to summarise beyond the client's own form fields.
- [ ] **Status-change history.** `TaskEvent` type; every status transition
      recorded through the store. Foundation for stall detection.
- [ ] **`stalledFor(task)` helper.** Days since last recorded movement, with
      tests for no-events, recent-movement and long-stall cases. Not wired to
      alerts in week one.
- [ ] **Auth UI shell.** Login and signup screens, unauthenticated state, and a
      `useAuth` hook stubbed behind the same swappable-adapter pattern as
      `TaskStore`. No real backend in week one.
- [ ] **PWA.** Manifest, icons, service worker registration, installable to home
      screen. Required before push notifications can work at all on iOS.
- [ ] **`SupabaseTaskStore` skeleton.** Full `TaskStore` interface plus SQL
      migrations for `tasks`, `task_notes`, `task_events`, `shares`, `profiles`.
      Written against the schema, not connected — no credentials in the repo.

## Blocked pending client input

- **User model.** One user with an occasional helper, or several administrators?
  This changes the schema and every row-level security policy. Build single-user
  until answered; the Supabase migrations are where it would diverge.
- **Report format.** A sample of the progress report the client currently
  compiles by hand. Blocks the consolidated reporting work in week three.

## Notes

- Storage, auth and sync are deliberately mocked in the demo. The `TaskStore`
  interface is the seam for swapping in a real backend.
- Component tests opt into jsdom per-file via a `// @vitest-environment jsdom`
  docblock, so the node-environment lib tests are unaffected. Setting jsdom
  globally breaks `store.test.ts`, which stubs `localStorage` — worth preserving
  if anyone revisits the test config.
