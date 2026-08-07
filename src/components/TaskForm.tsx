import { useState, type FormEvent } from 'react'
import { addWeeks, format, isBefore, parseISO } from 'date-fns'
import { STATUS_LABELS, type Task, type TaskDraft, type TaskStatus } from '../types'
import { Modal } from './Modal'
import { getWeekProgress } from '../lib/progress'
import { defaultChildDates } from '../lib/tree'

interface Props {
  /** Omit to create a new task. */
  task?: Task
  /**
   * The project this sits inside. Set when creating a part — so it opens dated
   * to fit — and when editing one, so overrunning the project is flagged while
   * the dates are being chosen rather than discovered afterwards.
   */
  parent?: Task
  /**
   * The parts inside the task being edited, if it is a project. Pulling a
   * project's end date in strands them past it just as surely as pushing a
   * part's out — the warning has to work in both directions.
   *
   * Not called `children`: that name is React's own, and this never renders.
   */
  parts?: Task[]
  onSubmit: (draft: TaskDraft) => void
  onClose: () => void
}

const STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'done']

function defaultDraft(parent?: Task): TaskDraft {
  const today = new Date()
  const dates = parent
    ? defaultChildDates(parent, today)
    : {
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(addWeeks(today, 4), 'yyyy-MM-dd'),
      }

  return {
    parentId: parent?.id ?? null,
    title: '',
    description: '',
    endState: '',
    ...dates,
    status: 'not_started',
  }
}

export function TaskForm({ task, parent, parts = [], onSubmit, onClose }: Props) {
  const [draft, setDraft] = useState<TaskDraft>(() =>
    task
      ? {
          parentId: task.parentId,
          title: task.title,
          description: task.description,
          endState: task.endState,
          startDate: task.startDate,
          endDate: task.endDate,
          status: task.status,
        }
      : defaultDraft(parent),
  )
  const [error, setError] = useState<string | null>(null)

  // Clearing on edit rather than on the next submit: an error that stays put
  // while you fix the thing it is complaining about reads as unfixable.
  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  const datesValid =
    draft.startDate !== '' &&
    draft.endDate !== '' &&
    !isBefore(parseISO(draft.endDate), parseISO(draft.startDate))

  // Live preview of the week count, so the timeline isn't a surprise on save.
  const preview = datesValid ? getWeekProgress(draft) : null

  // Parts that the end date being typed would leave hanging past the project.
  // Unfinished only — a delivered part can't be stranded by a date change.
  const strandedParts = datesValid
    ? parts.filter(
        (child) =>
          child.status !== 'done' && parseISO(child.endDate) > parseISO(draft.endDate),
      )
    : []

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim()) {
      setError('Give the task a name.')
      return
    }
    if (!datesValid) {
      setError('The target end date has to fall on or after the start date.')
      return
    }
    onSubmit({ ...draft, title: draft.title.trim() })
  }

  return (
    <Modal
      title={task ? 'Edit task' : parent ? `New part of “${parent.title}”` : 'New task'}
      onClose={onClose}
      footer={
        <div className="modal__footer-actions modal__footer-actions--full">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="task-form" className="button">
            {task ? 'Save changes' : parent ? 'Add part' : 'Create task'}
          </button>
        </div>
      }
    >
      <form id="task-form" className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Task name</span>
          <input
            type="text"
            value={draft.title}
            onChange={(event) => set('title', event.target.value)}
            placeholder="e.g. Retainer proposal — Meridian"
            autoFocus
          />
        </label>

        <label className="field">
          <span>What&rsquo;s involved</span>
          <textarea
            rows={3}
            value={draft.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="The work itself — what actually has to happen."
          />
        </label>

        <label className="field">
          <span>Definition of done</span>
          <textarea
            rows={2}
            value={draft.endState}
            onChange={(event) => set('endState', event.target.value)}
            placeholder="How you'll know it's finished."
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Start date</span>
            <input
              type="date"
              value={draft.startDate}
              onChange={(event) => set('startDate', event.target.value)}
            />
          </label>
          <label className="field">
            <span>Target end date</span>
            <input
              type="date"
              value={draft.endDate}
              onChange={(event) => set('endDate', event.target.value)}
            />
          </label>
        </div>

        {preview ? (
          <p className="form-preview">
            Timeline: <strong>{preview.totalWeeks}</strong>{' '}
            {preview.totalWeeks === 1 ? 'week' : 'weeks'} ({preview.totalDays} days)
          </p>
        ) : (
          draft.startDate !== '' &&
          draft.endDate !== '' && (
            <p className="form-preview form-preview--bad">
              The end date falls before the start date — no timeline to draw.
            </p>
          )
        )}

        {/* Told at the point of choosing, not discovered on the dashboard later. */}
        {parent && datesValid && parseISO(draft.endDate) > parseISO(parent.endDate) && (
          <p className="form-preview form-preview--warn">
            This runs past {parent.title}, which ends{' '}
            {format(parseISO(parent.endDate), 'd MMM')}. Allowed — but the project
            will report a deadline it can&rsquo;t meet.
          </p>
        )}

        {/* The same problem from the other end: pulling the project in. */}
        {datesValid && strandedParts.length > 0 && (
          <p className="form-preview form-preview--warn">
            {strandedParts.length === 1
              ? `“${strandedParts[0].title}” now ends after this project does.`
              : `${strandedParts.length} parts now end after this project does.`}{' '}
            Allowed — but the project will report a deadline it can&rsquo;t meet.
          </p>
        )}

        <fieldset className="field">
          <span>Status</span>
          <div className="segmented">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className="segmented__option"
                aria-pressed={draft.status === status}
                onClick={() => set('status', status)}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  )
}
