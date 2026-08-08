import type { Permission, Task, TaskDraft, TaskEvent } from '../types'
import { SEED_VERSION, seedTasks } from './seed'

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
const SEED_VERSION_KEY = 'finini-dashboard/seed-version'

/** Absent means data saved before the stamp existed — treat it as version 1. */
function readSeedVersion(): number {
  try {
    return Number(localStorage.getItem(SEED_VERSION_KEY) ?? 1)
  } catch {
    return SEED_VERSION
  }
}

/**
 * Whether the saved tasks are still just the samples, untouched.
 *
 * Only then is it safe to replace them with a newer set. A task the user
 * created has a generated id, and a note is the clearest sign someone actually
 * tried the thing rather than clicking around — either means their data is
 * theirs, and it gets an offer to update rather than a silent overwrite.
 */
function isUntouchedSeed(tasks: Task[]): boolean {
  return tasks.every(
    (task) =>
      task.id.startsWith('seed-') &&
      task.notes.every((note) => note.id.startsWith('seed-')),
  )
}

/**
 * True when the browser is holding samples from an older build that can't be
 * replaced automatically because the user has added something of their own.
 * The UI offers them the update rather than taking it.
 */
export function demoDataIsStale(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    return readSeedVersion() < SEED_VERSION && !isUntouchedSeed(normalize(JSON.parse(raw)))
  } catch {
    return false
  }
}

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
    parentId: task.parentId ?? null,
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
      if (raw) {
        const stored = normalize(JSON.parse(raw) as Task[])
        // Samples from an older build, never touched: replace them. Otherwise
        // the same link keeps showing whatever was current the first time it
        // was opened, and nothing on screen says so.
        if (readSeedVersion() < SEED_VERSION && isUntouchedSeed(stored)) {
          const refreshed = seedTasks()
          this.write(refreshed)
          return refreshed
        }
        return stored
      }
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
      localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
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
    const tasks = this.read()

    if (draft.parentId !== null) {
      const parent = tasks.find((task) => task.id === draft.parentId)
      if (!parent) throw new Error(`No task with id ${draft.parentId}`)
      // One level, enforced rather than assumed. Without this a sub-project
      // could take sub-projects of its own and the dashboard would quietly
      // stop showing part of the tree.
      if (parent.parentId !== null) {
        throw new Error('A sub-project cannot contain further sub-projects')
      }
    }

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
    this.write([...tasks, task])
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

  /**
   * Deleting a project takes its sub-projects with it — the same cascade the
   * hosted schema does with `on delete cascade`. Leaving them behind would
   * strand tasks pointing at a parent that no longer exists, and they would
   * vanish from the dashboard without being deleted.
   *
   * The caller is responsible for saying how many are about to go.
   */
  async remove(id: string): Promise<void> {
    this.write(this.read().filter((task) => task.id !== id && task.parentId !== id))
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
    // Clear the stamp too, so the next read seeds cleanly rather than
    // comparing against a version whose data no longer exists.
    localStorage.removeItem(SEED_VERSION_KEY)
  } catch {
    // Nothing stored to clear; the reload handles it.
  }
}

export const taskStore: TaskStore = new LocalTaskStore()
