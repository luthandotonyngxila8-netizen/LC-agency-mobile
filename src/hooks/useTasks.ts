import { useCallback, useEffect, useState } from 'react'
import type { Permission, Task, TaskDraft } from '../types'
import { taskStore } from '../lib/store'

/**
 * Single source of truth for the task list. Every mutation goes through the
 * store and then re-reads it, so switching the store to a remote backend
 * changes nothing here.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setTasks(await taskStore.list())
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const createTask = useCallback(
    async (draft: TaskDraft) => {
      const task = await taskStore.create(draft)
      await refresh()
      return task
    },
    [refresh],
  )

  const updateTask = useCallback(
    async (id: string, patch: Partial<TaskDraft>) => {
      const task = await taskStore.update(id, patch)
      await refresh()
      return task
    },
    [refresh],
  )

  const removeTask = useCallback(
    async (id: string) => {
      await taskStore.remove(id)
      await refresh()
    },
    [refresh],
  )

  const addShare = useCallback(
    async (taskId: string, invitee: string, permission: Permission) => {
      const task = await taskStore.addShare(taskId, invitee, permission)
      await refresh()
      return task
    },
    [refresh],
  )

  const updateShare = useCallback(
    async (taskId: string, shareId: string, permission: Permission) => {
      const task = await taskStore.updateShare(taskId, shareId, permission)
      await refresh()
      return task
    },
    [refresh],
  )

  const removeShare = useCallback(
    async (taskId: string, shareId: string) => {
      const task = await taskStore.removeShare(taskId, shareId)
      await refresh()
      return task
    },
    [refresh],
  )

  const addNote = useCallback(
    async (taskId: string, body: string) => {
      const task = await taskStore.addNote(taskId, body)
      await refresh()
      return task
    },
    [refresh],
  )

  const removeNote = useCallback(
    async (taskId: string, noteId: string) => {
      const task = await taskStore.removeNote(taskId, noteId)
      await refresh()
      return task
    },
    [refresh],
  )

  return {
    tasks,
    loading,
    refresh,
    createTask,
    updateTask,
    removeTask,
    addShare,
    updateShare,
    removeShare,
    addNote,
    removeNote,
  }
}
