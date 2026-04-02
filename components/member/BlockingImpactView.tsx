'use client'

import type { Dependency, WorkItem } from '@/types'
import { isItemBlocked } from '@/utils/dependencyEngine'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

interface BlockingImpactViewProps {
  currentUserId: string
  items: WorkItem[]
  deps: Dependency[]
}

export default function BlockingImpactView({
  currentUserId,
  items,
  deps,
}: BlockingImpactViewProps) {
  const userItemIds = items
    .filter((item) => item.assigned_to === currentUserId)
    .map((item) => item.id)

  const blockedDownstream = deps
    .filter((dep) => userItemIds.includes(dep.from_id))
    .map((dep) => {
      const downstreamItem = items.find((item) => item.id === dep.to_id)
      const predecessorItem = items.find((item) => item.id === dep.from_id)
      if (!downstreamItem || !predecessorItem) return null

      const stillBlocked = isItemBlocked(downstreamItem.id, items, deps)
      const progressNeeded = Math.max(0, dep.threshold - predecessorItem.progress)

      return {
        downstreamItem,
        dep,
        stillBlocked,
        progressNeeded,
      }
    })
    .filter(Boolean) as {
    downstreamItem: WorkItem
    dep: Dependency
    stillBlocked: boolean
    progressNeeded: number
  }[]

  if (blockedDownstream.length === 0) {
    return (
      <div className="rounded-2xl border border-success-200 bg-gradient-to-br from-success-50 to-white p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-success-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-success-600" />
        </div>
        <h3 className="text-base font-semibold text-success-800 mb-1">All clear!</h3>
        <p className="text-sm text-success-600">
          You are not blocking any tasks right now 🎉
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {blockedDownstream.map(({ downstreamItem, dep, stillBlocked, progressNeeded }) => (
        <div
          key={dep.id}
          className={`rounded-xl border p-4 transition-all duration-200 card-hover ${
            stillBlocked
              ? 'border-danger-200 bg-gradient-to-r from-danger-50/50 to-white'
              : 'border-success-200 bg-gradient-to-r from-success-50/50 to-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                stillBlocked ? 'bg-danger-100' : 'bg-success-100'
              }`}>
                {stillBlocked ? (
                  <AlertCircle className="w-4 h-4 text-danger-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-success-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900">
                  {downstreamItem.title}
                </p>
                <p className="mt-0.5 text-xs text-surface-500 flex items-center gap-1">
                  <span className="inline-block w-3 h-px bg-surface-300" />
                  {dep.type === 'full' ? 'Full' : `Partial (${dep.threshold}%)`} dependency
                </p>
              </div>
            </div>
            <div className="text-right">
              {stillBlocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-danger-100 px-3 py-1.5 text-xs font-semibold text-danger-700">
                  <ArrowRight className="w-3 h-3" />
                  Needs {progressNeeded}% more
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-100 px-3 py-1.5 text-xs font-semibold text-success-700">
                  <CheckCircle2 className="w-3 h-3" />
                  Unblocked
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
