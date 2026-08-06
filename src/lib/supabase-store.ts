import type { SupabaseClient } from '@supabase/supabase-js'
import type { Permission, Task, TaskDraft, TaskEvent, TaskNote } from '../types'
import type { TaskStore } from './store'

/**
 * The hosted implementation of `TaskStore`, written against
 * `supabase/migrations/0001_initial_schema.sql`.
 *
 * NOT CONNECTED YET. Nothing imports this — it exists so the swap is a
 * one-line change in `store.ts` once the Supabase project exists, rather than
 * a piece of work nobody has looked at yet:
 *
 *     export const taskStore: TaskStore = new SupabaseTaskStore(client)
 *
 * Two things differ from `LocalTaskStore`, both deliberate:
 *
 * 1. Events are written by database triggers, not here. A log the client can
 *    bypass is not a log — and once anything else touches this database, only
 *    the database can guarantee the history is complete.
 * 2. Access is enforced by row-level security, not by this file. A helper with
 *    'view' gets no rows back from an update, whatever the UI lets them click.
 */

/** Row shapes as the schema defines them, before mapping to camelCase. */
export interface TaskRow {
  id: string
  title: string
  description: string
  end_state: string
  start_date: string
  end_date: string
  status: Task['status']
  created_at: string
  updated_at: string
  task_notes: NoteRow[] | null
  task_events: EventRow[] | null
  task_shares: ShareRow[] | null
}

export interface NoteRow {
  id: string
  body: string
  created_at: string
}

export interface EventRow {
  id: string
  type: TaskEvent['type']
  from_status: Task['status'] | null
  to_status: Task['status'] | null
  at: string
}

export interface ShareRow {
  id: string
  invitee_email: string
  permission: Permission
  invited_at: string
  link_token: string
}

/** One query shape, used everywhere, so a task never comes back half-loaded. */
const TASK_SELECT = `
  id, title, description, end_state, start_date, end_date, status,
  created_at, updated_at,
  task_notes ( id, body, created_at ),
  task_events ( id, type, from_status, to_status, at ),
  task_shares ( id, invitee_email, permission, invited_at, link_token )
`

function toNote(row: NoteRow): TaskNote {
  return { id: row.id, body: row.body, createdAt: row.created_at }
}

function toEvent(row: EventRow): TaskEvent {
  // The union carries from/to only on a status change; the table stores them
  // as nullable columns. This is the boundary where the two shapes meet.
  if (row.type === 'status_changed') {
    return {
      id: row.id,
      at: row.at,
      type: 'status_changed',
      from: row.from_status ?? 'not_started',
      to: row.to_status ?? 'not_started',
    }
  }
  return { id: row.id, at: row.at, type: row.type }
}

/** Exported for testing: this is where the table shape and the domain
 * shape meet, and getting it wrong would fail silently. */
export function toTask(row: TaskRow): Task {
  const byNewest = <T extends { created_at?: string; at?: string }>(a: T, b: T) =>
    new Date(b.at ?? b.created_at ?? 0).getTime() -
    new Date(a.at ?? a.created_at ?? 0).getTime()

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    endState: row.end_state,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: [...(row.task_notes ?? [])].sort(byNewest).map(toNote),
    events: [...(row.task_events ?? [])].sort(byNewest).map(toEvent),
    shares: (row.task_shares ?? []).map((share) => ({
      id: share.id,
      invitee: share.invitee_email,
      permission: share.permission,
      invitedAt: share.invited_at,
      linkToken: share.link_token,
    })),
  }
}

/** Turns a Postgres error into something a caller can act on. */
function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  if (result.data === null) throw new Error('No rows returned')
  return result.data
}

export class SupabaseTaskStore implements TaskStore {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /** Re-reads one task in full, so every mutation returns the same shape. */
  private async fetchOne(id: string): Promise<Task> {
    const result = await this.client
      .from('tasks')
      .select(TASK_SELECT)
      .eq('id', id)
      .single()
    return toTask(unwrap(result) as unknown as TaskRow)
  }

  async list(): Promise<Task[]> {
    // No owner filter: row-level security already limits this to tasks the
    // signed-in user owns or has been shared. Filtering here as well would
    // silently hide shared tasks.
    const result = await this.client
      .from('tasks')
      .select(TASK_SELECT)
      .order('end_date', { ascending: true })
    return (unwrap(result) as unknown as TaskRow[]).map(toTask)
  }

  async create(draft: TaskDraft): Promise<Task> {
    const { data: auth } = await this.client.auth.getUser()
    if (!auth.user) throw new Error('Not signed in')

    const result = await this.client
      .from('tasks')
      .insert({
        owner_id: auth.user.id,
        title: draft.title,
        description: draft.description,
        end_state: draft.endState,
        start_date: draft.startDate,
        end_date: draft.endDate,
        status: draft.status,
      })
      .select('id')
      .single()

    return this.fetchOne(unwrap(result).id)
  }

  async update(id: string, patch: Partial<TaskDraft>): Promise<Task> {
    const row: Record<string, unknown> = {}
    if (patch.title !== undefined) row.title = patch.title
    if (patch.description !== undefined) row.description = patch.description
    if (patch.endState !== undefined) row.end_state = patch.endState
    if (patch.startDate !== undefined) row.start_date = patch.startDate
    if (patch.endDate !== undefined) row.end_date = patch.endDate
    if (patch.status !== undefined) row.status = patch.status

    const result = await this.client.from('tasks').update(row).eq('id', id).select('id')
    // An empty array means the row exists but policy refused the write —
    // a 'view' helper clicking a control the UI should not have shown them.
    if (unwrap(result).length === 0) {
      throw new Error('You do not have permission to change this task')
    }
    return this.fetchOne(id)
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('tasks').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  /**
   * Re-inviting someone changes their level instead of failing on the unique
   * index — the same behaviour as the local store. Emails are lower-cased on
   * the way in so the index and the profile join agree on what "same person"
   * means.
   */
  async addShare(taskId: string, invitee: string, permission: Permission): Promise<Task> {
    const { error } = await this.client.from('task_shares').upsert(
      { task_id: taskId, invitee_email: invitee.trim().toLowerCase(), permission },
      { onConflict: 'task_id, invitee_email' },
    )
    if (error) throw new Error(error.message)
    return this.fetchOne(taskId)
  }

  async updateShare(
    taskId: string,
    shareId: string,
    permission: Permission,
  ): Promise<Task> {
    const { error } = await this.client
      .from('task_shares')
      .update({ permission })
      .eq('id', shareId)
    if (error) throw new Error(error.message)
    return this.fetchOne(taskId)
  }

  async removeShare(taskId: string, shareId: string): Promise<Task> {
    const { error } = await this.client.from('task_shares').delete().eq('id', shareId)
    if (error) throw new Error(error.message)
    return this.fetchOne(taskId)
  }

  async addNote(taskId: string, body: string): Promise<Task> {
    const { data: auth } = await this.client.auth.getUser()
    if (!auth.user) throw new Error('Not signed in')

    const { error } = await this.client
      .from('task_notes')
      .insert({ task_id: taskId, author_id: auth.user.id, body })
    if (error) throw new Error(error.message)
    // The note_added event is written by a trigger, so it is already there.
    return this.fetchOne(taskId)
  }

  async removeNote(taskId: string, noteId: string): Promise<Task> {
    const { error } = await this.client.from('task_notes').delete().eq('id', noteId)
    if (error) throw new Error(error.message)
    return this.fetchOne(taskId)
  }
}
