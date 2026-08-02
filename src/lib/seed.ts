import { addDays, format } from 'date-fns'
import type { Task } from '../types'

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
    task: Omit<Task, 'createdAt' | 'updatedAt' | 'shares' | 'notes'> & Partial<Task>,
  ): Task => ({
    createdAt: now,
    updatedAt: now,
    shares: [],
    notes: [],
    ...task,
  })

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
    }),
  ]
}
