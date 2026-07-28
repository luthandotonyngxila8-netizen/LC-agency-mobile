import { format, parseISO } from 'date-fns'
import type { Task } from '../types'
import {
  getDeadlineNote,
  getHealth,
  getProgressHeadline,
  getWeekProgress,
} from '../lib/progress'

interface Props {
  task: Task
  /** 'hero' is the big pop-up treatment; 'card' is the compact list version. */
  variant?: 'hero' | 'card'
}

/**
 * The "Week 1 of Week 4" component. Everything else on the dashboard is in
 * service of this: the week counter, the segmented weeks, and how much
 * runway is left.
 */
export function WeekProgress({ task, variant = 'card' }: Props) {
  const progress = getWeekProgress(task)
  const health = getHealth(task)
  const headline = getProgressHeadline(task)
  const note = getDeadlineNote(task)

  const { currentWeek, totalWeeks, percent } = progress
  const showSegments = totalWeeks <= 14

  return (
    <div className={`week-progress week-progress--${variant}`} data-health={health}>
      <div className="week-progress__headline">
        <span className="week-progress__counter">{headline}</span>
        <span className="week-progress__note">{note}</span>
      </div>

      {showSegments ? (
        <ol
          className="week-segments"
          aria-label={`Week ${currentWeek} of ${totalWeeks}`}
          style={{ '--week-count': totalWeeks } as React.CSSProperties}
        >
          {Array.from({ length: totalWeeks }, (_, index) => {
            const week = index + 1
            const state =
              week < currentWeek ? 'past' : week === currentWeek ? 'current' : 'future'
            return <li key={week} className="week-segment" data-state={state} />
          })}
        </ol>
      ) : (
        <div
          className="week-bar"
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="week-bar__fill" style={{ width: `${percent}%` }} />
        </div>
      )}

      {variant === 'hero' && (
        <div className="week-progress__dates">
          <span>
            <small>Started</small>
            {format(parseISO(task.startDate), 'd MMM yyyy')}
          </span>
          <span className="week-progress__elapsed">
            Day {progress.elapsedDays} of {progress.totalDays}
          </span>
          <span className="week-progress__due">
            <small>Due</small>
            {format(parseISO(task.endDate), 'd MMM yyyy')}
          </span>
        </div>
      )}
    </div>
  )
}
