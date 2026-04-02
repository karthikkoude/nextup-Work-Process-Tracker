'use client'

import { useState, useCallback } from 'react'
import type { Dependency, WorkItem } from '@/types'
import { cascadeStatusUpdate, estimateCompletion } from '@/utils/dependencyEngine'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { StatusChip } from '@/components/ui/StatusChip'
import BlockedModal from './BlockedModal'
import { Timer, AlertCircle } from 'lucide-react'

interface TaskCardProps {
  item: WorkItem
  onUpdateProgress: (itemId: string, progress: number, snapshot: { progress: number; timestamp: string }) => Promise<void>
  onUpdateBlocked: (itemId: string, reason: string) => Promise<void>
  onCascadeUpdate: (updatedItems: WorkItem[]) => Promise<void>
  fetchItems: () => Promise<WorkItem[]>
  fetchDeps: () => Promise<Dependency[]>
}

export default function TaskCard({
  item,
  onUpdateProgress,
  onUpdateBlocked,
  onCascadeUpdate,
  fetchItems,
  fetchDeps,
}: TaskCardProps) {
  const [localProgress, setLocalProgress] = useState(item.progress)
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSliderChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newProgress = parseInt(e.target.value, 10)
      setLocalProgress(newProgress)
    },
    []
  )

  const handleSliderCommit = useCallback(async () => {
    if (isUpdating) return
    setIsUpdating(true)

    try {
      const snapshot = { progress: localProgress, timestamp: new Date().toISOString() }
      await onUpdateProgress(item.id, localProgress, snapshot)

      const [freshItems, deps] = await Promise.all([fetchItems(), fetchDeps()])

      const cascadedItems = cascadeStatusUpdate(item.id, freshItems, deps)

      const finalItems = cascadedItems.map((cascaded) => {
        if (cascaded.id === item.id) {
          return { ...cascaded, progress: localProgress }
        }
        return cascaded
      })

      await onCascadeUpdate(finalItems)
    } catch (error) {
      console.error('Cascade update failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [
    item.id,
    localProgress,
    isUpdating,
    onUpdateProgress,
    fetchItems,
    fetchDeps,
    onCascadeUpdate,
  ])

  const handleBlockedSubmit = useCallback(
    async (reason: string) => {
      await onUpdateBlocked(item.id, reason)
      setShowBlockedModal(false)
    },
    [item.id, onUpdateBlocked]
  )

  const estDays = estimateCompletion({ ...item, progress: localProgress })

  // Progress fill color via CSS custom properties mapped to design tokens
  const progressFill = localProgress === 100
    ? 'var(--color-status-done)'
    : 'var(--color-status-progress)'
  const progressTrack = 'var(--color-surface-border)'

  return (
    <>
      <div className={`rounded-md border p-5 transition-shadow duration-200 ${
        item.status === 'blocked'
          ? 'border-status-blockedBorder bg-status-blockedBg shadow-card'
          : item.status === 'done'
          ? 'border-status-doneBorder bg-status-doneBg shadow-card opacity-75'
          : 'border-surface-border bg-surface-card shadow-card'
      }`}>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-sm font-semibold text-ink-primary leading-snug">{item.title}</h3>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <PriorityBadge priority={item.priority} />
            <StatusChip status={item.status} />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
            <span className="font-medium">Progress</span>
            <span className={`font-bold tabular-nums ${
              localProgress === 100 ? 'text-status-done' : 'text-ink-body'
            }`}>
              {localProgress}%
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={100}
              value={localProgress}
              onChange={handleSliderChange}
              onMouseUp={handleSliderCommit}
              onTouchEnd={handleSliderCommit}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  handleSliderCommit()
                }
              }}
              disabled={item.status === 'done' || isUpdating}
              className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: `linear-gradient(to right, ${progressFill} 0%, ${progressFill} ${localProgress}%, ${progressTrack} ${localProgress}%, ${progressTrack} 100%)`,
              }}
            />
          </div>
          {item.status !== 'done' && estDays !== null && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
              <Timer className="w-3.5 h-3.5" />
              {estDays < 1 ? (
                <span className="font-medium text-status-done">Est. &lt;1 day</span>
              ) : (
                <span>Est. {estDays} {estDays === 1 ? 'day' : 'days'}</span>
              )}
            </div>
          )}
        </div>

        {item.status !== 'done' && (
          <button
            type="button"
            onClick={() => setShowBlockedModal(true)}
            className="w-full rounded border border-surface-border bg-surface-card px-3 py-2 text-xs font-medium text-ink-body hover:bg-status-blockedBg hover:text-status-blocked hover:border-status-blockedBorder transition-colors duration-200 flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Mark as Blocked
          </button>
        )}
      </div>

      {showBlockedModal && (
        <BlockedModal
          itemTitle={item.title}
          onSubmit={handleBlockedSubmit}
          onClose={() => setShowBlockedModal(false)}
        />
      )}
    </>
  )
}
