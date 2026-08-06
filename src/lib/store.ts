import type { Permission, Task, TaskDraft, TaskEvent } from '../types'
import { seedTasks } from './seed'

/**
 * The only contract the UI knows about.
 *
 * Every method is async so this demo's localStorage implementation can be
 * swapped for a hosted backend (Supabase, Firebase, or an existing task API)
 * without touching a single component. See README "Swapping the backend".
 */
export interface TaskStore {
  list(): Promise<Task[]>
  create(draft: TaskDraft): Promise<Task>
  update(id: string, patch: Partial<TaskDraft>): Promise<Task>
  remove(id: string): Promise<void>
  addShare(taskId: string, invitee: string, permission: Permission): Promise<Task>
  updateShare(taskId: string, shareId: string, permission: Permission): Promise<Task>
  removeShare(taskId: string, shareId: string): Promise<Task>
  addNote(taskId: string, body: string): Promise<Task>
  removeNote(taskId: string, noteId: string): Promise<Task>
}

const STORAGE_KEY = 'finini-dashboard/tasks/v1'

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Tasks stored by an earlier build have no `notes` array, so reading them back
 * would hand the UI an undefined and throw on the first `.map()`. Filling the
 * collections in on read keeps otherwise-valid saved data working across the
 * upgrade, rather than making the user reset their demo.
 */
function normalize(tasks: Task[]): Task[] {
  return tasks.map((task) => ({
    ...task,
    shares: task.shares ?? [],
    notes: task.notes ?? [],
    events: task.events ?? [],
  }))
}

export class LocalTaskStore implements TaskStore {
  /**
   * Holds the tasks when localStorage is unavailable — private browsing, a
   * sandboxed iframe, or a full quota. Without it, writes would fail silently
   * and every edit would vanish on the next read.
   */
  private fallback: Task[] | null = null

  private read(): Task[] {
    // A fresh array each read: callers put this straight into React state, and
    // returning the same reference would make React skip the re-render.
    if (this.fallback) return [...this.fallback]
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return normalize(JSON.parse(raw) as Task[])
    } catch {
      // Corrupt or unreadable storage falls through to the seed below.
    }
    const seeded = seedTasks()
    this.write(seeded)
    return seeded
  }

  private write(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
      this.fallback = null
    } catch {
      this.fallback = tasks
    }
  }

  private mutate(id: string, fn: (task: Task) => Task): Task {
    const tasks = this.read()
    const index = tasks.findIndex((task) => task.id === id)
    if (index === -1) throw new Error(`No task with id ${id}`)

    const updated = { ...fn(tasks[index]), updatedAt: new Date().toISOString() }
    tasks[index] = updated
    this.write(tasks)
    return updated
  }

  async list(): Promise<Task[]> {
    return this.read()
  }

  async create(draft: TaskDraft): Promise<Task> {
    const now = new Date().toISOString()
    const task: Task = {
      ...draft,
      id: newId(),
      createdAt: now,
      updatedAt: now,
      shares: [],
      notes: [],
      events: [{ id: newId(), at: now, type: 'created' }],
    }
    this.write([...this.read(), task])
    return task
  }

  /**
   * Records an event for the kinds of change that count as the task moving:
   * a status transition, or a shift in its dates. Renaming a task or fixing a
   * typo in its description is housekeeping, not progress, and logging it
   * would make a stalled task look active.
   */
  async update(id: string, patch: Partial<TaskDraft>): Promise<Task> {
    return this.mutate(id, (task) => {
      const at = new Date().toISOString()
      const events: TaskEvent[] = []

      if (patch.status !== undefined && patch.status !== task.status) {
        events.push({
          id: newId(),
          at,
          type: 'status_changed',
          from: task.status,
          to: patch.status,
        })
      }

      const datesMoved =
        (patch.startDate !== undefined && patch.startDate !== task.startDate) ||
        (patch.endDate !== undefined && patch.endDate !== task.endDate)
      if (datesMoved) {
        events.push({ id: newId(), at, type: 'dates_changed' })
      }

      return { ...task, ...patch, events: [...events, ...task.events] }
    })
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((task) => task.id !== id))
  }

  /**
   * Inviting someone who already has access changes their level rather than
   * adding a second entry. Two rows for one person leaves it ambiguous which
   * permission applies, and the hosted schema rejects the duplicate outright
   * — `unique (task_id, lower(invitee_email))` on `task_shares`.
   */
  async addShare(taskId: string, invitee: string, permission: Permission): Promise<Task> {
    const trimmed = invitee.trim()
    const key = trimmed.toLowerCase()

    return this.mutate(taskId, (task) => {
      const existing = task.shares.find((share) => share.invitee.trim().toLowerCase() === key)
      if (existing) {
        return {
          ...task,
          shares: task.shares.map((share) =>
            share.id === existing.id ? { ...share, permission } : share,
          ),
        }
      }

      return {
        ...task,
        shares: [
          ...task.shares,
          {
            id: newId(),
            invitee: trimmed,
            permission,
            invitedAt: new Date().toISOString(),
            linkToken: newId().replace(/-/g, '').slice(0, 12),
          },
        ],
      }
    })
  }

  async updateShare(taskId: string, shareId: string, permission: Permission): Promise<Task> {
    return this.mutate(taskId, (task) => ({
      ...task,
      shares: task.shares.map((share) =>
        share.id === shareId ? { ...share, permission } : share,
      ),
    }))
  }

  async removeShare(taskId: string, shareId: string): Promise<Task> {
    return this.mutate(taskId, (task) => ({
      ...task,
      shares: task.shares.filter((share) => share.id !== shareId),
    }))
  }

  async addNote(taskId: string, body: string): Promise<Task> {
    // Newest first: the point of a note is catching up on what just happened.
    return this.mutate(taskId, (task) => {
      const at = new Date().toISOString()
      return {
        ...task,
        notes: [{ id: newId(), body, createdAt: at }, ...task.notes],
        // Writing a note is the user engaging with the task, so it counts as
        // movement even when the status hasn't shifted.
        events: [{ id: newId(), at, type: 'note_added' }, ...task.events],
      }
    })
  }

  /** Deleting a note is a correction, so it records no event. */
  async removeNote(taskId: string, noteId: string): Promise<Task> {
    return this.mutate(taskId, (task) => ({
      ...task,
      notes: task.notes.filter((note) => note.id !== noteId),
    }))
  }
}

/**
 * Wipes local state so the demo can be reset between walkthroughs. Callers
 * reload afterwards, which also clears the in-memory fallback above.
 */
export function resetDemoData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing stored to clear; the reload handles it.
  }
}

export const taskStore: TaskStore = new LocalTaskStore()
