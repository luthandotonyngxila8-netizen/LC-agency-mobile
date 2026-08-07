import { useRef, useState, type FormEvent } from 'react'
import { format, parseISO } from 'date-fns'
import {
  PERMISSION_HINTS,
  PERMISSION_LABELS,
  type Permission,
  type Task,
} from '../types'
import { Modal } from './Modal'

interface Props {
  task: Task
  onClose: () => void
  onInvite: (invitee: string, permission: Permission) => void
  onPermissionChange: (shareId: string, permission: Permission) => void
  onRevoke: (shareId: string) => void
}

const PERMISSIONS: Permission[] = ['view', 'comment', 'edit']

/**
 * Per-task sharing, deliberately shallow: one task, one helper, one of three
 * permission levels. No org, no roles, no groups.
 *
 * Demo scope: invites are stored locally and no email is sent. The real
 * version delegates this to the backend's own auth + row-level rules.
 */
export function ShareDialog({
  task,
  onClose,
  onInvite,
  onPermissionChange,
  onRevoke,
}: Props) {
  const [invitee, setInvitee] = useState('')
  const [permission, setPermission] = useState<Permission>('view')
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const linkRef = useRef<HTMLElement>(null)

  const shareLink = `https://finini.app/shared/${task.id.slice(0, 8)}`

  const handleInvite = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = invitee.trim()
    if (!trimmed) return
    onInvite(trimmed, permission)
    setInvitee('')
    setPermission('view')
  }

  /**
   * Says "Copied" only when it copied. The clipboard is blocked outright in
   * some mobile browsers and in an embedded frame, and claiming success there
   * sends someone off to paste an empty clipboard. On failure the link is
   * selected instead, so it can be copied by hand.
   */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyFailed(true)
      const node = linkRef.current
      if (node) {
        const range = document.createRange()
        range.selectNodeContents(node)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }

  return (
    <Modal title={`Share “${task.title}”`} onClose={onClose}>
      <p className="muted share-scope">
        This shares <strong>this task only</strong>. The rest of your dashboard stays
        private.
      </p>

      <form className="form" onSubmit={handleInvite}>
        <label className="field">
          <span>Invite someone</span>
          <input
            type="text"
            value={invitee}
            onChange={(event) => setInvitee(event.target.value)}
            placeholder="name or email"
          />
        </label>

        <fieldset className="field">
          <span>Permission</span>
          <div className="segmented">
            {PERMISSIONS.map((level) => (
              <button
                key={level}
                type="button"
                className="segmented__option"
                aria-pressed={permission === level}
                onClick={() => setPermission(level)}
              >
                {PERMISSION_LABELS[level]}
              </button>
            ))}
          </div>
          <small className="field-hint">{PERMISSION_HINTS[permission]}</small>
        </fieldset>

        <button type="submit" className="button button--block" disabled={!invitee.trim()}>
          Send invite
        </button>
      </form>

      <section className="detail-section">
        <h4>Share link</h4>
        <div className="share-link">
          <code ref={linkRef}>{shareLink}</code>
          <button type="button" className="button button--ghost" onClick={copyLink}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <small className="field-hint">
          {copyFailed
            ? 'This browser blocked the clipboard — the link is selected above, copy it by hand.'
            : 'Anyone with the link gets the permission level you set for them above.'}
        </small>
      </section>

      <section className="detail-section">
        <h4>People with access</h4>
        {task.shares.length === 0 ? (
          <p className="muted">Nobody yet — this task is private.</p>
        ) : (
          <ul className="share-list">
            {task.shares.map((share) => (
              <li key={share.id}>
                <div className="share-list__who">
                  <strong>{share.invitee}</strong>
                  <small>Invited {format(parseISO(share.invitedAt), 'd MMM yyyy')}</small>
                </div>
                <div className="share-list__controls">
                  <select
                    value={share.permission}
                    aria-label={`Permission for ${share.invitee}`}
                    onChange={(event) =>
                      onPermissionChange(share.id, event.target.value as Permission)
                    }
                  >
                    {PERMISSIONS.map((level) => (
                      <option key={level} value={level}>
                        {PERMISSION_LABELS[level]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove ${share.invitee}`}
                    onClick={() => onRevoke(share.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="demo-note">
        Demo: invites are saved locally and no email is sent. In the built version this
        is handled by the hosted backend&rsquo;s own auth and per-row access rules.
      </p>
    </Modal>
  )
}
