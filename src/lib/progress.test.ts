import { describe, expect, it } from 'vitest'
import { parseISO } from 'date-fns'
import {
  getDeadlineNote,
  getHealth,
  getProgressHeadline,
  getWeekProgress,
  sortByUrgency,
} from './progress'
import type { Task, TaskStatus } from '../types'

const task = (
  startDate: string,
  endDate: string,
  status: TaskStatus = 'in_progress',
  id = 'task',
): Task => ({
  id,
  title: 'Task',
  description: '',
  endState: '',
  startDate,
  endDate,
  status,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  shares: [],
  notes: [],
})

const on = (date: string) => parseISO(date)

describe('getWeekProgress', () => {
  it('counts a 4-week task as 4 weeks, not 5', () => {
    // 1 Jun to 28 Jun inclusive is 28 days.
    const progress = getWeekProgress(task('2026-06-01', '2026-06-28'), on('2026-06-01'))
    expect(progress.totalDays).toBe(28)
    expect(progress.totalWeeks).toBe(4)
  })

  it('puts the first day of the task in week 1', () => {
    const progress = getWeekProgress(task('2026-06-01', '2026-06-28'), on('2026-06-01'))
    expect(progress.currentWeek).toBe(1)
    expect(progress.elapsedDays).toBe(1)
    expect(progress.phase).toBe('active')
  })

  it('rolls over to week 2 on day 8', () => {
    const range = task('2026-06-01', '2026-06-28')
    expect(getWeekProgress(range, on('2026-06-07')).currentWeek).toBe(1)
    expect(getWeekProgress(range, on('2026-06-08')).currentWeek).toBe(2)
  })

  it('holds at the final week on the last day', () => {
    const progress = getWeekProgress(task('2026-06-01', '2026-06-28'), on('2026-06-28'))
    expect(progress.currentWeek).toBe(4)
    expect(progress.percent).toBe(100)
    expect(progress.daysRemaining).toBe(0)
    expect(progress.phase).toBe('active')
  })

  it('does not run past the final week once the deadline has passed', () => {
    const progress = getWeekProgress(task('2026-06-01', '2026-06-28'), on('2026-07-20'))
    expect(progress.currentWeek).toBe(4)
    expect(progress.totalWeeks).toBe(4)
    expect(progress.percent).toBe(100)
    expect(progress.phase).toBe('ended')
    expect(progress.daysRemaining).toBeLessThan(0)
  })

  it('reports week 0 before the start date', () => {
    const progress = getWeekProgress(task('2026-06-01', '2026-06-28'), on('2026-05-25'))
    expect(progress.currentWeek).toBe(0)
    expect(progress.elapsedDays).toBe(0)
    expect(progress.percent).toBe(0)
    expect(progress.phase).toBe('upcoming')
    expect(progress.daysUntilStart).toBe(7)
  })

  it('rounds a partial final week up', () => {
    // 30 days spans 4 full weeks plus 2 days.
    const progress = getWeekProgress(task('2026-06-01', '2026-06-30'), on('2026-06-01'))
    expect(progress.totalDays).toBe(30)
    expect(progress.totalWeeks).toBe(5)
  })

  it('handles the brief’s longest case — 12 weeks', () => {
    const progress = getWeekProgress(task('2026-01-05', '2026-03-29'), on('2026-02-16'))
    expect(progress.totalWeeks).toBe(12)
    expect(progress.currentWeek).toBe(7)
  })

  it('treats a single-day task as one week', () => {
    const progress = getWeekProgress(task('2026-06-01', '2026-06-01'), on('2026-06-01'))
    expect(progress.totalDays).toBe(1)
    expect(progress.totalWeeks).toBe(1)
    expect(progress.currentWeek).toBe(1)
  })
})

describe('getProgressHeadline', () => {
  it('reads as "Week 1 of Week 4" in plain language', () => {
    expect(getProgressHeadline(task('2026-06-01', '2026-06-28'), on('2026-06-03'))).toBe(
      'Week 1 of 4',
    )
  })

  it('counts down to tasks that have not started', () => {
    expect(getProgressHeadline(task('2026-06-10', '2026-06-28'), on('2026-06-09'))).toBe(
      'Starts in 1 day',
    )
    expect(getProgressHeadline(task('2026-06-10', '2026-06-28'), on('2026-06-10'))).toBe(
      'Week 1 of 3',
    )
  })

  it('short-circuits once the task is done', () => {
    expect(
      getProgressHeadline(task('2026-06-01', '2026-06-28', 'done'), on('2026-06-03')),
    ).toBe('Delivered')
  })
})

describe('getDeadlineNote', () => {
  it('counts days left, then days over', () => {
    const range = task('2026-06-01', '2026-06-28')
    expect(getDeadlineNote(range, on('2026-06-27'))).toBe('1 day left')
    expect(getDeadlineNote(range, on('2026-06-28'))).toBe('Due today')
    expect(getDeadlineNote(range, on('2026-06-30'))).toBe('2 days past deadline')
  })
})

describe('getHealth', () => {
  it('flags the last week of a task as due soon', () => {
    expect(getHealth(task('2026-06-01', '2026-06-28'), on('2026-06-01'))).toBe('on_track')
    expect(getHealth(task('2026-06-01', '2026-06-28'), on('2026-06-25'))).toBe('due_soon')
  })

  it('flags a missed deadline, but not a finished task', () => {
    expect(getHealth(task('2026-06-01', '2026-06-28'), on('2026-07-01'))).toBe('overdue')
    expect(getHealth(task('2026-06-01', '2026-06-28', 'done'), on('2026-07-01'))).toBe(
      'done',
    )
  })
})

describe('sortByUrgency', () => {
  it('puts overdue first and done last', () => {
    const today = on('2026-06-15')
    const overdue = task('2026-05-01', '2026-06-01', 'in_progress', 'overdue')
    const dueSoon = task('2026-06-01', '2026-06-18', 'in_progress', 'due-soon')
    const onTrack = task('2026-06-01', '2026-08-01', 'in_progress', 'on-track')
    const finished = task('2026-05-01', '2026-06-01', 'done', 'done')

    expect(sortByUrgency([onTrack, finished, dueSoon, overdue], today).map((t) => t.id)).toEqual(
      ['overdue', 'due-soon', 'on-track', 'done'],
    )
  })
})
