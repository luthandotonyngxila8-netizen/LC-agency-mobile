import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Task } from '../types'

export type Phase = 'upcoming' | 'active' | 'ended'

/** Health is what colours the UI: it folds the deadline together with status. */
export type Health = 'not_started' | 'on_track' | 'due_soon' | 'overdue' | 'done'

export interface WeekProgress {
  /** Total weeks the task spans, always at least 1. */
  totalWeeks: number
  /** Which week the task is in right now, 1-based. 0 before the start date. */
  currentWeek: number
  totalDays: number
  /** Days elapsed inclusive of today, clamped to [0, totalDays]. */
  elapsedDays: number
  /** 0-100, clamped. */
  percent: number
  /** Calendar days until the end date. Negative once the date has passed. */
  daysRemaining: number
  /** Calendar days until the start date. Only meaningful while upcoming. */
  daysUntilStart: number
  phase: Phase
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/**
 * The core of the dashboard: turns a start/end date pair into "Week 1 of 4".
 *
 * Both dates are inclusive, so a Monday-to-Sunday task is 7 days / 1 week, and
 * the day the task starts is already week 1 rather than week 0.
 */
export function getWeekProgress(
  task: Pick<Task, 'startDate' | 'endDate'>,
  today: Date = new Date(),
): WeekProgress {
  const start = parseISO(task.startDate)
  const end = parseISO(task.endDate)

  const totalDays = Math.max(1, differenceInCalendarDays(end, start) + 1)
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7))

  const daysSinceStart = differenceInCalendarDays(today, start) + 1
  const elapsedDays = clamp(daysSinceStart, 0, totalDays)
  const daysRemaining = differenceInCalendarDays(end, today)
  const daysUntilStart = differenceInCalendarDays(start, today)

  const phase: Phase =
    daysSinceStart <= 0 ? 'upcoming' : daysRemaining < 0 ? 'ended' : 'active'

  const currentWeek =
    phase === 'upcoming' ? 0 : clamp(Math.ceil(elapsedDays / 7), 1, totalWeeks)

  return {
    totalWeeks,
    currentWeek,
    totalDays,
    elapsedDays,
    percent: clamp((elapsedDays / totalDays) * 100, 0, 100),
    daysRemaining,
    daysUntilStart,
    phase,
  }
}

export function getHealth(task: Task, today: Date = new Date()): Health {
  if (task.status === 'done') return 'done'

  const { phase, daysRemaining } = getWeekProgress(task, today)
  if (phase === 'ended') return 'overdue'
  if (task.status === 'not_started' && phase === 'upcoming') return 'not_started'
  if (daysRemaining <= 7) return 'due_soon'
  return 'on_track'
}

export const HEALTH_LABELS: Record<Health, string> = {
  not_started: 'Not started yet',
  on_track: 'On track',
  due_soon: 'Due soon',
  overdue: 'Past deadline',
  done: 'Done',
}

/** The one-line answer to "where am I right now" on this task. */
export function getProgressHeadline(task: Task, today: Date = new Date()): string {
  const progress = getWeekProgress(task, today)

  if (task.status === 'done') return 'Delivered'
  if (progress.phase === 'upcoming') {
    const days = progress.daysUntilStart
    return days === 0 ? 'Starts today' : `Starts in ${days} ${plural(days, 'day')}`
  }
  return `Week ${progress.currentWeek} of ${progress.totalWeeks}`
}

/** The supporting line: how much runway is actually left. */
export function getDeadlineNote(task: Task, today: Date = new Date()): string {
  const { daysRemaining, phase } = getWeekProgress(task, today)

  if (task.status === 'done') return 'Marked done'
  if (phase === 'upcoming') return 'Not started'
  if (daysRemaining < 0) {
    const over = Math.abs(daysRemaining)
    return `${over} ${plural(over, 'day')} past deadline`
  }
  if (daysRemaining === 0) return 'Due today'
  return `${daysRemaining} ${plural(daysRemaining, 'day')} left`
}

export function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`
}

const HEALTH_ORDER: Record<Health, number> = {
  overdue: 0,
  due_soon: 1,
  on_track: 2,
  not_started: 3,
  done: 4,
}

/** Most pressing first, so the top of the dashboard is always the thing to look at. */
export function sortByUrgency(tasks: Task[], today: Date = new Date()): Task[] {
  return [...tasks].sort((a, b) => {
    const rank = HEALTH_ORDER[getHealth(a, today)] - HEALTH_ORDER[getHealth(b, today)]
    if (rank !== 0) return rank
    return (
      getWeekProgress(a, today).daysRemaining - getWeekProgress(b, today).daysRemaining
    )
  })
}
