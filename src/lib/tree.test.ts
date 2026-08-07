import { describe, expect, it } from 'vitest'
import type { Task, TaskStatus } from '../types'
import {
  childrenOf,
  defaultChildDates,
  daysSinceProjectMovement,
  isProjectStalled,
  overduePartCount,
  overrunsParent,
  rollUp,
  subProgress,
  topLevel,
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

    expect(subProgress(children, parent, NOW)).toEqual({
      total: 3,
      done: 1,
      overrunning: 1,
      overdue: 0,
    })
  })
})

describe('overduePartCount', () => {
  it('counts parts whose own deadline has already passed', () => {
    const children = [
      task('late', '2026-02-01', '2026-03-01', 'in_progress', 'p'),
      task('fine', '2026-03-01', '2026-04-30', 'in_progress', 'p'),
    ]
    expect(overduePartCount(children, NOW)).toBe(1)
  })

  it('does not count a part that was finished', () => {
    const children = [task('late-but-done', '2026-02-01', '2026-03-01', 'done', 'p')]
    expect(overduePartCount(children, NOW)).toBe(0)
  })

  it('is separate from overrunning — a part can be late without overrunning', () => {
    // The project runs to April. This part was due in March and is late. It
    // does not overrun the project, yet nothing else on the dashboard would
    // say a word about it.
    const parent = task('project', '2026-01-01', '2026-04-30')
    const children = [task('late', '2026-02-01', '2026-03-01', 'in_progress', 'project')]

    const counts = subProgress(children, parent, NOW)
    expect(counts.overrunning).toBe(0)
    expect(counts.overdue).toBe(1)
  })
})

describe('daysSinceProjectMovement', () => {
  const withEvent = (t: Task, at: string): Task => ({
    ...t,
    events: [{ id: `${t.id}-ev`, at, type: 'note_added' }],
  })

  it('counts work in a part as movement on the project holding it', () => {
    // Otherwise breaking a project down makes it look abandoned within a week:
    // the project's own record stops changing the moment the work moves into
    // its parts.
    const project = withEvent(
      task('project', '2026-01-01', '2026-05-30'),
      '2026-02-01T09:00:00.000Z',
    )
    const part = withEvent(
      task('part', '2026-01-01', '2026-05-01', 'in_progress', 'project'),
      '2026-03-09T09:00:00.000Z',
    )

    expect(daysSinceProjectMovement([project, part], project, NOW)).toBe(1)
    expect(isProjectStalled([project, part], project, NOW)).toBe(false)
  })

  it('stalls only when the project and every part have gone quiet', () => {
    const project = withEvent(
      task('project', '2026-01-01', '2026-05-30'),
      '2026-02-01T09:00:00.000Z',
    )
    const part = withEvent(
      task('part', '2026-01-01', '2026-05-01', 'in_progress', 'project'),
      '2026-02-02T09:00:00.000Z',
    )

    expect(isProjectStalled([project, part], project, NOW)).toBe(true)
  })

  it('falls back to the project alone when it has no parts', () => {
    const project = withEvent(
      task('project', '2026-01-01', '2026-05-30'),
      '2026-03-08T09:00:00.000Z',
    )
    expect(daysSinceProjectMovement([project], project, NOW)).toBe(2)
  })

  it('never stalls a finished project', () => {
    const project = withEvent(
      task('project', '2026-01-01', '2026-05-30', 'done'),
      '2026-01-02T09:00:00.000Z',
    )
    expect(isProjectStalled([project], project, NOW)).toBe(false)
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
