'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

interface BlockingImpactViewProps {
  currentUserId: string
}

interface BlockingImpactRow {
  dependency_id: string
  from_id: string
  to_id: string
  downstream_title: string
  dependency_type: 'partial' | 'full'
  threshold: number
  predecessor_progress: number
  progress_needed: number
}

export default function BlockingImpactView({
  currentUserId,
}: BlockingImpactViewProps) {
  const [blockedDownstream, setBlockedDownstream] = useState<BlockingImpactRow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchBlockingImpact = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_member_blocking_impact')
      if (error) throw error
      setBlockedDownstream((data ?? []) as BlockingImpactRow[])
    } catch (error) {
      console.error('Failed to load blocking impact:', error)
      setBlockedDownstream([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchBlockingImpact()
  }, [fetchBlockingImpact, currentUserId])

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    refreshTimerRef.current = setTimeout(() => {
      void fetchBlockingImpact()
      refreshTimerRef.current = null
    }, 150)
  }, [fetchBlockingImpact])

  useEffect(() => {
    const channel = supabase
      .channel(`member-blocking-impact-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'work_items' },
        () => {
          scheduleRefresh()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dependencies' },
        () => {
          scheduleRefresh()
        }
      )
      .subscribe()

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      void supabase.removeChannel(channel)
    }
  }, [supabase, currentUserId, scheduleRefresh])

  if (loading) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <div className="skeleton h-4 w-48 mb-3" />
        <div className="skeleton h-4 w-64" />
      </div>
    )
  }

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
      {blockedDownstream.map((impact) => (
        <div
          key={impact.dependency_id}
          className="rounded-xl border p-4 transition-all duration-200 card-hover border-danger-200 bg-gradient-to-r from-danger-50/50 to-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-danger-100">
                <AlertCircle className="w-4 h-4 text-danger-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900">
                  {impact.downstream_title}
                </p>
                <p className="mt-0.5 text-xs text-surface-500 flex items-center gap-1">
                  <span className="inline-block w-3 h-px bg-surface-300" />
                  {impact.dependency_type === 'full' ? 'Full' : `Partial (${impact.threshold}%)`} dependency
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-danger-100 px-3 py-1.5 text-xs font-semibold text-danger-700">
                <ArrowRight className="w-3 h-3" />
                Needs {impact.progress_needed}% more
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
