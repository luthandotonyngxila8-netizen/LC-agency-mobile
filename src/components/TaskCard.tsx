import { STATUS_LABELS, type Task } from '../types'
import { getHealth, HEALTH_LABELS } from '../lib/progress'
import { WeekProgress } from './WeekProgress'

interface Props {
  task: Task
  onOpen: (task: Task) => void
}

export function TaskCard({ task, onOpen }: Props) {
  const health = getHealth(task)

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
