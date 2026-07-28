export type TaskStatus = 'not_started' | 'in_progress' | 'done'

/** Google-Docs-style tiers, deliberately kept to three. */
export type Permission = 'view' | 'comment' | 'edit'

export interface Share {
  id: string
  /** Email or name of the helper the task was shared with. */
  invitee: string
  permission: Permission
  /** ISO timestamp. */
  invitedAt: string
  /** Demo-only opaque token that stands in for a real share link. */
  linkToken: string
}

export interface Task {
  id: string
  title: string
  description: string
  /** Definition of done — what "finished" actually looks like. */
  endState: string
  /** ISO date, yyyy-MM-dd. */
  startDate: string
  /** ISO date, yyyy-MM-dd. */
  endDate: string
  status: TaskStatus
  createdAt: string
  updatedAt: string
  shares: Share[]
}

/** Everything a caller supplies when creating a task; the rest is derived. */
export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'shares'>

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  view: 'Can view',
  comment: 'Can comment',
  edit: 'Can edit',
}

export const PERMISSION_HINTS: Record<Permission, string> = {
  view: 'Reads the task and its timeline. Changes nothing.',
  comment: 'Reads the task and leaves comments. Cannot change fields.',
  edit: 'Updates the description, dates and status of this task only.',
}
