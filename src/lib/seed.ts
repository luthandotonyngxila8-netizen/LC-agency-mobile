import { addDays, format } from 'date-fns'
import type { Task } from '../types'

/**
 * Bump this whenever the sample tasks below change shape or content.
 *
 * The demo writes its samples into the browser on first visit and reads those
 * back forever after. Without a stamp to compare against, someone who opened an
 * earlier build keeps seeing that build's data at the same link — current code
 * rendering stale content, with no way to tell. That is not a hypothetical: it
 * is how sub-projects failed to appear for a client who had opened the demo the
 * week before.
 */
export const SEED_VERSION = 2

/**
 * Demo data, generated relative to today so the timeline always shows a
 * realistic spread: something mid-flight, something nearly due, something
 * already delivered and something that hasn't kicked off yet.
 */
export function seedTasks(today: Date = new Date()): Task[] {
  const day = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd')
  const at = (offset: number) => addDays(today, offset).toISOString()
  const now = today.toISOString()

  const base = (
    task: Omit<
      Task,
      'createdAt' | 'updatedAt' | 'shares' | 'notes' | 'events' | 'parentId'
    > &
      Partial<Task>,
  ): Task => ({
    createdAt: now,
    updatedAt: now,
    parentId: null,
    shares: [],
    notes: [],
    events: [],
    ...task,
  })

  /** Shorthand for the two events every seeded task opens with. */
  const opened = (offset: number, id: string): Task['events'] => [
    {
      id: `${id}-ev-start`,
      at: at(offset),
      type: 'status_changed',
      from: 'not_started',
      to: 'in_progress',
    },
    { id: `${id}-ev-created`, at: at(offset), type: 'created' },
  ]

  return [
    base({
      id: 'seed-brand-refresh',
      title: 'Brand refresh rollout',
      description:
        'Refresh the visual identity across the site, deck templates and social profiles. Includes a new logo lockup, colour palette and a one-page brand guide.',
      endState:
        'New identity live on the website and all social profiles, with the brand guide PDF handed to the design contractor.',
      startDate: day(-16),
      endDate: day(25),
      status: 'in_progress',
      shares: [
        {
          id: 'seed-share-1',
          invitee: 'thandi@example.com',
          permission: 'edit',
          invitedAt: now,
          linkToken: 'a91c74be20f5',
        },
      ],
      notes: [
        {
          id: 'seed-note-4',
          body: 'Logo lockup signed off. Palette needs one more pass — the amber fails contrast on the dark header.',
          createdAt: at(-3),
        },
      ],
      events: [
        { id: 'seed-brand-ev-note', at: at(-3), type: 'note_added' },
        ...opened(-16, 'seed-brand'),
      ],
    }),
    // The brand refresh is broken into parts — one delivered, one running, and
    // one deliberately dated past the project itself so the overrun warning has
    // something to say. It's the case the client described: the project reads
    // green while a piece of it is already outside the deadline.
    base({
      id: 'seed-brand-identity',
      parentId: 'seed-brand-refresh',
      title: 'Logo lockup and colour palette',
      description: 'Settle the mark, the lockup variants and the palette before anything gets applied.',
      endState: 'Signed-off lockup files and hex values in the shared drive.',
      startDate: day(-16),
      endDate: day(-2),
      status: 'done',
      events: [
        {
          id: 'seed-bi-ev-done',
          at: at(-2),
          type: 'status_changed',
          from: 'in_progress',
          to: 'done',
        },
        ...opened(-16, 'seed-bi'),
      ],
    }),
    base({
      id: 'seed-brand-templates',
      parentId: 'seed-brand-refresh',
      title: 'Deck and document templates',
      description: 'Rebuild the pitch deck, proposal and invoice templates on the new identity.',
      endState: 'Templates in the shared drive and the old ones archived.',
      startDate: day(-1),
      endDate: day(18),
      status: 'in_progress',
      events: opened(-1, 'seed-bt'),
    }),
    base({
      id: 'seed-brand-social',
      parentId: 'seed-brand-refresh',
      title: 'Social profiles and banners',
      description: 'Swap avatars, banners and bios across every profile.',
      endState: 'All profiles carrying the new identity, with the old assets archived.',
      startDate: day(10),
      endDate: day(32),
      status: 'not_started',
      events: [{ id: 'seed-bs-ev-created', at: at(-16), type: 'created' }],
    }),
    base({
      id: 'seed-client-proposal',
      title: 'Retainer proposal — Meridian',
      description:
        'Scope, price and write the 12-month retainer proposal. Needs the case-study appendix and a rate card comparison against last year.',
      endState: 'Proposal PDF sent to Meridian and logged in the pipeline tracker.',
      startDate: day(-9),
      endDate: day(5),
      status: 'in_progress',
      shares: [
        {
          id: 'seed-share-2',
          invitee: 'assistant@example.com',
          permission: 'comment',
          invitedAt: now,
          linkToken: '7d3fe1b8c402',
        },
      ],
      notes: [
        {
          id: 'seed-note-1',
          body: 'Rate card comparison done. Their current spend is 18% under what the new scope needs — worth raising on the call rather than burying it in the appendix.',
          createdAt: at(-2),
        },
        {
          id: 'seed-note-2',
          body: 'Pulled the three strongest case studies. Waiting on sign-off from the client on the second one before it can go in.',
          createdAt: at(-6),
        },
      ],
      events: [
        { id: 'seed-prop-ev-n1', at: at(-2), type: 'note_added' },
        { id: 'seed-prop-ev-n2', at: at(-6), type: 'note_added' },
        ...opened(-9, 'seed-prop'),
      ],
    }),
    base({
      id: 'seed-certification',
      title: 'Project management certification',
      description:
        'Work through the 12-week course: one module a week, practice exam in week 10, sit the final assessment in week 12.',
      endState: 'Assessment passed and the certificate saved to the credentials folder.',
      startDate: day(-38),
      endDate: day(45),
      status: 'in_progress',
      notes: [
        {
          id: 'seed-note-5',
          body: 'Module 6 done. Practice exam booked for the week of the 10th.',
          createdAt: at(-4),
        },
      ],
      events: [
        { id: 'seed-cert-ev-note', at: at(-4), type: 'note_added' },
        ...opened(-38, 'seed-cert'),
      ],
    }),
    base({
      id: 'seed-tax-pack',
      title: 'Year-end tax pack',
      description:
        'Pull together invoices, receipts and bank statements for the accountant. Two-week turnaround, mostly admin.',
      endState: 'Complete pack in the accountant’s shared folder with the summary spreadsheet reconciled.',
      startDate: day(-20),
      endDate: day(-7),
      status: 'in_progress',
      notes: [
        {
          id: 'seed-note-3',
          body: 'Still blocked on the bank statements for March and April — requested twice now. Everything else is reconciled and ready to hand over.',
          createdAt: at(-11),
        },
      ],
      // Deliberately quiet since that note: this is the task the dashboard
      // should flag as stalled, and its status alone would never say so.
      events: [
        { id: 'seed-tax-ev-note', at: at(-11), type: 'note_added' },
        ...opened(-20, 'seed-tax'),
      ],
    }),
    base({
      id: 'seed-site-copy',
      title: 'Website copy rewrite',
      description:
        'Rewrite the home, services and about pages so they match the new positioning. Draft, review, then hand to the developer.',
      endState: 'Final copy approved and pasted into the CMS staging environment.',
      startDate: day(-45),
      endDate: day(-17),
      status: 'done',
      events: [
        {
          id: 'seed-copy-ev-done',
          at: at(-17),
          type: 'status_changed',
          from: 'in_progress',
          to: 'done',
        },
        ...opened(-45, 'seed-copy'),
      ],
    }),
    base({
      id: 'seed-q4-planning',
      title: 'Q4 planning sprint',
      description:
        'Set the quarter’s revenue target, pick the three priorities and block the calendar around them.',
      endState: 'One-page quarter plan written, with targets and priorities agreed.',
      startDate: day(9),
      endDate: day(30),
      status: 'not_started',
      events: [{ id: 'seed-q4-ev-created', at: at(-1), type: 'created' }],
    }),
  ]
}
