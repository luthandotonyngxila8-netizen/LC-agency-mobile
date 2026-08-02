# Finini Dashboard — Week One Plan

Personal task/project management app for Luyanda Finini, with per-task access for
one helper. React 19 + TypeScript + Vite, plain CSS with design tokens,
mobile-first.

## Status

**The validation demo is complete. The week-one build is half done:** notes,
activity events and stall detection are in; auth, the PWA and the Supabase
skeleton are not.

The demo and the build are different things and the distinction matters. The
demo exists to show the client the timeline concept; week one is the first paid
increment that turns it into something he can actually use across two devices.

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
- [x] Test coverage across `progress.test.ts`, `store.test.ts`,
      `format.test.ts` and `App.test.tsx` — 61 passing, lint and build clean

## The week-one build — 3 of 6 done

Ordered by dependency.

- [x] **Notes against tasks** (`50769d1`). Append-only, newest first, through
      the `TaskStore` interface. The store backfills the field on read so tasks
      saved by the previous build don't throw.
- [x] **Activity events** (`0b3fd3e`). `TaskEvent` discriminated union recording
      status transitions, date moves and notes. Renames and rewordings record
      nothing, so tidying a stalled task can't make it look alive.
- [x] **Stall detection** (`1689146`). `isStalled` / `daysSinceMovement` in
      `progress.ts`, threshold `STALL_THRESHOLD_DAYS` = 7. Surfaced as a card tag
      and a notice in the detail pop-up. Finished and not-yet-started tasks never
      flag. Not wired to email or push — that's week two.
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
