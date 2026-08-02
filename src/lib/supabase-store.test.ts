import { describe, expect, it } from 'vitest'
import { toTask, type TaskRow } from './supabase-store'
import { isStalled, daysSinceMovement } from './progress'

/**
 * The mapping between the table shape and the domain shape is the one part of
 * the Supabase store that can be wrong without anything throwing — a dropped
 * field just quietly reads as empty. These tests pin it while there is no
 * project to run the real thing against.
 */

const row = (overrides: Partial<TaskRow> = {}): TaskRow => ({
  id: 'task-1',
  title: 'Year-end tax pack',
  description: 'Invoices, receipts, statements.',
  end_state: 'Pack in the shared folder.',
  start_date: '2026-07-13',
  end_date: '2026-07-26',
  status: 'in_progress',
  created_at: '2026-07-13T08:00:00.000Z',
  updated_at: '2026-07-22T09:00:00.000Z',
  task_notes: null,
  task_events: null,
  task_shares: null,
  ...overrides,
})

describe('toTask', () => {
  it('maps snake_case columns onto the domain shape', () => {
    const task = toTask(row())

    expect(task.endState).toBe('Pack in the shared folder.')
    expect(task.startDate).toBe('2026-07-13')
    expect(task.endDate).toBe('2026-07-26')
    expect(task.createdAt).toBe('2026-07-13T08:00:00.000Z')
    expect(task.updatedAt).toBe('2026-07-22T09:00:00.000Z')
  })

  it('turns absent related rows into empty arrays, not undefined', () => {
    // A task with no notes comes back with null collections from PostgREST.
    // Left as null they would throw on the first `.map()` in the UI.
    const task = toTask(row())
    expect(task.notes).toEqual([])
    expect(task.events).toEqual([])
    expect(task.shares).toEqual([])
  })

  it('orders notes newest first regardless of the order the rows arrive in', () => {
    const task = toTask(
      row({
        task_notes: [
          { id: 'n1', body: 'Older', created_at: '2026-07-14T08:00:00.000Z' },
          { id: 'n2', body: 'Newest', created_at: '2026-07-22T08:00:00.000Z' },
          { id: 'n3', body: 'Middle', created_at: '2026-07-18T08:00:00.000Z' },
        ],
      }),
    )

    expect(task.notes.map((note) => note.body)).toEqual(['Newest', 'Middle', 'Older'])
  })

  it('orders events newest first, so events[0] is the last thing that happened', () => {
    const task = toTask(
      row({
        task_events: [
          {
            id: 'e1',
            type: 'created',
            from_status: null,
            to_status: null,
            at: '2026-07-13T08:00:00.000Z',
          },
          {
            id: 'e2',
            type: 'note_added',
            from_status: null,
            to_status: null,
            at: '2026-07-22T08:00:00.000Z',
          },
        ],
      }),
    )

    expect(task.events[0].type).toBe('note_added')
    expect(task.events.at(-1)?.type).toBe('created')
  })

  it('rebuilds the status-change union from the nullable columns', () => {
    const task = toTask(
      row({
        task_events: [
          {
            id: 'e1',
            type: 'status_changed',
            from_status: 'not_started',
            to_status: 'in_progress',
            at: '2026-07-13T08:00:00.000Z',
          },
        ],
      }),
    )

    const event = task.events[0]
    expect(event.type).toBe('status_changed')
    if (event.type !== 'status_changed') throw new Error('expected a status change')
    expect(event.from).toBe('not_started')
    expect(event.to).toBe('in_progress')
  })

  it('leaves from/to off every other event type', () => {
    const task = toTask(
      row({
        task_events: [
          {
            id: 'e1',
            type: 'dates_changed',
            // Postgres stores these as null for non-status events.
            from_status: null,
            to_status: null,
            at: '2026-07-20T08:00:00.000Z',
          },
        ],
      }),
    )

    expect(task.events[0]).toEqual({
      id: 'e1',
      at: '2026-07-20T08:00:00.000Z',
      type: 'dates_changed',
    })
  })

  it('maps a share onto the invitee/linkToken names the UI uses', () => {
    const task = toTask(
      row({
        task_shares: [
          {
            id: 's1',
            invitee_email: 'assistant@example.com',
            permission: 'comment',
            invited_at: '2026-07-15T08:00:00.000Z',
            link_token: 'a91c74be20f5',
          },
        ],
      }),
    )

    expect(task.shares[0]).toEqual({
      id: 's1',
      invitee: 'assistant@example.com',
      permission: 'comment',
      invitedAt: '2026-07-15T08:00:00.000Z',
      linkToken: 'a91c74be20f5',
    })
  })

  it('produces a task the existing stall logic can read', () => {
    // The point of mapping into the same shape: everything already built on
    // top of Task keeps working against hosted data with no changes.
    const task = toTask(
      row({
        task_events: [
          {
            id: 'e1',
            type: 'note_added',
            from_status: null,
            to_status: null,
            at: '2026-07-22T08:00:00.000Z',
          },
        ],
      }),
    )

    const now = new Date('2026-08-02T08:00:00.000Z')
    expect(daysSinceMovement(task, now)).toBe(11)
    expect(isStalled(task, now)).toBe(true)
  })
})
