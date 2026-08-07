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
  parentId: null,
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

  it('re-inviting someone changes their level instead of adding a second entry', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    await store.addShare(created.id, 'helper@example.com', 'view')
    const reinvited = await store.addShare(created.id, 'helper@example.com', 'edit')

    // Two rows for one person leaves it undecided which permission applies,
    // and the hosted schema rejects the duplicate outright.
    expect(reinvited.shares).toHaveLength(1)
    expect(reinvited.shares[0].permission).toBe('edit')
  })

  it('treats a differently-cased or padded address as the same person', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    await store.addShare(created.id, 'helper@example.com', 'view')
    const reinvited = await store.addShare(created.id, '  Helper@Example.com ', 'comment')

    expect(reinvited.shares).toHaveLength(1)
    expect(reinvited.shares[0].permission).toBe('comment')
    // The original spelling stands — re-inviting is not a rename.
    expect(reinvited.shares[0].invitee).toBe('helper@example.com')
  })

  it('trims the invitee on the way in', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    const shared = await store.addShare(created.id, '  assistant@example.com  ', 'view')
    expect(shared.shares[0].invitee).toBe('assistant@example.com')
  })

  it('creates a part inside a project', async () => {
    const store = new LocalTaskStore()
    const project = await store.create(draft)

    const part = await store.create({ ...draft, parentId: project.id, title: 'Part one' })

    expect(part.parentId).toBe(project.id)
  })

  it('refuses to nest a part inside a part', async () => {
    // One level, enforced. Deeper nesting would let part of the tree fall off
    // the dashboard entirely, since only projects are listed.
    const store = new LocalTaskStore()
    const project = await store.create(draft)
    const part = await store.create({ ...draft, parentId: project.id })

    await expect(store.create({ ...draft, parentId: part.id })).rejects.toThrow(
      'A sub-project cannot contain further sub-projects',
    )
  })

  it('refuses to attach a part to a project that does not exist', async () => {
    const store = new LocalTaskStore()
    await expect(store.create({ ...draft, parentId: 'missing-id' })).rejects.toThrow(
      'No task with id missing-id',
    )
  })

  it('deleting a project deletes its parts too', async () => {
    // Otherwise they survive pointing at a parent that is gone — invisible on
    // the dashboard, which only lists projects, but still taking up storage.
    const store = new LocalTaskStore()
    const project = await store.create(draft)
    await store.create({ ...draft, parentId: project.id, title: 'Part one' })
    await store.create({ ...draft, parentId: project.id, title: 'Part two' })

    await store.remove(project.id)

    const remaining = await store.list()
    expect(remaining.filter((task) => task.parentId === project.id)).toEqual([])
    expect(remaining.find((task) => task.id === project.id)).toBeUndefined()
  })

  it('deleting a part leaves its project and siblings alone', async () => {
    const store = new LocalTaskStore()
    const project = await store.create(draft)
    const first = await store.create({ ...draft, parentId: project.id, title: 'Part one' })
    await store.create({ ...draft, parentId: project.id, title: 'Part two' })

    await store.remove(first.id)

    const remaining = await store.list()
    expect(remaining.find((task) => task.id === project.id)).toBeDefined()
    expect(remaining.filter((task) => task.parentId === project.id)).toHaveLength(1)
  })

  it('returns a fresh array reference on every list() call', async () => {
    const store = new LocalTaskStore()
    const a = await store.list()
    const b = await store.list()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })

  it('adds a note and puts the newest first', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)
    expect(created.notes).toEqual([])

    await store.addNote(created.id, 'Chased the bank statements again.')
    const withTwo = await store.addNote(created.id, 'Statements arrived.')

    expect(withTwo.notes).toHaveLength(2)
    expect(withTwo.notes[0].body).toBe('Statements arrived.')
    expect(withTwo.notes[1].body).toBe('Chased the bank statements again.')
    expect(withTwo.notes[0].createdAt).toBeTruthy()
  })

  it('removes a note by id and leaves the others', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)
    await store.addNote(created.id, 'First')
    const withTwo = await store.addNote(created.id, 'Second')

    const remaining = await store.removeNote(created.id, withTwo.notes[0].id)

    expect(remaining.notes).toHaveLength(1)
    expect(remaining.notes[0].body).toBe('First')
  })

  it('persists notes across store instances', async () => {
    const created = await new LocalTaskStore().create(draft)
    await new LocalTaskStore().addNote(created.id, 'Survives a reload.')

    const tasks = await new LocalTaskStore().list()
    expect(tasks.find((task) => task.id === created.id)?.notes[0].body).toBe(
      'Survives a reload.',
    )
  })

  it('backfills notes on tasks saved before the field existed', async () => {
    // A task shaped like the previous release: no `notes` key at all. Without
    // the backfill this is what makes the UI throw on `task.notes.map(...)`.
    const legacy = {
      id: 'legacy-1',
      title: 'Saved by an older build',
      description: '',
      endState: '',
      startDate: '2026-01-01',
      endDate: '2026-01-15',
      status: 'in_progress',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      shares: [],
    }
    localStorage.setItem('finini-dashboard/tasks/v1', JSON.stringify([legacy]))

    const tasks = await new LocalTaskStore().list()

    expect(tasks[0].notes).toEqual([])
    expect(tasks[0].title).toBe('Saved by an older build')
    // Everything saved before sub-projects existed is a top-level project.
    expect(tasks[0].parentId).toBeNull()
  })

  it('opens a new task with a created event', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    expect(created.events).toHaveLength(1)
    expect(created.events[0].type).toBe('created')
  })

  it('records a status change with what it moved between', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    const updated = await store.update(created.id, { status: 'in_progress' })

    const event = updated.events[0]
    expect(event.type).toBe('status_changed')
    if (event.type !== 'status_changed') throw new Error('expected a status change')
    expect(event.from).toBe('not_started')
    expect(event.to).toBe('in_progress')
  })

  it('records nothing when the status is set to what it already was', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    const updated = await store.update(created.id, { status: created.status })

    expect(updated.events).toHaveLength(1)
    expect(updated.events[0].type).toBe('created')
  })

  it('records a date change when a deadline moves', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    const updated = await store.update(created.id, { endDate: '2026-02-01' })

    expect(updated.events[0].type).toBe('dates_changed')
  })

  it('treats renaming and re-describing as housekeeping, not movement', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    const updated = await store.update(created.id, {
      title: 'A clearer title',
      description: 'Reworded.',
      endState: 'Tightened.',
    })

    expect(updated.events).toHaveLength(1)
    expect(updated.events[0].type).toBe('created')
  })

  it('records both events when a status and a date change together', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    const updated = await store.update(created.id, {
      status: 'done',
      endDate: '2026-03-01',
    })

    const types = updated.events.map((event) => event.type)
    expect(types).toEqual(['status_changed', 'dates_changed', 'created'])
  })

  it('counts a note as movement but not deleting one', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)

    const withNote = await store.addNote(created.id, 'Chased the accountant.')
    expect(withNote.events[0].type).toBe('note_added')

    const afterDelete = await store.removeNote(created.id, withNote.notes[0].id)
    expect(afterDelete.events[0].type).toBe('note_added')
    expect(afterDelete.events).toHaveLength(withNote.events.length)
  })

  it('keeps events newest first', async () => {
    const store = new LocalTaskStore()
    const created = await store.create(draft)
    await store.update(created.id, { status: 'in_progress' })
    const latest = await store.addNote(created.id, 'Latest thing that happened.')

    const times = latest.events.map((event) => new Date(event.at).getTime())
    const sorted = [...times].sort((a, b) => b - a)
    expect(times).toEqual(sorted)
    expect(latest.events[0].type).toBe('note_added')
    expect(latest.events.at(-1)?.type).toBe('created')
  })

  it('backfills events on tasks saved before the field existed', async () => {
    const legacy = {
      id: 'legacy-3',
      title: 'Older build',
      description: '',
      endState: '',
      startDate: '2026-01-01',
      endDate: '2026-01-15',
      status: 'in_progress',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      shares: [],
      notes: [],
    }
    localStorage.setItem('finini-dashboard/tasks/v1', JSON.stringify([legacy]))

    const store = new LocalTaskStore()
    expect((await store.list())[0].events).toEqual([])

    const updated = await store.update('legacy-3', { status: 'done' })
    expect(updated.events[0].type).toBe('status_changed')
  })

  it('can add a note to a task saved before the field existed', async () => {
    const legacy = {
      id: 'legacy-2',
      title: 'Older build',
      description: '',
      endState: '',
      startDate: '2026-01-01',
      endDate: '2026-01-15',
      status: 'not_started',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      shares: [],
    }
    localStorage.setItem('finini-dashboard/tasks/v1', JSON.stringify([legacy]))

    const updated = await new LocalTaskStore().addNote('legacy-2', 'Works fine.')

    expect(updated.notes).toHaveLength(1)
    expect(updated.notes[0].body).toBe('Works fine.')
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
