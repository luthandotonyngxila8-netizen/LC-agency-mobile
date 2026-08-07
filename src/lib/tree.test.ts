import { describe, expect, it } from 'vitest'
import type { Task, TaskStatus } from '../types'
import {
  childrenOf,
  defaultChildDates,
  overrunsParent,
  rollUp,
  subProgress,
  topLevel,
  worstChildStatus,
} from './tree'

const task = (
  id: string,
  startDate: string,
  endDate: string,
  status: TaskStatus = 'in_progress',
  parentId: string | null = null,
): Task => ({
  id,
  parentId,
  title: id,
  description: '',
  endState: '',
  startDate,
  endDate,
  status,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  shares: [],
  notes: [],
  events: [],
})

const NOW = new Date('2026-03-10T09:00:00.000Z')

describe('topLevel', () => {
  it('returns projects and leaves their parts out', () => {
    const tasks = [
      task('project', '2026-03-01', '2026-04-30'),
      task('part-a', '2026-03-01', '2026-03-20', 'in_progress', 'project'),
      task('other', '2026-03-05', '2026-03-25'),
    ]

    expect(topLevel(tasks).map((t) => t.id)).toEqual(['project', 'other'])
  })
})

describe('childrenOf', () => {
  it('returns only the parts of the project asked for', () => {
    const tasks = [
      task('project', '2026-03-01', '2026-04-30'),
      task('mine', '2026-03-01', '2026-03-20', 'in_progress', 'project'),
      task('theirs', '2026-03-01', '2026-03-20', 'in_progress', 'other-project'),
    ]

    expect(childrenOf(tasks, 'project', NOW).map((t) => t.id)).toEqual(['mine'])
  })

  it('orders parts by urgency, so the most pressing reads first', () => {
    const tasks = [
      task('project', '2026-03-01', '2026-05-30'),
      task('on-track', '2026-03-01', '2026-05-20', 'in_progress', 'project'),
      task('overdue', '2026-03-01', '2026-03-05', 'in_progress', 'project'),
      task('due-soon', '2026-03-01', '2026-03-14', 'in_progress', 'project'),
    ]

    expect(childrenOf(tasks, 'project', NOW).map((t) => t.id)).toEqual([
      'overdue',
      'due-soon',
      'on-track',
    ])
  })
})

describe('overrunsParent', () => {
  const parent = task('project', '2026-03-01', '2026-04-30')

  it('flags a part dated past the project that holds it', () => {
    const child = task('part', '2026-03-01', '2026-05-15', 'in_progress', 'project')
    expect(overrunsParent(child, parent)).toBe(true)
  })

  it('does not flag a part that finishes inside the project', () => {
    const child = task('part', '2026-03-01', '2026-04-20', 'in_progress', 'project')
    expect(overrunsParent(child, parent)).toBe(false)
  })

  it('treats ending on the same day as the project as inside it', () => {
    const child = task('part', '2026-03-01', '2026-04-30', 'in_progress', 'project')
    expect(overrunsParent(child, parent)).toBe(false)
  })

  it('never flags a finished part, whatever its planned end date said', () => {
    // It's delivered. A date it overshot on paper is history, not a risk.
    const child = task('part', '2026-03-01', '2026-05-15', 'done', 'project')
    expect(overrunsParent(child, parent)).toBe(false)
  })
})

describe('subProgress', () => {
  const parent = task('project', '2026-03-01', '2026-04-30')

  it('counts what is done and what runs past the project', () => {
    const children = [
      task('a', '2026-03-01', '2026-03-20', 'done', 'project'),
      task('b', '2026-03-01', '2026-04-10', 'in_progress', 'project'),
      task('c', '2026-03-01', '2026-05-30', 'not_started', 'project'),
    ]

    expect(subProgress(children, parent)).toEqual({
      total: 3,
      done: 1,
      overrunning: 1,
    })
  })
})

describe('rollUp', () => {
  it('returns null for a project with nothing inside it', () => {
    // So the card renders nothing rather than "0 of 0 parts done".
    const tasks = [task('project', '2026-03-01', '2026-04-30')]
    expect(rollUp(tasks, tasks[0], NOW)).toBeNull()
  })

  it('carries the children through with the counts', () => {
    const parent = task('project', '2026-03-01', '2026-04-30')
    const tasks = [parent, task('a', '2026-03-01', '2026-03-20', 'done', 'project')]

    const result = rollUp(tasks, parent, NOW)
    expect(result?.total).toBe(1)
    expect(result?.done).toBe(1)
    expect(result?.children.map((t) => t.id)).toEqual(['a'])
  })
})

describe('worstChildStatus', () => {
  it('is done only when every part is done', () => {
    expect(
      worstChildStatus([
        task('a', '2026-03-01', '2026-03-20', 'done', 'p'),
        task('b', '2026-03-01', '2026-03-20', 'done', 'p'),
      ]),
    ).toBe('done')
  })

  it('is in progress if any single part is', () => {
    expect(
      worstChildStatus([
        task('a', '2026-03-01', '2026-03-20', 'done', 'p'),
        task('b', '2026-03-01', '2026-03-20', 'in_progress', 'p'),
      ]),
    ).toBe('in_progress')
  })

  it('is null when there are no parts at all', () => {
    expect(worstChildStatus([])).toBeNull()
  })
})

describe('defaultChildDates', () => {
  it('ends a new part when its project ends, so the default never overruns', () => {
    const parent = task('project', '2026-03-01', '2026-04-30')
    expect(defaultChildDates(parent, NOW).endDate).toBe('2026-04-30')
  })

  it('starts today when the project is already under way', () => {
    const parent = task('project', '2026-03-01', '2026-04-30')
    expect(defaultChildDates(parent, NOW).startDate).toBe('2026-03-10')
  })

  it('starts with the project when the project has not begun', () => {
    const parent = task('project', '2026-06-01', '2026-07-30', 'not_started')
    expect(defaultChildDates(parent, NOW).startDate).toBe('2026-06-01')
  })
})
