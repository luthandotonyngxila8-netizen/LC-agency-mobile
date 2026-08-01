import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocalTaskStore, resetDemoData } from './store'
import type { TaskDraft } from '../types'

/** Minimal `Storage` implementation so these tests don't need jsdom. */
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear() {
    this.store.clear()
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
}

/** Stands in for a full/blocked storage — every call throws, like Safari private mode. */
class ThrowingStorage implements Storage {
  length = 0
  clear(): never {
    throw new Error('blocked')
  }
  getItem(): never {
    throw new Error('blocked')
  }
  key(): never {
    throw new Error('blocked')
  }
  removeItem(): never {
    throw new Error('blocked')
  }
  setItem(): never {
    throw new Error('blocked')
  }
}

const draft: TaskDraft = {
  title: 'Draft a proposal',
  description: 'Scope and price the work.',
  endState: 'Proposal sent.',
  startDate: '2026-01-01',
  endDate: '2026-01-15',
  status: 'not_started',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LocalTaskStore with a working localStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('seeds the sample tasks on first read and persists them', async () => {
    const store = new LocalTaskStore()
    const first = await store.list()
    expect(first.length).toBeGreaterThan(0)

    const raw = localStorage.getItem('finini-dashboard/tasks/v1')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toHaveLength(first.length)
  })

  it('creates a task and makes it visible on the next list()', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    expect(created.id).toBeTruthy()
    expect(created.title).toBe(draft.title)
    expect(created.shares).toEqual([])

    const tasks = await store.list()
    expect(tasks.find((task) => task.id === created.id)).toEqual(created)
  })

  it('updates a task in place and bumps updatedAt', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    const updated = await store.update(created.id, { title: 'Send the proposal' })

    expect(updated.id).toBe(created.id)
    expect(updated.title).toBe('Send the proposal')
    expect(updated.createdAt).toBe(created.createdAt)
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updatedAt).getTime(),
    )
  })

  it('rejects updating a task that does not exist', async () => {
    const store = new LocalTaskStore()
    await expect(store.update('missing-id', { title: 'x' })).rejects.toThrow(
      'No task with id missing-id',
    )
  })

  it('removes a task', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    await store.remove(created.id)

    const tasks = await store.list()
    expect(tasks.find((task) => task.id === created.id)).toBeUndefined()
  })

  it('adds, updates and removes a share', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    const withShare = await store.addShare(created.id, 'helper@example.com', 'view')
    expect(withShare.shares).toHaveLength(1)
    const share = withShare.shares[0]
    expect(share.invitee).toBe('helper@example.com')
    expect(share.permission).toBe('view')

    const withUpdatedPermission = await store.updateShare(created.id, share.id, 'edit')
    expect(withUpdatedPermission.shares[0].permission).toBe('edit')

    const withoutShare = await store.removeShare(created.id, share.id)
    expect(withoutShare.shares).toHaveLength(0)
  })

  it('returns a fresh array reference on every list() call', async () => {
    const store = new LocalTaskStore()
    const a = await store.list()
    const b = await store.list()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('LocalTaskStore when localStorage is unavailable', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new ThrowingStorage())
  })

  it('still creates, updates and lists tasks via the in-memory fallback', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    const updated = await store.update(created.id, { status: 'in_progress' })
    expect(updated.status).toBe('in_progress')

    const tasks = await store.list()
    expect(tasks.find((task) => task.id === created.id)?.status).toBe('in_progress')
  })

  it('does not lose data across operations on the same store instance', async () => {
    const store = new LocalTaskStore()
    const first = await store.create(draft)
    const second = await store.create({ ...draft, title: 'Second task' })

    const tasks = await store.list()
    expect(tasks.find((task) => task.id === first.id)).toBeDefined()
    expect(tasks.find((task) => task.id === second.id)?.title).toBe('Second task')
  })
})

describe('resetDemoData', () => {
  it('clears the storage key', () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('localStorage', storage)
    storage.setItem('finini-dashboard/tasks/v1', '[]')

    resetDemoData()

    expect(storage.getItem('finini-dashboard/tasks/v1')).toBeNull()
  })

  it('does not throw when storage is unavailable', () => {
    vi.stubGlobal('localStorage', new ThrowingStorage())
    expect(() => resetDemoData()).not.toThrow()
  })
})
