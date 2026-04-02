'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type { User, WorkItem, Priority, WorkStatus } from '@/types'
import { suggestAssignees } from '@/utils/dependencyEngine'
import { Plus, X, Tag, UserCheck, FileText } from 'lucide-react'

interface WorkItemFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (item: Omit<WorkItem, 'id' | 'progress' | 'created_at' | 'updated_at' | 'blocked_reason' | 'progress_history'>) => void
  users: User[]
  items: WorkItem[]
  editItem?: WorkItem | null
}

export default function WorkItemForm({ isOpen, onClose, onSubmit, users, items, editItem }: WorkItemFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<WorkStatus>('in-progress')
  const [skillInput, setSkillInput] = useState('')
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [assignedTo, setAssignedTo] = useState('')

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title)
      setDescription(editItem.description)
      setPriority(editItem.priority)
      setStatus(editItem.status)
      setRequiredSkills([...editItem.required_skills])
      setAssignedTo(editItem.assigned_to)
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatus('in-progress')
      setRequiredSkills([])
      setAssignedTo('')
    }
  }, [editItem, isOpen])

  const suggestedAssignees = useMemo(() => {
    if (requiredSkills.length === 0) return []
    return suggestAssignees(requiredSkills, users, items)
  }, [requiredSkills, users, items])

  const handleAddSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !requiredSkills.includes(trimmed)) {
      setRequiredSkills([...requiredSkills, trimmed])
    }
    setSkillInput('')
  }

  const handleRemoveSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !assignedTo) return

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      required_skills: requiredSkills,
      assigned_to: assignedTo,
    })

    setTitle('')
    setDescription('')
    setPriority('medium')
    setStatus('in-progress')
    setRequiredSkills([])
    setAssignedTo('')
    setSkillInput('')
    onClose()
  }

  const handleClose = useCallback(() => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setStatus('in-progress')
    setRequiredSkills([])
    setAssignedTo('')
    setSkillInput('')
    onClose()
  }, [onClose])

  const modalRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    modalRef.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wi-modal-title"
    >
      <div ref={modalRef} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-brand-600" />
          </div>
          <h2 id="wi-modal-title" className="text-xl font-semibold text-surface-900">
            {editItem ? 'Edit Work Item' : 'Create Work Item'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="wi-title" className="mb-1.5 block text-sm font-medium text-surface-700">
              Title
            </label>
            <input
              id="wi-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
              placeholder="e.g. UI Design Mockups"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="wi-desc" className="mb-1.5 block text-sm font-medium text-surface-700">
              Description
            </label>
            <textarea
              id="wi-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 resize-none"
              placeholder="Brief description of the work item"
            />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="wi-priority" className="mb-1.5 block text-sm font-medium text-surface-700">
              Priority
            </label>
            <select
              id="wi-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="wi-status" className="mb-1.5 block text-sm font-medium text-surface-700">
              Initial Status
            </label>
            <select
              id="wi-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as WorkStatus)}
              className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 bg-white"
            >
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Required Skills */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">Required Skills</label>
            {requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 border border-brand-200"
                  >
                    <Tag className="w-3 h-3" />
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-0.5 text-brand-500 hover:text-brand-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
                className="flex-1 rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                placeholder="Type a skill and press Enter"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="rounded-xl bg-surface-100 px-3.5 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-200 transition-all duration-200 btn-press"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggested Assignees */}
          {suggestedAssignees.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-brand-500" />
                Suggested Assignees
              </label>
              <div className="rounded-xl border border-surface-200 bg-surface-50 p-2 space-y-1">
                {suggestedAssignees.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setAssignedTo(user.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                      assignedTo === user.id
                        ? 'bg-brand-100 text-brand-800 ring-1 ring-brand-300'
                        : 'hover:bg-white text-surface-700'
                    }`}
                  >
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-surface-500">{user.skills.join(', ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assign Member */}
          <div>
            <label htmlFor="wi-assignee" className="mb-1.5 block text-sm font-medium text-surface-700">
              Assign Member
            </label>
            <select
              id="wi-assignee"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              required
              className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 bg-white"
            >
              <option value="">Select a member</option>
              {users
                .filter((u) => u.role === 'member')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-surface-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-surface-300 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-all duration-200 btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-all duration-200 btn-press shadow-lg shadow-brand-600/20"
            >
              {editItem ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
