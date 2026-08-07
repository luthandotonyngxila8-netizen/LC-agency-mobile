import { parseISO } from 'date-fns'
import type { Task } from '../types'
import {
  daysSinceMovement,
  getHealth,
  getWeekProgress,
  sortByUrgency,
  STALL_THRESHOLD_DAYS,
} from './progress'

/**
 * Projects and the sub-projects inside them.
 *
 * The list is stored flat and the shape is worked out here, so nothing has to
 * be kept in sync — a sub-project is just a task carrying its parent's id.
 *
 * The deliberate decision, and the one worth defending: **a parent keeps its
 * own dates.** They are not derived from its children. Two reasons. A project
 * has a deadline before anyone has broken it down, so derived dates would
 * leave a new project with no timeline at all. And when a sub-project runs
 * past its parent's end date, that disagreement is the single most useful
 * thing on the screen — it is the "this says green but it is already in
 * trouble" case the client raised, made visible. Derived dates would silently
 * absorb the overrun and report health right up to the deadline.
 */

/** Projects only — what the dashboard lists. */
export function topLevel(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.parentId === null)
}

/** The sub-projects of one project, most pressing first. */
export function childrenOf(tasks: Task[], parentId: string, today: Date = new Date()): Task[] {
  return sortByUrgency(
    tasks.filter((task) => task.parentId === parentId),
    today,
  )
}

export interface SubProgress {
  total: number
  done: number
  /** Parts whose end date falls after their parent's — a planning problem. */
  overrunning: number
  /** Parts whose own deadline has already passed — late right now. */
  overdue: number
}

export function subProgress(
  children: Task[],
  parent: Task,
  today: Date = new Date(),
): SubProgress {
  return {
    total: children.length,
    done: children.filter((child) => child.status === 'done').length,
    overrunning: children.filter((child) => overrunsParent(child, parent)).length,
    overdue: overduePartCount(children, today),
  }
}

/**
 * Whether a sub-project's deadline falls outside the project that contains it.
 *
 * A finished sub-project can't overrun anything — it is already delivered,
 * whatever its planned end date said.
 */
export function overrunsParent(child: Task, parent: Task): boolean {
  if (child.status === 'done') return false
  return parseISO(child.endDate) > parseISO(parent.endDate)
}

/**
 * The roll-up a project shows when it has sub-projects: how far through them
 * it is, and whether any of them are dated past the project itself.
 *
 * Returns null for a project with nothing inside it, so callers render nothing
 * rather than "0 of 0".
 */
export function rollUp(tasks: Task[], parent: Task, today: Date = new Date()) {
  const children = childrenOf(tasks, parent.id, today)
  if (children.length === 0) return null
  return { children, ...subProgress(children, parent, today) }
}

/**
 * Days since anything happened on a project *or* on any of its parts.
 *
 * A project's own record barely changes once it has been broken down — the
 * work moves in its parts. Reading only the project's own events therefore
 * reports a busy project as silent within a week, which is the opposite of
 * what the stall warning is for and would train the client to ignore it.
 */
export function daysSinceProjectMovement(
  tasks: Task[],
  project: Task,
  today: Date = new Date(),
): number {
  const parts = tasks.filter((task) => task.parentId === project.id)
  return Math.min(...[project, ...parts].map((task) => daysSinceMovement(task, today)))
}

/** The stall test a project should be judged by: itself and everything inside it. */
export function isProjectStalled(
  tasks: Task[],
  project: Task,
  today: Date = new Date(),
): boolean {
  if (project.status === 'done') return false
  if (getWeekProgress(project, today).phase === 'upcoming') return false
  return daysSinceProjectMovement(tasks, project, today) >= STALL_THRESHOLD_DAYS
}

/**
 * Parts whose own deadline has already passed.
 *
 * Distinct from `overrunsParent`, and more urgent: that one is a part
 * *scheduled* beyond its project, a planning problem for later. This is a part
 * that is late right now. A project can sit comfortably inside its own dates
 * while a part of it is weeks overdue, and nothing else on the dashboard would
 * say so — the project's colour tracks the project's dates.
 */
export function overduePartCount(children: Task[], today: Date = new Date()): number {
  return children.filter((child) => getHealth(child, today) === 'overdue').length
}


/**
 * Sensible dates for a new sub-project: starting today if the project is
 * already under way, otherwise with it, and ending when the project does.
 *
 * The point is that the default never overruns its parent — if the user wants
 * that, they have to choose it, and then they get told.
 */
export function defaultChildDates(
  parent: Task,
  today: Date = new Date(),
): { startDate: string; endDate: string } {
  const started = getWeekProgress(parent, today).phase !== 'upcoming'
  return {
    startDate: started ? toIsoDate(today) : parent.startDate,
    endDate: parent.endDate,
  }
}

function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}
