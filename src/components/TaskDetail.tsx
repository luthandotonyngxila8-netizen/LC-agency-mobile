import { format, parseISO } from 'date-fns'
import { PERMISSION_LABELS, STATUS_LABELS, type Task, type TaskStatus } from '../types'
import { Modal } from './Modal'
import { WeekProgress } from './WeekProgress'

interface Props {
  task: Task
  onClose: () => void
  onStatusChange: (status: TaskStatus) => void
  onEdit: () => void
  onShare: () => void
  onDelete: () => void
}

const STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'done']

/**
 * The pop-up the client described: open a task, immediately see where you are
 * in its timeline, then the detail underneath.
 */
export function TaskDetail({
  task,
  onClose,
  onStatusChange,
  onEdit,
  onShare,
  onDelete,
}: Props) {
  return (
    <Modal
      title={task.title}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="button button--ghost button--danger" onClick={onDelete}>
            Delete
          </button>
          <div className="modal__footer-actions">
            <button type="button" className="button button--ghost" onClick={onShare}>
              Share
            </button>
            <button type="button" className="button" onClick={onEdit}>
              Edit task
            </button>
          </div>
        </>
      }
    >
      <WeekProgress task={task} variant="hero" />

      <section className="detail-section">
        <h4>Status</h4>
        <div className="segmented" role="group" aria-label="Task status">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className="segmented__option"
              aria-pressed={task.status === status}
              onClick={() => onStatusChange(status)}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <h4>What&rsquo;s involved</h4>
        <p>{task.description || <span className="muted">No description yet.</span>}</p>
      </section>

      <section className="detail-section">
        <h4>Definition of done</h4>
        <p className="end-state">
          {task.endState || <span className="muted">No end state set.</span>}
        </p>
      </section>

      <section className="detail-section">
        <h4>Dates</h4>
        <dl className="detail-dates">
          <div>
            <dt>Start</dt>
            <dd>{format(parseISO(task.startDate), 'EEE d MMM yyyy')}</dd>
          </div>
          <div>
            <dt>Target end</dt>
            <dd>{format(parseISO(task.endDate), 'EEE d MMM yyyy')}</dd>
          </div>
        </dl>
      </section>

      <section className="detail-section">
        <h4>Access</h4>
        {task.shares.length === 0 ? (
          <p className="muted">Private — only you can see this task.</p>
        ) : (
          <ul className="share-list share-list--compact">
            {task.shares.map((share) => (
              <li key={share.id}>
                <span>{share.invitee}</span>
                <span className="tag tag--muted">{PERMISSION_LABELS[share.permission]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Modal>
  )
}
