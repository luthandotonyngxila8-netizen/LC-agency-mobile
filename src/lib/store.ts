import type { Permission, Task, TaskDraft } from '../types'
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
}

const STORAGE_KEY = 'finini-dashboard/tasks/v1'

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 10)}`
}

export class LocalTaskStore implements TaskStore {
  private read(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as Task[]
    } catch {
      // Corrupt or unavailable storage falls through to the seed below.
    }
    const seeded = seedTasks()
    this.write(seeded)
    return seeded
  }

  private write(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      // Private-browsing quota errors shouldn't break the demo.
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
    }
    this.write([...this.read(), task])
    return task
  }

  async update(id: string, patch: Partial<TaskDraft>): Promise<Task> {
    return this.mutate(id, (task) => ({ ...task, ...patch }))
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((task) => task.id !== id))
  }

  async addShare(taskId: string, invitee: string, permission: Permission): Promise<Task> {
    return this.mutate(taskId, (task) => ({
      ...task,
      shares: [
        ...task.shares,
        {
          id: newId(),
          invitee,
          permission,
          invitedAt: new Date().toISOString(),
          linkToken: newId().replace(/-/g, '').slice(0, 12),
        },
      ],
    }))
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
}

/** Wipes local state so the demo can be reset between walkthroughs. */
export function resetDemoData(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export const taskStore: TaskStore = new LocalTaskStore()
