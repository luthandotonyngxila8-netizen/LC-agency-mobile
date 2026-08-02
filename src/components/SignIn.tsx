import { useState, type FormEvent } from 'react'

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (name: string, email: string, password: string) => Promise<void>
}

type Mode = 'sign_in' | 'sign_up'

/**
 * The signed-out screen.
 *
 * Deliberately plain: this is the shape the real thing will take once Supabase
 * Auth is behind it, not a finished login experience. The notice at the bottom
 * is load-bearing — without it someone could reasonably think their password
 * was being checked.
 */
export function SignIn({ onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<Mode>('sign_in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const signingUp = mode === 'sign_up'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (signingUp && !name.trim()) {
      setError('What should we call you?')
      return
    }
    if (!email.trim()) {
      setError('Enter the email address you want to sign in with.')
      return
    }
    if (password.length < 8) {
      setError('Passwords need to be at least 8 characters.')
      return
    }

    setBusy(true)
    try {
      if (signingUp) await onSignUp(name.trim(), email.trim(), password)
      else await onSignIn(email.trim(), password)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="signin">
      <div className="signin__panel">
        <p className="signin__eyebrow">Finini Dashboard</p>
        <h1>{signingUp ? 'Create your account' : 'Sign in'}</h1>
        <p className="signin__lede">
          {signingUp
            ? 'Your projects, their timelines, and who you have shared them with.'
            : 'Pick up where you left off.'}
        </p>

        <form className="form" onSubmit={handleSubmit}>
          {signingUp && (
            <label className="field">
              <span>Your name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={signingUp ? 'new-password' : 'current-password'}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="button button--block" disabled={busy}>
            {signingUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="signin__switch">
          {signingUp ? 'Already have an account?' : 'No account yet?'}{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(signingUp ? 'sign_in' : 'sign_up')
              setError(null)
            }}
          >
            {signingUp ? 'Sign in' : 'Create one'}
          </button>
        </p>

        <p className="demo-note">
          Demo build: no accounts exist yet, so any email and password will get you
          in and nothing is checked. Real sign-in arrives with the backend.
        </p>
      </div>
    </div>
  )
}
