# Finini Dashboard — demo build

A personal task/project dashboard for a single primary user, built to the discovery-call
brief. This is the **validation demo**, not the finished product: it exists to show the
timeline concept, the task structure and the sharing flow before the full build is scoped.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # week-math tests
npm run build    # production build into dist/
```

The build output in `dist/` is plain static files — it can be dropped on any host
(Netlify, Vercel, Cloudflare Pages, S3, a folder on a server).

### Installing it on a phone

The production build is a PWA. Open it, then use the browser's "Add to Home Screen"
and it installs as an app: its own icon, no browser chrome, and it opens with no
connection at all (the app shell is precached).

On iPhone this step is not optional if notifications matter — iOS delivers web push
**only** to a web app that has been added to the Home Screen.

### Sharing the demo as one file

```bash
npm run build:demo
```

That writes `demo/finini-dashboard-demo.html`: the whole app — markup, styles and
JavaScript — inlined into a single file with no external references. It can be emailed,
opened straight off a phone, or hosted anywhere. Handy for sending the client something
to click without standing up hosting first.

It builds in a separate `demo` mode with the service worker disabled, since a single
self-contained file has no origin to serve one from.

## What the demo covers

**1. Timeline progress view — the "Week 1 of Week 4" screen.**
This is the first thing on the home screen. The most pressing task gets a full-width
timeline card; every task in the list carries a compact version of the same component.

- Segmented week bar: filled weeks behind you, a highlighted current week, empty weeks ahead.
- Auto-calculated from start and end dates — nothing to maintain by hand.
- Colour tracks urgency: on track (green), due this week (amber), past deadline (red).
- Tasks that haven't started show a countdown ("Starts in 9 days") instead of a week count.
- Works across the range in the brief — 2 weeks up to 12 (and beyond; past 14 weeks it
  falls back to a continuous bar rather than an unreadable row of slivers).

**2. Task structure.** Title, what's involved, definition of done, start date, target end
date, and a three-state status (not started / in progress / done). Creating or editing a
task previews the resulting timeline length before you save.

A project can be broken into **parts**, one level deep. Each part carries its own
timeline, notes and sharing, and the project shows how many are done. A part dated past
the project holding it is flagged — on the project's card, inside the project, inside the
part, and while the dates are being chosen. That case is the point: the project's own
timeline would otherwise report health right up to a deadline it can't meet.

## Where it will be hosted

The build output is static files, so the app itself runs almost anywhere — including
ordinary cPanel-style web hosting. Two things it does need:

- **HTTPS.** Without it the service worker won't register, so it can't be installed to a
  phone and can't receive push notifications.
- **Somewhere for the database.** Postgres, auth and the row-level rules are a hosted
  service; they can't run on shared hosting. Self-hosting them needs a server with Docker,
  which is the maintenance burden the client explicitly wanted to avoid.

The recommendation is therefore **his domain, not his hosting**: point a subdomain at a
static host (free at this scale, HTTPS included, deploys from the repo) so the dashboard's
uptime isn't tied to his website's and nobody has to upload files by hand.

**3. Sharing and permissions (mocked).** Per-task sharing with three Google-Docs-style
tiers — view, comment, edit. Invite by name/email, change someone's level, revoke access,
copy a per-task share link. The dashboard stays private by default; sharing is always
scoped to one task.

**Cross-platform.** Responsive, mobile-first. On a phone the dialogs are bottom sheets and
every control is thumb-sized; on desktop it becomes a three-column board. No install step
— it's a web app that works on both.

## What's mocked

- **Storage** is the browser's `localStorage`, so the demo needs no backend, no login and
  no hosting bill. Data lives on the device it was entered on. "Reset demo data" in the
  footer restores the sample tasks.
- **Invites** are saved locally; no email is sent and the share links don't resolve.
- **No authentication.** Deliberately — see below.

## Architecture — and the "don't build it all from scratch" constraint

The client's stated concern was licensing and long-term maintenance falling on him after
handover. The build answers that in two ways.

**Nothing bespoke that a stable platform already solves.** The parts that are genuinely
expensive to own forever — auth, storage, sync, per-row access rules — are deliberately
*not* implemented here. They sit behind one interface, `TaskStore` in
[`src/lib/store.ts`](src/lib/store.ts):

```ts
interface TaskStore {
  list(): Promise<Task[]>
  create(draft: TaskDraft): Promise<Task>
  update(id, patch): Promise<Task>
  remove(id): Promise<void>
  addShare(taskId, invitee, permission): Promise<Task>
  // …
}
```

Every method is async and no component talks to storage directly, so pointing the app at a
hosted backend is one file.

**The Supabase implementation is already written.** It is not connected — there is no
project and no credentials in this repo — but it exists so switching over is a change of
two exports rather than a piece of work nobody has looked at:

```
supabase/migrations/0001_initial_schema.sql   tables, row-level security, triggers
src/lib/supabase-store.ts                     SupabaseTaskStore implements TaskStore
src/lib/supabase-auth.ts                      SupabaseAuthProvider implements AuthProvider
```

To go live: create the project, run the migration, add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`, then replace the last line of `src/lib/store.ts` and
`src/lib/auth.ts` with the Supabase versions. Nothing in `src/components` changes.

Two things move into the database at that point, on purpose. Activity events are written
by triggers rather than by the client, so the log cannot be bypassed or drift. And access
is enforced by row-level security, so a helper with view-only access gets nothing back
from a write — whatever the interface lets them click.

Two routes worth costing at the follow-up:

| Option | What it gives you | Trade-off |
| --- | --- | --- |
| **Supabase** (or Firebase) | Postgres, auth, and row-level security that enforces per-task sharing server-side — exactly the permission model in the brief | A monthly subscription; free tier covers a single user comfortably |
| **Existing task platform API** (Notion, Todoist, ClickUp) | Storage, mobile apps and sharing already solved; this app becomes the timeline layer on top | Their data model constrains the fields; API limits apply |

The timeline UI is custom either way — that's the piece with no off-the-shelf equivalent,
and it's the piece the client actually asked for.

**No lock-in on the parts we did write.** Stack is React + TypeScript + Vite, all MIT
licensed. One runtime dependency (`date-fns`, MIT). Plain CSS with design tokens, no
proprietary UI kit or component licence. The whole thing builds to static files that any
web developer can pick up, and IP transfers cleanly.

### Still open

The brief flags exploring an AI/platform integration, possibly subscription-based, as
unresolved research on Tony's side. Nothing here commits to or blocks that — if it lands,
the natural fit is as a layer over the same `TaskStore` (drafting a task's description and
definition of done, or suggesting a realistic end date from a description). Worth deciding
before the full build, not before the demo.

## Layout

```
src/
  types.ts               Task, Share, permission tiers
  lib/
    progress.ts          Week math — "Week 1 of 4", health, urgency ordering
    progress.test.ts     Tests covering the week boundaries
    store.ts             TaskStore interface + localStorage implementation
    seed.ts              Sample tasks, generated relative to today
  hooks/useTasks.ts      Single source of truth for the task list
  components/
    Dashboard.tsx        Home screen: summary, focus card, task list
    WeekProgress.tsx     The timeline component
    TaskCard.tsx         Compact task row
    TaskDetail.tsx       Task pop-up
    TaskForm.tsx         Create / edit
    ShareDialog.tsx      Per-task sharing
    Modal.tsx            Dialog shell (bottom sheet on mobile)
```

The week calculation is the load-bearing logic, so it's isolated in `lib/progress.ts` and
covered by tests — inclusive date ranges, the day-7-to-day-8 rollover, partial final weeks,
and not running past the final week once a deadline passes.
