// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

/**
 * Covers the dialog flow the client actually clicks through: open a task from
 * the dashboard, edit it, save, and see the change reflected.
 *
 * The store is the real `LocalTaskStore` against jsdom's localStorage, so this
 * exercises persistence end to end rather than mocking it out.
 */

afterEach(cleanup)

beforeEach(() => {
  // Each test starts from the seed data, not the previous test's edits.
  localStorage.clear()
})

/** The seeded task with the closest deadline, so it lands in the focus card. */
const SEEDED_TITLE = 'Retainer proposal — Meridian'

async function openTaskDetail(user: ReturnType<typeof userEvent.setup>) {
  render(<App />)

  const taskList = await screen.findByRole('region', { name: 'Tasks' })
  const card = await within(taskList).findByRole('heading', { name: SEEDED_TITLE })
  await user.click(card)

  return screen.findByRole('dialog', { name: SEEDED_TITLE })
}

describe('task dialog flow', () => {
  it('opens a task from the dashboard and shows its detail', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    expect(within(dialog).getByText('Definition of done')).toBeDefined()
    expect(
      within(dialog).getByText(/Proposal PDF sent to Meridian/),
    ).toBeDefined()
  })

  it('edits a task and shows the new title after saving', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    await user.click(within(dialog).getByRole('button', { name: 'Edit task' }))

    const form = await screen.findByRole('dialog', { name: 'Edit task' })
    const title = within(form).getByRole('textbox', { name: /Task name/ })
    await user.clear(title)
    await user.type(title, 'Retainer proposal — sent')

    await user.click(within(form).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: 'Retainer proposal — sent' }),
      ).toBeDefined()
    })
  })

  it('persists an edit through the store', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    await user.click(within(dialog).getByRole('button', { name: 'Edit task' }))
    const form = await screen.findByRole('dialog', { name: 'Edit task' })
    const title = within(form).getByRole('textbox', { name: /Task name/ })
    await user.clear(title)
    await user.type(title, 'Persisted title')
    await user.click(within(form).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      const raw = localStorage.getItem('finini-dashboard/tasks/v1')
      expect(raw).not.toBeNull()
      const titles = (JSON.parse(raw!) as { title: string }[]).map((t) => t.title)
      expect(titles).toContain('Persisted title')
    })
  })

  it('changes a task status from the detail dialog', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    const done = within(dialog).getByRole('button', { name: 'Done' })
    expect(done.getAttribute('aria-pressed')).toBe('false')

    await user.click(done)

    await waitFor(() => {
      const raw = localStorage.getItem('finini-dashboard/tasks/v1')
      const tasks = JSON.parse(raw!) as { title: string; status: string }[]
      expect(tasks.find((t) => t.title === SEEDED_TITLE)?.status).toBe('done')
    })
  })

  it('closes the detail dialog', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    await user.click(within(dialog).getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('closes on a click that both starts and ends on the backdrop', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    const backdrop = dialog.parentElement!
    await user.click(backdrop)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('stays open when a drag starts inside the panel and ends on the backdrop', async () => {
    // Selecting text in a form field and overshooting the edge used to be
    // read as a backdrop click, throwing away everything typed so far.
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)
    const backdrop = dialog.parentElement!

    await user.pointer([
      { keys: '[MouseLeft>]', target: dialog },
      { target: backdrop },
      { keys: '[/MouseLeft]', target: backdrop },
    ])

    expect(screen.getByRole('dialog')).toBeDefined()
  })
})

