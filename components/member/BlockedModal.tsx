'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'

interface BlockedModalProps {
  itemTitle: string
  onSubmit: (reason: string) => Promise<void>
  onClose: () => void
}

export default function BlockedModal({
  itemTitle,
  onSubmit,
  onClose,
}: BlockedModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(reason.trim())
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    modalRef.current?.querySelector<HTMLElement>('input, textarea, button')?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blocked-modal-title"
    >
      <div ref={modalRef} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-danger-600" />
          </div>
          <div>
            <h2 id="blocked-modal-title" className="text-lg font-semibold text-surface-900">
              Mark as Blocked
            </h2>
            <p className="text-sm text-surface-500">
              Why is &quot;{itemTitle}&quot; blocked?
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe what is blocking this task..."
            rows={4}
            required
            className="mb-4 w-full rounded-xl border border-surface-300 px-4 py-3 text-sm text-surface-900 placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 resize-none"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-all duration-200 disabled:opacity-50 btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="rounded-xl bg-danger-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-danger-700 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 btn-press flex items-center gap-2 shadow-lg shadow-danger-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Mark Blocked'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
