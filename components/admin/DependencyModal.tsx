'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type { WorkItem, Dependency, DependencyType } from '@/types'
import { hasCycle } from '@/utils/dependencyEngine'
import { AlertTriangle, X, ArrowRight, Link2 } from 'lucide-react'

interface DependencyModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dep: Omit<Dependency, 'id'>) => void
  items: WorkItem[]
  existingDeps: Dependency[]
}

export default function DependencyModal({ isOpen, onClose, onSubmit, items, existingDeps }: DependencyModalProps) {
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [type, setType] = useState<DependencyType>('partial')
  const [threshold, setThreshold] = useState(50)
  const [cycleError, setCycleError] = useState<string | null>(null)

  const resetForm = () => {
    setFromId('')
    setToId('')
    setType('partial')
    setThreshold(50)
    setCycleError(null)
  }

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromId || !toId) return

    if (fromId === toId) {
      setCycleError('⚠ A task cannot depend on itself.')
      return
    }

    const proposed: Dependency = {
      id: 'temp',
      from_id: fromId,
      to_id: toId,
      type,
      threshold: type === 'full' ? 100 : threshold,
    }

    const result = hasCycle(existingDeps, proposed)
    if (result.hasCycle) {
      const resolvedPath = result.cyclePath
        .split(' → ')
        .map((uuid) => items.find((i) => i.id === uuid.trim())?.title ?? uuid.trim())
        .join(' → ')
      const fromTitle = items.find((i) => i.id === fromId)?.title ?? fromId
      const toTitle = items.find((i) => i.id === toId)?.title ?? toId
      setCycleError(
        `⚠ Circular dependency detected: ${fromTitle} → ${toTitle} → ${resolvedPath}. Rejected.`
      )
      return
    }

    setCycleError(null)
    onSubmit({
      from_id: fromId,
      to_id: toId,
      type,
      threshold: type === 'full' ? 100 : threshold,
    })
    handleClose()
  }

  const modalRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose()
  }, [handleClose])

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
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dep-modal-title"
    >
      <div ref={modalRef} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-brand-600" />
          </div>
          <h2 id="dep-modal-title" className="text-xl font-semibold text-surface-900">Add Dependency</h2>
        </div>

        {/* Inline cycle error banner */}
        {cycleError && (
          <div className="mb-4 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800 flex items-start gap-3 animate-slide-down">
            <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{cycleError}</span>
            <button
              onClick={() => setCycleError(null)}
              className="text-danger-500 hover:text-danger-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* From Item */}
            <div>
              <label htmlFor="dep-from" className="mb-1.5 block text-sm font-medium text-surface-700">
                From Item
              </label>
              <select
                id="dep-from"
                value={fromId}
                onChange={(e) => {
                  setFromId(e.target.value)
                  setCycleError(null)
                }}
                required
                className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 bg-white"
              >
                <option value="">Select predecessor</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            {/* To Item */}
            <div>
              <label htmlFor="dep-to" className="mb-1.5 block text-sm font-medium text-surface-700">
                To Item
              </label>
              <select
                id="dep-to"
                value={toId}
                onChange={(e) => {
                  setToId(e.target.value)
                  setCycleError(null)
                }}
                required
                className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 bg-white"
              >
                <option value="">Select successor</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id} disabled={item.id === fromId}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visual Preview */}
          {fromId && toId && (
            <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface-50 border border-surface-200">
              <span className="text-sm font-medium text-surface-700 truncate max-w-[120px]">
                {items.find(i => i.id === fromId)?.title}
              </span>
              <ArrowRight className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-medium text-surface-700 truncate max-w-[120px]">
                {items.find(i => i.id === toId)?.title}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">
                {type === 'full' ? 'Full' : `${threshold}%`}
              </span>
            </div>
          )}

          {/* Type */}
          <div>
            <label htmlFor="dep-type" className="mb-1.5 block text-sm font-medium text-surface-700">
              Type
            </label>
            <select
              id="dep-type"
              value={type}
              onChange={(e) => {
                const newType = e.target.value as DependencyType
                setType(newType)
                if (newType === 'full') setThreshold(100)
              }}
              className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 bg-white"
            >
              <option value="partial">Partial (threshold-based)</option>
              <option value="full">Full (requires 100%)</option>
            </select>
          </div>

          {/* Threshold */}
          <div>
            <label htmlFor="dep-threshold" className="mb-1.5 block text-sm font-medium text-surface-700">
              Threshold {type === 'full' && <span className="text-surface-400 font-normal">(locked at 100)</span>}
            </label>
            <input
              id="dep-threshold"
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Math.min(100, Math.max(0, Number(e.target.value))))}
              disabled={type === 'full'}
              className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 disabled:bg-surface-100 disabled:text-surface-400"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-surface-200">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-surface-300 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-all duration-200 btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-all duration-200 btn-press shadow-lg shadow-brand-600/20"
            >
              Add Dependency
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
