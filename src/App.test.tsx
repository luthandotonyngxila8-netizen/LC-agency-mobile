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
})
