import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  /** Optional footer row, usually actions. */
  footer?: ReactNode
  size?: 'md' | 'lg'
}

/** The pop-up shell the client asked for: focused, dismissable, mobile-first. */
export function Modal({ title, onClose, children, footer, size = 'md' }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Where the pointer went down. A drag that starts inside the panel and ends
  // on the backdrop — selecting text and overshooting — must not be read as a
  // click on the backdrop, or a half-filled form is thrown away.
  const pressedOnBackdrop = useRef(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('is-modal-open')

    // Only take focus if the panel's own content hasn't claimed it — an
    // autoFocus field inside is the better landing place, and on a phone it
    // is the difference between the keyboard opening and not.
    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus()
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('is-modal-open')
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
