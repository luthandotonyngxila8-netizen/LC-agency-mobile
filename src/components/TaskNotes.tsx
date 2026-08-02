import { useState, type FormEvent } from 'react'
import { format, parseISO } from 'date-fns'
import type { Task } from '../types'
import { noteAge } from '../lib/format'

interface Props {
  task: Task
  onAdd: (body: string) => void
  onRemove: (noteId: string) => void
}

/**
 * The running log against a task: what happened, when.
 *
 * This is the field the client described as wanting to look back on weeks
 * later — and the only thing on a task worth summarising, since everything
 * else is text he wrote himself.
 */
export function TaskNotes({ task, onAdd, onRemove }: Props) {
  const [body, setBody] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setBody('')
  }

  return (
    <section className="detail-section">
      <h4>Notes</h4>

      <form className="note-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="visually-hidden">Add a note</span>
          <textarea
            rows={2}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What happened? Where did it get to?"
          />
        </label>
        <button type="submit" className="button" disabled={!body.trim()}>
          Add note
        </button>
      </form>

      {task.notes.length === 0 ? (
        <p className="muted">
          Nothing logged yet. Jot down what moved and what got stuck — this is
          what you&rsquo;ll read back weeks from now.
        </p>
      ) : (
        <ol className="note-list">
          {task.notes.map((note) => {
            const written = parseISO(note.createdAt)
            return (
              <li key={note.id} className="note">
                <div className="note__head">
                  <time dateTime={note.createdAt} title={format(written, 'EEE d MMM yyyy, HH:mm')}>
                    {noteAge(written)}
                  </time>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Delete note"
                    onClick={() => onRemove(note.id)}
                  >
                    ✕
                  </button>
                </div>
                <p className="note__body">{note.body}</p>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
