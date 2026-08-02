export interface User {
  id: string
  email: string
  name: string
}

/**
 * The only auth contract the UI knows about, shaped like `TaskStore` on
 * purpose: async throughout, no component talks to it directly, and swapping
 * the demo stub for Supabase Auth is one file.
 *
 * `password` is on the signature because the real implementation needs it —
 * not because the stub below does anything with it.
 */
export interface AuthProvider {
  currentUser(): Promise<User | null>
  signIn(email: string, password: string): Promise<User>
  signUp(name: string, email: string, password: string): Promise<User>
  signOut(): Promise<void>
}

const SESSION_KEY = 'finini-dashboard/session/v1'

/** The account the demo opens on, so the dashboard is the first thing seen. */
const DEMO_USER: User = {
  id: 'demo-user',
  email: 'luyanda@example.com',
  name: 'Luyanda',
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 10)}`
}

export class DemoAuthProvider implements AuthProvider {
  /** Used when localStorage is unavailable, matching LocalTaskStore. */
  private fallback: User | null | undefined

  private read(): User | null {
    if (this.fallback !== undefined) return this.fallback
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) return JSON.parse(raw) as User
      // First run opens signed in: the demo's job is to show the dashboard,
      // not to make the client fill in a form before he sees anything.
      this.write(DEMO_USER)
      return DEMO_USER
    } catch {
      this.fallback = DEMO_USER
      return DEMO_USER
    }
  }

  private write(user: User | null): void {
    try {
      if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      else localStorage.setItem(SESSION_KEY, 'null')
      this.fallback = undefined
    } catch {
      this.fallback = user
    }
  }

  async currentUser(): Promise<User | null> {
    const user = this.read()
    // A signed-out session is stored as the string "null", so it survives a
    // reload — otherwise signing out and refreshing would silently sign back in.
    return user && typeof user === 'object' ? user : null
  }

  /**
   * Accepts anything. There is no backend to check a password against, and
   * storing one here — even in a stub, even locally — would put a pattern in
   * this repo that nobody should copy. The screen exists to show the flow.
   */
  async signIn(email: string, _password: string): Promise<User> {
    const user: User = {
      id: newId(),
      email,
      name: email.split('@')[0] || 'You',
    }
    this.write(user)
    return user
  }

  async signUp(name: string, email: string, _password: string): Promise<User> {
    const user: User = { id: newId(), email, name }
    this.write(user)
    return user
  }

  async signOut(): Promise<void> {
    this.write(null)
  }
}

export const authProvider: AuthProvider = new DemoAuthProvider()