describe('sub-projects', () => {
  /** The seeded project that is broken into parts. */
  const PROJECT = 'Brand refresh rollout'

  async function openProject(user: ReturnType<typeof userEvent.setup>) {
    render(<App />)
    const taskList = await screen.findByRole('region', { name: 'Tasks' })
    await user.click(await within(taskList).findByRole('heading', { name: PROJECT }))
    return await screen.findByRole('dialog')
  }

  it('lists a project but not the parts inside it', async () => {
    render(<App />)
    const taskList = await screen.findByRole('region', { name: 'Tasks' })

    expect(await within(taskList).findByRole('heading', { name: PROJECT })).toBeDefined()
    // A part appearing beside its own project would double count it.
    expect(
      within(taskList).queryByRole('heading', { name: 'Deck and document templates' }),
    ).toBeNull()
  })

  it('shows the parts inside the project, and opens one', async () => {
    const user = userEvent.setup()
    const dialog = await openProject(user)

    await user.click(within(dialog).getByRole('button', { name: /Deck and document templates/ }))

    // The part gets the same pop-up, and names the project it belongs to.
    expect(await screen.findByText(/Part of/)).toBeDefined()
    expect(screen.getByRole('button', { name: PROJECT })).toBeDefined()
  })

  it('warns when a part is dated past the project holding it', async () => {
    const user = userEvent.setup()
    const dialog = await openProject(user)

    expect(
      within(dialog).getByText(/dated past this project’s own deadline/),
    ).toBeDefined()
  })

  it('adds a part, dated to fit inside the project by default', async () => {
    const user = userEvent.setup()
    const dialog = await openProject(user)

    await user.click(within(dialog).getByRole('button', { name: '+ Add a part' }))

    const form = await screen.findByRole('dialog', { name: /New part of/ })
    await user.type(within(form).getByRole('textbox', { name: 'Task name' }), 'Print collateral')
    await user.click(within(form).getByRole('button', { name: 'Add part' }))

    // Lands on the new part's own pop-up, showing its project.
    expect(await screen.findByRole('heading', { name: 'Print collateral' })).toBeDefined()
    expect(screen.getByText(/Part of/)).toBeDefined()
  })

  it('a part cannot itself hold parts', async () => {
    const user = userEvent.setup()
    const dialog = await openProject(user)

    await user.click(within(dialog).getByRole('button', { name: /Deck and document templates/ }))
    await waitFor(() => {
      expect(screen.getByText(/Part of/)).toBeDefined()
    })

    expect(screen.queryByRole('button', { name: '+ Add a part' })).toBeNull()
  })
})

describe('task notes', () => {
  it('shows the notes already logged against a task', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    expect(within(dialog).getByText(/Rate card comparison done/)).toBeDefined()
    expect(within(dialog).getByText(/Pulled the three strongest case studies/)).toBeDefined()
  })

  it('adds a note and shows it at the top of the list', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    const field = within(dialog).getByPlaceholderText(/What happened/)
    await user.type(field, 'Sent the draft over for review.')
    await user.click(within(dialog).getByRole('button', { name: 'Add note' }))

    await waitFor(() => {
      expect(screen.getByText('Sent the draft over for review.')).toBeDefined()
    })

    // Newest first — the new note should precede the previously-seeded one.
    const bodies = screen.getAllByRole('listitem').map((li) => li.textContent ?? '')
    const newest = bodies.findIndex((text) => text.includes('Sent the draft over'))
    const older = bodies.findIndex((text) => text.includes('Rate card comparison'))
    expect(newest).toBeGreaterThanOrEqual(0)
    expect(newest).toBeLessThan(older)
  })

  it('persists a new note through the store', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    await user.type(
      within(dialog).getByPlaceholderText(/What happened/),
      'Persisted note.',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Add note' }))

    await waitFor(() => {
      const raw = localStorage.getItem('finini-dashboard/tasks/v1')
      const tasks = JSON.parse(raw!) as { title: string; notes: { body: string }[] }[]
      const bodies = tasks.find((t) => t.title === SEEDED_TITLE)?.notes.map((n) => n.body)
      expect(bodies).toContain('Persisted note.')
    })
  })

  it('will not add a blank note', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    const add = within(dialog).getByRole('button', { name: 'Add note' })
    expect(add.hasAttribute('disabled')).toBe(true)

    await user.type(within(dialog).getByPlaceholderText(/What happened/), '   ')
    expect(add.hasAttribute('disabled')).toBe(true)
  })

  it('deletes a note', async () => {
    const user = userEvent.setup()
    const dialog = await openTaskDetail(user)

    const deleteButtons = within(dialog).getAllByRole('button', { name: 'Delete note' })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.queryByText(/Rate card comparison done/)).toBeNull()
    })
    // The other note is untouched.
    expect(screen.getByText(/Pulled the three strongest case studies/)).toBeDefined()
  })
})

describe('signing out and back in', () => {
  it('opens straight onto the dashboard rather than a login form', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Where you are right now' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Sign in' })).toBeNull()
  })

  it('shows the sign-in screen after signing out, and returns on sign-in', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Where you are right now' })).toBeNull()

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'thandi@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Where you are right now' })).toBeDefined()
    })
    expect(screen.getByText(/Signed in as thandi/)).toBeDefined()
  })

  it('rejects a short password before calling the provider', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Sign out' }))

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText(/at least 8 characters/)).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Where you are right now' })).toBeNull()
  })

  it('can switch to creating an account', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Sign out' }))

    await user.click(screen.getByRole('button', { name: 'Create one' }))

    expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeDefined()
    expect(screen.getByRole('textbox', { name: 'Your name' })).toBeDefined()
  })
})
