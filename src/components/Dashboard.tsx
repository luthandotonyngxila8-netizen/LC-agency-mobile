import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { Task } from '../types'
import { getHealth, sortByUrgency } from '../lib/progress'
import { TaskCard } from './TaskCard'
import { WeekProgress } from './WeekProgress'

interface Props {
  tasks: Task[]
  onOpen: (task: Task) => void
  onNew: () => void
}

type Filter = 'active' | 'all' | 'done'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All' },
  { id: 'done', label: 'Done' },
]

export function Dashboard({ tasks, onOpen, onNew }: Props) {
  const [filter, setFilter] = useState<Filter>('active')

  const ordered = useMemo(() => sortByUrgency(tasks), [tasks])

  // The single most pressing task gets the full-width timeline treatment —
  // this is the "where am I right now" view the client opens the app for.
  const focus = ordered.find((task) => task.status !== 'done')

  const counts = useMemo(() => {
    const byHealth = ordered.map((task) => getHealth(task))
    return {
      overdue: byHealth.filter((health) => health === 'overdue').length,
      dueSoon: byHealth.filter((health) => health === 'due_soon').length,
      running: ordered.filter((task) => task.status === 'in_progress').length,
    }
  }, [ordered])

  const visible = ordered.filter((task) => {
    if (filter === 'all') return true
    if (filter === 'done') return task.status === 'done'
    return task.status !== 'done'
  })

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__date">{format(new Date(), 'EEEE d MMMM')}</p>
          <h1>Where you are right now</h1>
        </div>
        <button type="button" className="button" onClick={onNew}>
          + New task
        </button>
      </header>

      <section className="summary" aria-label="Summary">
        <div className="summary__stat">
          <strong>{counts.running}</strong>
          <span>in flight</span>
        </div>
        <div className="summary__stat" data-tone="warn">
          <strong>{counts.dueSoon}</strong>
          <span>due this week</span>
        </div>
        <div className="summary__stat" data-tone="bad">
          <strong>{counts.overdue}</strong>
          <span>past deadline</span>
        </div>
      </section>

      {focus && (
        <section className="focus" aria-label="Current focus">
          <div className="focus__label">Closest deadline</div>
          <button type="button" className="focus__hit" onClick={() => onOpen(focus)}>
            <h2>{focus.title}</h2>
            <WeekProgress task={focus} variant="hero" />
            <p className="focus__end-state">
              <span>Done when:</span> {focus.endState}
            </p>
          </button>
        </section>
      )}

      <section className="task-list" aria-label="Tasks">
        <div className="task-list__header">
          <h2>Your tasks</h2>
          <div className="segmented segmented--sm" role="group" aria-label="Filter tasks">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="segmented__option"
                aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="empty">
            Nothing here yet. <button type="button" className="link" onClick={onNew}>Add a task</button> to
            start the clock.
          </p>
        ) : (
          <div className="task-grid">
            {visible.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={onOpen} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
