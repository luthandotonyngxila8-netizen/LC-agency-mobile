import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  /** Optional footer row, usually actions. */
  footer?: ReactNode
  size?: 'md' | 'lg'
}

/**
 * Which modals are open, oldest first.
 *
 * A confirmation opens over a task pop-up, so more than one can be mounted at
 * once. Without this, Escape would reach every open modal and dismiss the lot,
 * and the first one to unmount would lift the scroll lock while another was
 * still on screen.
 */
const openModals: symbol[] = []

/** The pop-up shell the client asked for: focused, dismissable, mobile-first. */
export function Modal({ title, onClose, children, footer, size = 'md' }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Where the pointer went down. A drag that starts inside the panel and ends
  // on the backdrop — selecting text and overshooting — must not be read as a
  // click on the backdrop, or a half-filled form is thrown away.
  const pressedOnBackdrop = useRef(false)

  useEffect(() => {
    const id = Symbol('modal')
    openModals.push(id)
    document.body.classList.add('is-modal-open')

    const onKeyDown = (event: KeyboardEvent) => {
      // Only the topmost modal answers Escape.
      if (event.key === 'Escape' && openModals.at(-1) === id) onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // Only take focus if the panel's own content hasn't claimed it — an
    // autoFocus field inside is the better landing place, and on a phone it
    // is the difference between the keyboard opening and not.
    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus()
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const index = openModals.indexOf(id)
      if (index !== -1) openModals.splice(index, 1)
      if (openModals.length === 0) document.body.classList.remove('is-modal-open')
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && pressedOnBackdrop.current) onClose()
      }}
    >
      <div
        ref={panelRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="modal__header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  )
}
