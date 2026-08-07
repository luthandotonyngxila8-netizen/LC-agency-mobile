import { Modal } from './Modal'

export interface ConfirmRequest {
  title: string
  /** What is about to happen, in the user's terms. */
  body: string
  /** The button that does it. Name the action, never "OK". */
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
}

interface Props {
  request: ConfirmRequest
  onClose: () => void
}

/**
 * An in-app confirmation, replacing `window.confirm`.
 *
 * The native dialog is not merely ugly here — it is unreliable. A sandboxed
 * frame without `allow-modals` ignores the call entirely and returns false, so
 * every `confirm()` silently answers "no" and the action never runs. That is
 * exactly how this app is embedded when the demo link is opened, which made
 * deleting a task impossible with no error to show for it.
 *
 * It also gets a better answer: the native box can only ask a bare question,
 * where this one can say what is about to be taken with it.
 */
export function Confirm({ request, onClose }: Props) {
  const confirm = () => {
    request.onConfirm()
    onClose()
  }

  return (
    <Modal
      title={request.title}
      onClose={onClose}
      footer={
        <div className="modal__footer-actions modal__footer-actions--full">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={request.destructive ? 'button button--destructive' : 'button'}
            onClick={confirm}
            autoFocus
          >
            {request.confirmLabel}
          </button>
        </div>
      }
    >
      <p>{request.body}</p>
    </Modal>
  )
}
