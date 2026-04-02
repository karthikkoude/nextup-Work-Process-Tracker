'use client'

import { useState } from 'react'
import type { WorkItem, Dependency } from '@/types'
import { detectBottlenecks } from '@/utils/dependencyEngine'
import { AlertTriangle, X } from 'lucide-react'

interface BottleneckBannerProps {
  items: WorkItem[]
  deps: Dependency[]
}

export default function BottleneckBanner({ items, deps }: BottleneckBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
  }

  const bottlenecks = detectBottlenecks(items, deps)

  if (dismissed || bottlenecks.length === 0) return null

  return (
    <div className="rounded-2xl border border-danger-200 bg-gradient-to-r from-danger-50 to-white px-6 py-4 animate-slide-down shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-danger-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-danger-800 mb-1">Bottleneck Alert</h3>
            <p className="text-sm text-danger-700">
              {bottlenecks.length === 1
                ? (
                  <span>
                    <strong className="font-semibold">{bottlenecks[0].title}</strong> is blocking multiple downstream tasks and is not yet complete.
                  </span>
                )
                : (
                  <span>
                    The following items are blocking multiple downstream tasks:{' '}
                    {bottlenecks.map((b) => (
                      <strong key={b.id} className="font-semibold">{b.title}</strong>
                    )).reduce((prev, curr, i) => (
                      <>
                        {prev}{i > 0 && i < bottlenecks.length - 1 ? ', ' : ''}
                        {i === bottlenecks.length - 1 && bottlenecks.length > 1 ? ' and ' : ''}
                        {curr}
                      </>
                    ))}.
                  </span>
                )}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 p-1.5 rounded-lg text-danger-400 hover:text-danger-600 hover:bg-danger-100 transition-all duration-200"
          aria-label="Dismiss bottleneck alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
