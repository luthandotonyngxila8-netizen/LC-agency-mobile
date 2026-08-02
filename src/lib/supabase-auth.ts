import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'
import type { AuthProvider, User } from './auth'

/**
 * The hosted implementation of `AuthProvider`.
 *
 * NOT CONNECTED YET — the counterpart to `SupabaseTaskStore`. Together they
 * are the whole swap: replace the two exports at the bottom of `auth.ts` and
 * `store.ts` with these and the app is running on real accounts and real data.
 *
 * Unlike the demo stub, this one actually checks the password, because
 * Supabase does. Nothing here stores it.
 */
export class SupabaseAuthProvider implements AuthProvider {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /** Supabase's user carries the display name in metadata, not a column. */
  private toUser(user: SupabaseUser): User {
    const name =
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split('@')[0] ??
      'You'
    return { id: user.id, email: user.email ?? '', name }
  }

  async currentUser(): Promise<User | null> {
    const { data, error } = await this.client.auth.getUser()
    // A missing session is the normal signed-out case, not a failure.
    if (error || !data.user) return null
    return this.toUser(data.user)
  }

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Sign-in returned no user')
    return this.toUser(data.user)
  }

  async signUp(name: string, email: string, password: string): Promise<User> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      // Read back by the handle_new_user trigger to populate `profiles.name`.
      options: { data: { name } },
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Sign-up returned no user')
    return this.toUser(data.user)
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()
    if (error) throw new Error(error.message)
  }
}
