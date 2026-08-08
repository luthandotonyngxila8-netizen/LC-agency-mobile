import { useState } from 'react'
import type { Permission, Task, TaskDraft, TaskStatus } from './types'
import { useTasks } from './hooks/useTasks'
import { useAuth } from './hooks/useAuth'
import { demoDataIsStale, resetDemoData } from './lib/store'
import { plural } from './lib/progress'
import { Confirm, type ConfirmRequest } from './components/Confirm'
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
  /** Creating a part inside an existing project. */
  | { kind: 'create-sub'; taskId: string }
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
  // Confirmations sit outside `dialog` so one can be asked over a task pop-up
  // without closing it — cancelling has to leave you where you were.
  const [confirming, setConfirming] = useState<ConfirmRequest | null>(null)

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

  /** The project an open sub-project belongs to, if it is one. */
  const parentOf = (task: Task | undefined) =>
    task?.parentId ? tasks.find((candidate) => candidate.id === task.parentId) : undefined

  const handleDelete = () => {
    if (!activeTask) return
    const task = activeTask
    // Deleting a project takes its parts with it, so name them rather than
    // letting them disappear behind a generic question.
    const parts = tasks.filter((candidate) => candidate.parentId === task.id).length

    setConfirming({
      title: `Delete “${task.title}”?`,
      body:
        parts > 0
          ? `This also deletes the ${parts} ${plural(parts, 'part')} inside it, with their notes and history. It can't be undone.`
          : "Its notes and history go with it. This can't be undone.",
      confirmLabel: parts > 0 ? `Delete all ${parts + 1}` : 'Delete',
      destructive: true,
      onConfirm: () => {
        void removeTask(task.id).then(() => {
          // Deleting a part puts you back in the project you were working in,
          // rather than dropping you out to the dashboard having lost your place.
          if (task.parentId) setDialog({ kind: 'detail', taskId: task.parentId })
          else close()
        })
      },
    })
  }

  const handleInvite = async (invitee: string, permission: Permission) => {
    if (!activeTask) return
    await addShare(activeTask.id, invitee, permission)
  }

  const handleReset = () => {
    setConfirming({
      title: 'Reset the demo?',
      body: 'Every task you have added or changed is discarded and the sample tasks come back.',
      confirmLabel: 'Reset',
      destructive: true,
      onConfirm: () => {
        resetDemoData()
        window.location.reload()
      },
    })
  }

  const openTask = (task: Task) => setDialog({ kind: 'detail', taskId: task.id })

  // Read once on mount: this only changes when the demo is reset, which
  // reloads the page anyway.
  const [staleDemo] = useState(demoDataIsStale)

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
      {/*
        Only shown when the samples are out of date *and* the person has added
        something worth keeping, so it can't be replaced for them. Silence here
        is what let a client review a week-old version of the app.
      */}
      {staleDemo && (
        <div className="update-bar" role="status">
          <span>This demo has been updated since you last opened it.</span>
          <button type="button" className="link" onClick={handleReset}>
            Load the latest
          </button>
        </div>
      )}

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

      {activeTask && dialog.kind === 'create-sub' && (
        <TaskForm
          parent={activeTask}
          onSubmit={handleCreate}
          onClose={() => setDialog({ kind: 'detail', taskId: activeTask.id })}
        />
      )}

      {activeTask && dialog.kind === 'detail' && (
        <TaskDetail
          task={activeTask}
          tasks={tasks}
          onClose={close}
          onStatusChange={handleStatusChange}
          onEdit={() => setDialog({ kind: 'edit', taskId: activeTask.id })}
          onShare={() => setDialog({ kind: 'share', taskId: activeTask.id })}
          onDelete={handleDelete}
          onAddNote={(body) => void addNote(activeTask.id, body)}
          onRemoveNote={(noteId) => void removeNote(activeTask.id, noteId)}
          onOpenTask={openTask}
          onAddSubProject={() => setDialog({ kind: 'create-sub', taskId: activeTask.id })}
        />
      )}

      {activeTask && dialog.kind === 'edit' && (
        <TaskForm
          task={activeTask}
          parent={parentOf(activeTask)}
          parts={tasks.filter((task) => task.parentId === activeTask.id)}
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

      {/* Last, so it stacks over whichever pop-up asked for it. */}
      {confirming && (
        <Confirm request={confirming} onClose={() => setConfirming(null)} />
      )}
    </div>
  )
}
