'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { WorkItem, Dependency, User, ProgressSnapshot } from '@/types'
import { User as UserIcon, Zap, ClipboardList, ArrowRight, LogOut } from 'lucide-react'
import TaskCard from '@/components/member/TaskCard'
import BlockingImpactView from '@/components/member/BlockingImpactView'

export default function MemberDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [items, setItems] = useState<WorkItem[]>([])
  const [deps, setDeps] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const [{ data: profileData }, { data: itemsData }, { data: depsData }] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('work_items').select('*').order('created_at', { ascending: true }),
        supabase.from('dependencies').select('*'),
      ])

      if (profileData) setCurrentUser(profileData as User)
      if (itemsData) setItems(itemsData as WorkItem[])
      if (depsData) setDeps(depsData as Dependency[])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateProgress = async (itemId: string, progress: number, snapshot: ProgressSnapshot) => {
    const status = progress === 100 ? 'done' : undefined
    const updateData: Record<string, unknown> = {
      progress,
      updated_at: new Date().toISOString(),
    }
    if (status) updateData.status = status

    const currentItem = items.find((i) => i.id === itemId)
    if (currentItem) {
      const existingHistory = (currentItem.progress_history || []) as ProgressSnapshot[]
      updateData.progress_history = [...existingHistory, snapshot]
    }

    const { error } = await supabase.from('work_items').update(updateData).eq('id', itemId)
    if (error) throw error
  }

  const handleUpdateBlocked = async (itemId: string, reason: string) => {
    const { error } = await supabase
      .from('work_items')
      .update({
        status: 'blocked',
        blocked_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
    if (error) throw error
  }

  const handleCascadeUpdate = async (updatedItems: WorkItem[]) => {
    const itemsToUpdate = updatedItems.filter(
      (item) => item.status !== items.find((i) => i.id === item.id)?.status
    )

    if (itemsToUpdate.length === 0) {
      await fetchData()
      return
    }

    const updates = itemsToUpdate.map((item) =>
      supabase
        .from('work_items')
        .update({ status: item.status, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    )

    await Promise.all(updates)
    setItems(updatedItems)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50">
        <header className="border-b border-surface-200 bg-white/80 backdrop-blur-xl px-6 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="skeleton h-6 w-48 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-6 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
                <div className="skeleton h-5 w-32 mb-4" />
                <div className="skeleton h-2 w-full mb-2" />
                <div className="skeleton h-10 w-full" />
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-surface-500">Unable to load profile.</p>
      </div>
    )
  }

  const myItems = items.filter((item) => item.assigned_to === currentUser.id)

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header -- Glass morphism */}
      <header className="sticky top-0 z-40 border-b border-surface-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-surface-900 leading-tight">
                Welcome, {currentUser.name}
              </h1>
              <p className="text-xs text-surface-500">Update your tasks and track progress</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-xl text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-all duration-200"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 p-6">
        {/* Your Tasks */}
        <section className="animate-slide-up">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList className="w-5 h-5 text-surface-500" />
            <h2 className="text-lg font-semibold text-surface-900">Your Tasks</h2>
            {myItems.length > 0 && (
              <span className="ml-1 px-2.5 py-0.5 rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {myItems.length}
              </span>
            )}
          </div>
          {myItems.length === 0 ? (
            <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-1">No tasks yet</h3>
              <p className="text-surface-500 text-sm">Your admin will assign tasks to you soon.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myItems.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <TaskCard
                    item={item}
                    onUpdateProgress={handleUpdateProgress}
                    onUpdateBlocked={handleUpdateBlocked}
                    onCascadeUpdate={handleCascadeUpdate}
                    fetchItems={async () => {
                      const { data } = await supabase.from('work_items').select('*')
                      return (data as WorkItem[]) || []
                    }}
                    fetchDeps={async () => {
                      const { data } = await supabase.from('dependencies').select('*')
                      return (data as Dependency[]) || []
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Blocking Others */}
        <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-5">
            <ArrowRight className="w-5 h-5 text-surface-500" />
            <h2 className="text-lg font-semibold text-surface-900">Blocking Others</h2>
          </div>
          <BlockingImpactView currentUserId={currentUser.id} />
        </section>
      </main>
    </div>
  )
}
