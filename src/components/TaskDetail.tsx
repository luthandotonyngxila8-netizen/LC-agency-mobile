import { format, parseISO } from 'date-fns'
import { PERMISSION_LABELS, STATUS_LABELS, type Task, type TaskStatus } from '../types'
import { daysSinceMovement, isStalled, plural } from '../lib/progress'
import { overrunsParent } from '../lib/tree'
import { Modal } from './Modal'
import { SubProjects } from './SubProjects'
import { TaskNotes } from './TaskNotes'
import { WeekProgress } from './WeekProgress'

interface Props {
  task: Task
  /** Every task, so a project can show its parts and a part can name its project. */
  tasks: Task[]
  onClose: () => void
  onStatusChange: (status: TaskStatus) => void
  onEdit: () => void
  onShare: () => void
  onDelete: () => void
  onAddNote: (body: string) => void
  onRemoveNote: (noteId: string) => void
  onOpenTask: (task: Task) => void
  onAddSubProject: () => void
}

const STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'done']

/**
 * The pop-up the client described: open a task, immediately see where you are
 * in its timeline, then the detail underneath.
 */
export function TaskDetail({
  task,
  tasks,
  onClose,
  onStatusChange,
  onEdit,
  onShare,
  onDelete,
  onAddNote,
  onRemoveNote,
  onOpenTask,
  onAddSubProject,
}: Props) {
  const parent = task.parentId
    ? (tasks.find((candidate) => candidate.id === task.parentId) ?? null)
    : null

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
      {parent && (
        <p className="parent-crumb">
          Part of{' '}
          <button type="button" className="link" onClick={() => onOpenTask(parent)}>
            {parent.title}
          </button>
        </p>
      )}

      <WeekProgress task={task} variant="hero" />

      {parent && overrunsParent(task, parent) && (
        <p className="overrun-notice">
          This runs past {parent.title}&rsquo;s own deadline. Either this date moves in,
          or the project&rsquo;s moves out — right now the project is reporting a
          deadline it can&rsquo;t meet.
        </p>
      )}

      {isStalled(task) && (
        <p className="stall-notice">
          Nothing has happened here for{' '}
          <strong>
            {daysSinceMovement(task)} {plural(daysSinceMovement(task), 'day')}
          </strong>
          . The timeline above only counts calendar time — it can&rsquo;t tell you
          the work has stopped.
        </p>
      )}

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

      {/* Only a project holds parts — one level deep, so a part never does. */}
      {task.parentId === null && (
        <SubProjects
          parent={task}
          tasks={tasks}
          onOpen={onOpenTask}
          onAdd={onAddSubProject}
        />
      )}

      <TaskNotes task={task} onAdd={onAddNote} onRemove={onRemoveNote} />

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
        {task.shares.length === 0 && (parent?.shares.length ?? 0) === 0 ? (
          <p className="muted">Private — only you can see this.</p>
        ) : (
          <ul className="share-list share-list--compact">
            {task.shares.map((share) => (
              <li key={share.id}>
                <span>{share.invitee}</span>
                <span className="tag tag--muted">{PERMISSION_LABELS[share.permission]}</span>
              </li>
            ))}
            {/* Access flows down: sharing a project shares what's inside it.
                Shown here so it's never a surprise who can read a part. */}
            {parent?.shares.map((share) => (
              <li key={`inherited-${share.id}`}>
                <span>{share.invitee}</span>
                <span className="tag tag--muted">
                  {PERMISSION_LABELS[share.permission]} · via project
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Modal>
  )
}
