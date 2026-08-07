import { STATUS_LABELS, type Task } from '../types'
import {
  daysSinceMovement,
  getHealth,
  HEALTH_LABELS,
  isStalled,
  plural,
} from '../lib/progress'
import { daysSinceProjectMovement, isProjectStalled, rollUp } from '../lib/tree'
import { WeekProgress } from './WeekProgress'

interface Props {
  task: Task
  /** Every task, so a project can count what's inside it. */
  tasks: Task[]
  onOpen: (task: Task) => void
}

export function TaskCard({ task, tasks, onOpen }: Props) {
  const health = getHealth(task)
  const sub = rollUp(tasks, task)

  // A project with parts is judged on its parts' activity too. Work on a
  // project happens inside them, so its own record goes quiet immediately and
  // would otherwise report a busy project as stalled within the week.
  const isProject = task.parentId === null
  const stalled = isProject ? isProjectStalled(tasks, task) : isStalled(task)
  const quietDays = isProject
    ? daysSinceProjectMovement(tasks, task)
    : daysSinceMovement(task)

  return (
    <article className="task-card" data-health={health}>
      <button type="button" className="task-card__hit" onClick={() => onOpen(task)}>
        <header className="task-card__header">
          <h3>{task.title}</h3>
          <span className="pill" data-health={health}>
            {HEALTH_LABELS[health]}
          </span>
        </header>

        <WeekProgress task={task} />

        <p className="task-card__description">{task.description}</p>

        <footer className="task-card__footer">
          <span className="tag" data-status={task.status}>
            {STATUS_LABELS[task.status]}
          </span>
          {sub && (
            <span className="tag tag--sub">
              {sub.done} of {sub.total} {sub.total === 1 ? 'part' : 'parts'} done
            </span>
          )}
          {/*
            A part can be weeks late while the project sits comfortably inside
            its own dates — the health pill tracks the project's deadline and
            would say nothing. Late-right-now outranks scheduled-to-overrun, so
            only the more urgent of the two shows rather than stacking both.
          */}
          {sub && sub.overdue > 0 ? (
            <span className="tag tag--overrun">
              {sub.overdue} {plural(sub.overdue, 'part')} overdue
            </span>
          ) : (
            sub &&
            sub.overrunning > 0 && (
              <span className="tag tag--overrun">
                {sub.overrunning} {plural(sub.overrunning, 'part')} past this deadline
              </span>
            )
          )}
          {stalled && (
            <span className="tag tag--stalled">
              No movement in {quietDays} {plural(quietDays, 'day')}
            </span>
          )}
          {task.shares.length > 0 && (
            <span className="tag tag--muted">
              Shared with {task.shares.length}
            </span>
          )}
        </footer>
      </button>
    </article>
  )
}
