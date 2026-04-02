export type UserRole = 'admin' | 'member'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type WorkStatus = 'blocked' | 'in-progress' | 'done'

export type DependencyType = 'partial' | 'full'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  skills: string[]
}

export interface ProgressSnapshot {
  progress: number
  timestamp: string
}

export interface WorkItem {
  id: string
  title: string
  description: string
  priority: Priority
  progress: number
  status: WorkStatus
  assigned_to: string
  required_skills: string[]
  blocked_reason?: string
  progress_history: ProgressSnapshot[]
  created_at: string
  updated_at: string
}

export interface Dependency {
  id: string
  from_id: string
  to_id: string
  type: DependencyType
  threshold: number
}
