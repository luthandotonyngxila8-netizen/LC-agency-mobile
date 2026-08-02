import { useState } from 'react'
import type { Permission, Task, TaskDraft, TaskStatus } from './types'
import { useTasks } from './hooks/useTasks'
import { useAuth } from './hooks/useAuth'
import { resetDemoData } from './lib/store'
import { Dashboard } from './components/Dashboard'
import { SignIn } from './components/SignIn'
import { TaskDetail } from './components/TaskDetail'
import { TaskForm } from './components/TaskForm'
import { ShareDialog } from './components/ShareDialog'

type Dialog =
  | { kind: 'none' }
  | { kind: 'detail'; taskId: string }
  | { kind: 'edit'; taskId: string }
  | { kind: 'create' }
  | { kind: 'share'; taskId: string }

export default function App() {
  const {
    tasks,
    loading,
    createTask,
    updateTask,
    removeTask,
    addShare,
    updateShare,
    removeShare,
    addNote,
    removeNote,
  } = useTasks()
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' })

  const close = () => setDialog({ kind: 'none' })

  const activeTask =
    'taskId' in dialog ? tasks.find((task) => task.id === dialog.taskId) : undefined

  const handleCreate = async (draft: TaskDraft) => {
    const task = await createTask(draft)
    setDialog({ kind: 'detail', taskId: task.id })
  }

  const handleEdit = async (draft: TaskDraft) => {
    if (!activeTask) return
    await updateTask(activeTask.id, draft)
    setDialog({ kind: 'detail', taskId: activeTask.id })
  }

  const handleStatusChange = async (status: TaskStatus) => {
    if (!activeTask) return
    await updateTask(activeTask.id, { status })
  }

  const handleDelete = async () => {
    if (!activeTask) return
    if (!confirm(`Delete “${activeTask.title}”?`)) return
    await removeTask(activeTask.id)
    close()
  }

  const handleInvite = async (invitee: string, permission: Permission) => {
    if (!activeTask) return
    await addShare(activeTask.id, invitee, permission)
  }

  const handleReset = () => {
    if (!confirm('Reset the demo back to its sample tasks?')) return
    resetDemoData()
    window.location.reload()
  }

  const openTask = (task: Task) => setDialog({ kind: 'detail', taskId: task.id })

  // Nothing renders until we know who's signed in, otherwise the sign-in screen
  // flashes up for a moment on every load before the session resolves.
  if (authLoading) {
    return (
      <div className="app">
        <main className="app__main">
          <p className="empty">Loading…</p>
        </main>
      </div>
    )
  }

  if (!user) {
    return <SignIn onSignIn={signIn} onSignUp={signUp} />
  }

  return (
    <div className="app">
      <main className="app__main">
        {loading ? (
          <p className="empty">Loading…</p>
        ) : (
          <Dashboard
            tasks={tasks}
            onOpen={openTask}
            onNew={() => setDialog({ kind: 'create' })}
          />
        )}
      </main>

      <footer className="app__footer">
        <span>Signed in as {user.name}</span>
        <button type="button" className="link" onClick={() => void signOut()}>
          Sign out
        </button>
        <span className="app__footer-sep" aria-hidden="true">
          ·
        </span>
        <span>Demo build — data is stored on this device only.</span>
        <button type="button" className="link" onClick={handleReset}>
          Reset demo data
        </button>
      </footer>

      {dialog.kind === 'create' && <TaskForm onSubmit={handleCreate} onClose={close} />}

      {activeTask && dialog.kind === 'detail' && (
        <TaskDetail
          task={activeTask}
          onClose={close}
          onStatusChange={handleStatusChange}
          onEdit={() => setDialog({ kind: 'edit', taskId: activeTask.id })}
          onShare={() => setDialog({ kind: 'share', taskId: activeTask.id })}
          onDelete={handleDelete}
          onAddNote={(body) => void addNote(activeTask.id, body)}
          onRemoveNote={(noteId) => void removeNote(activeTask.id, noteId)}
        />
      )}

      {activeTask && dialog.kind === 'edit' && (
        <TaskForm
          task={activeTask}
          onSubmit={handleEdit}
          onClose={() => setDialog({ kind: 'detail', taskId: activeTask.id })}
        />
      )}

      {activeTask && dialog.kind === 'share' && (
        <ShareDialog
          task={activeTask}
          onClose={() => setDialog({ kind: 'detail', taskId: activeTask.id })}
          onInvite={handleInvite}
          onPermissionChange={(shareId, permission) =>
            void updateShare(activeTask.id, shareId, permission)
          }
          onRevoke={(shareId) => void removeShare(activeTask.id, shareId)}
        />
      )}
    </div>
  )
}
