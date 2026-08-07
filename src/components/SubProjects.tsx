import { STATUS_LABELS, type Task } from '../types'
import { getHealth, getProgressHeadline, plural } from '../lib/progress'
import { overrunsParent, rollUp } from '../lib/tree'

interface Props {
  parent: Task
  tasks: Task[]
  onOpen: (task: Task) => void
  onAdd: () => void
}

/**
 * The parts a project breaks into — the client's "a project within a project".
 *
 * Each row is a way in rather than a summary: opening a sub-project gives the
 * same pop-up as any other, with its own timeline, notes and sharing. The one
 * thing shown here that a sub-project can't show about itself is whether its
 * deadline falls outside the project containing it.
 */
export function SubProjects({ parent, tasks, onOpen, onAdd }: Props) {
  const sub = rollUp(tasks, parent)

  return (
    <section className="detail-section">
      <div className="sub-head">
        <h4>Parts of this project</h4>
        {sub && (
          <span className="sub-head__count">
            {sub.done} of {sub.total} done
          </span>
        )}
      </div>

      {sub && sub.overrunning > 0 && (
        <p className="overrun-notice">
          {sub.overrunning === 1 ? 'One part is' : `${sub.overrunning} parts are`} dated
          past this project&rsquo;s own deadline. The project will look on track until
          the day it isn&rsquo;t.
        </p>
      )}

      {!sub ? (
        <p className="muted">
          Nothing broken out yet. Split this into parts when it&rsquo;s easier to
          track them separately — each one gets its own timeline.
        </p>
      ) : (
        <ol className="sub-list">
          {sub.children.map((child) => {
            const health = getHealth(child)
            const over = overrunsParent(child, parent)
            return (
              <li key={child.id}>
                <button
                  type="button"
                  className="sub-row"
                  data-health={health}
                  onClick={() => onOpen(child)}
                >
                  <span className="sub-row__title">{child.title}</span>
                  <span className="sub-row__meta">
                    <span className="sub-row__when">{getProgressHeadline(child)}</span>
                    <span className="tag" data-status={child.status}>
                      {STATUS_LABELS[child.status]}
                    </span>
                    {over && <span className="tag tag--overrun">Past project deadline</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <button type="button" className="button button--ghost button--block" onClick={onAdd}>
        + Add a part
      </button>

      {sub && (
        <p className="field-hint">
          {sub.total} {plural(sub.total, 'part')} — each can be shared on its own, or
          inherit whoever you&rsquo;ve given access to this project.
        </p>
      )}
    </section>
  )
}
