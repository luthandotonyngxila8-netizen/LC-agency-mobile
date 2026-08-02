import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DemoAuthProvider } from './auth'

class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear() {
    this.store.clear()
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
}

class ThrowingStorage implements Storage {
  length = 0
  clear(): never {
    throw new Error('blocked')
  }
  getItem(): never {
    throw new Error('blocked')
  }
  key(): never {
    throw new Error('blocked')
  }
  removeItem(): never {
    throw new Error('blocked')
  }
  setItem(): never {
    throw new Error('blocked')
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('DemoAuthProvider', () => {
  beforeEach(() => vi.stubGlobal('localStorage', new MemoryStorage()))

  it('opens signed in, so the demo lands on the dashboard', async () => {
    const user = await new DemoAuthProvider().currentUser()
    expect(user?.name).toBe('Luyanda')
  })

  it('keeps a signed-out session across reloads', async () => {
    await new DemoAuthProvider().signOut()
    // A fresh instance stands in for a page reload.
    expect(await new DemoAuthProvider().currentUser()).toBeNull()
  })

  it('signs in with any credentials and derives a name from the email', async () => {
    const auth = new DemoAuthProvider()
    await auth.signOut()

    const user = await auth.signIn('thandi@example.com', 'anything-at-all')

    expect(user.email).toBe('thandi@example.com')
    expect(user.name).toBe('thandi')
    expect(await auth.currentUser()).toEqual(user)
  })

  it('signs up with the name given', async () => {
    const auth = new DemoAuthProvider()
    const user = await auth.signUp('Thandi M', 'thandi@example.com', 'password123')

    expect(user.name).toBe('Thandi M')
    expect(await auth.currentUser()).toEqual(user)
  })

  it('never persists the password anywhere', async () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('localStorage', storage)

    await new DemoAuthProvider().signUp('Thandi', 'thandi@example.com', 'hunter2-secret')

    const everythingStored = Array.from(
      { length: storage.length },
      (_, i) => storage.getItem(storage.key(i)!) ?? '',
    ).join(' ')
    expect(everythingStored).not.toContain('hunter2-secret')
  })

  it('signs out', async () => {
    const auth = new DemoAuthProvider()
    expect(await auth.currentUser()).not.toBeNull()

    await auth.signOut()

    expect(await auth.currentUser()).toBeNull()
  })
})

describe('DemoAuthProvider when localStorage is unavailable', () => {
  beforeEach(() => vi.stubGlobal('localStorage', new ThrowingStorage()))

  it('still signs in and out via the in-memory fallback', async () => {
    const auth = new DemoAuthProvider()
    expect(await auth.currentUser()).not.toBeNull()

    await auth.signOut()
    expect(await auth.currentUser()).toBeNull()

    const user = await auth.signIn('someone@example.com', 'whatever')
    expect((await auth.currentUser())?.id).toBe(user.id)
  })
})
