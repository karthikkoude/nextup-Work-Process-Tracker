'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { WorkItem, Dependency, User } from '@/types'
import { cascadeStatusUpdate } from '@/utils/dependencyEngine'
import { LogOut, User as UserIcon, LayoutGrid, AlertTriangle, Clock, CheckCircle2, Package, Zap } from 'lucide-react'
import BottleneckBanner from '@/components/admin/BottleneckBanner'
import ProcessFlowDiagram from '@/components/admin/ProcessFlowDiagram'
import WorkloadTable from '@/components/admin/WorkloadTable'
import WorkItemForm from '@/components/admin/WorkItemForm'
import DependencyModal from '@/components/admin/DependencyModal'

const KPISkeleton = () => (
  <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
    <div className="skeleton h-4 w-20 mb-3" />
    <div className="skeleton h-8 w-16" />
  </div>
)

export default function AdminDashboard() {
  const [items, setItems] = useState<WorkItem[]>([])
  const [deps, setDeps] = useState<Dependency[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWorkItemForm, setShowWorkItemForm] = useState(false)
  const [showDependencyModal, setShowDependencyModal] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, depsRes, usersRes] = await Promise.all([
        supabase.from('work_items').select('*').order('created_at', { ascending: true }),
        supabase.from('dependencies').select('*'),
        supabase.from('users').select('*'),
      ])

      if (itemsRes.data) setItems(itemsRes.data as WorkItem[])
      if (depsRes.data) setDeps(depsRes.data as Dependency[])
      if (usersRes.data) setUsers(usersRes.data as User[])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const refreshWorkItemsWithCascade = useCallback(
    async (changedItemId?: string) => {
      try {
        const { data: itemsData } = await supabase
          .from('work_items')
          .select('*')
          .order('created_at', { ascending: true })

        if (!itemsData) return

        const freshItems = itemsData as WorkItem[]
        if (!changedItemId) {
          setItems(freshItems)
          return
        }

        const cascadedItems = cascadeStatusUpdate(changedItemId, freshItems, deps)
        setItems(cascadedItems)
      } catch (error) {
        console.error('Failed to refresh work items:', error)
      }
    },
    [supabase, deps]
  )

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profile) setCurrentUser(profile as User)
      }
    }
    fetchUser()
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const channel = supabase
      .channel('admin-work-items-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'work_items' },
        (payload) => {
          const changedItemId = typeof payload.new.id === 'string' ? payload.new.id : undefined
          void refreshWorkItemsWithCascade(changedItemId)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, refreshWorkItemsWithCascade])

  const handleCreateWorkItem = async (item: Omit<WorkItem, 'id' | 'progress' | 'created_at' | 'updated_at' | 'blocked_reason' | 'progress_history'>) => {
    const now = new Date().toISOString()
    const initialProgress = item.status === 'done' ? 100 : 0
    const { error } = await supabase.from('work_items').insert({
      ...item,
      progress: initialProgress,
      status: item.status,
      progress_history: [],
      created_at: now,
      updated_at: now,
    })

    if (!error) {
      await fetchData()
      setShowWorkItemForm(false)
    }
  }

  const handleCreateDependency = async (dep: Omit<Dependency, 'id'>) => {
    const { error } = await supabase.from('dependencies').insert(dep)
    if (!error) await fetchData()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const kpiTotal = items.length
  const kpiBlocked = items.filter((i) => i.status === 'blocked').length
  const kpiInProgress = items.filter((i) => i.status === 'in-progress').length
  const kpiDone = items.filter((i) => i.status === 'done').length

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50">
        <header className="border-b border-surface-200 bg-white/80 backdrop-blur-xl px-6 py-4">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div>
              <div className="skeleton h-6 w-40 mb-2" />
              <div className="skeleton h-4 w-64" />
            </div>
            <div className="flex gap-3">
              <div className="skeleton h-10 w-28" />
              <div className="skeleton h-10 w-32" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <KPISkeleton key={i} />)}
          </div>
          <div className="skeleton h-96 rounded-2xl" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header -- Glass morphism */}
      <header className="sticky top-0 z-40 border-b border-surface-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-surface-900 leading-tight">Admin Dashboard</h1>
                <p className="text-xs text-surface-500">Manage work items, dependencies, and team workload</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-100">
                <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5 text-brand-600" />
                </div>
                <span className="text-xs font-medium text-surface-700">{currentUser.name}</span>
              </div>
            )}
            <button
              onClick={() => setShowDependencyModal(true)}
              className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 hover:border-surface-400 transition-all duration-200 btn-press"
            >
              Add Dependency
            </button>
            <button
              onClick={() => setShowWorkItemForm(true)}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-all duration-200 btn-press shadow-lg shadow-brand-600/20"
            >
              Create Work Item
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-all duration-200"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* KPI Row -- Animated, icon-enhanced */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm card-hover animate-slide-up" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-surface-500">Total Items</p>
              <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-surface-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-surface-900 animate-count-up">{kpiTotal}</p>
          </div>
          <div className="rounded-2xl border border-danger-200 bg-gradient-to-br from-danger-50 to-white p-5 shadow-sm card-hover animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-danger-600">Blocked</p>
              <div className="w-9 h-9 rounded-xl bg-danger-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-danger-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-danger-700 animate-count-up">{kpiBlocked}</p>
          </div>
          <div className="rounded-2xl border border-warning-200 bg-gradient-to-br from-warning-50 to-white p-5 shadow-sm card-hover animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-warning-600">In Progress</p>
              <div className="w-9 h-9 rounded-xl bg-warning-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-warning-700 animate-count-up">{kpiInProgress}</p>
          </div>
          <div className="rounded-2xl border border-success-200 bg-gradient-to-br from-success-50 to-white p-5 shadow-sm card-hover animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-success-600">Done</p>
              <div className="w-9 h-9 rounded-xl bg-success-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-success-700 animate-count-up">{kpiDone}</p>
          </div>
        </div>

        {/* Bottleneck Banner */}
        <BottleneckBanner items={items} deps={deps} />

        {/* Process Flow Diagram */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-5 h-5 text-surface-500" />
            <h2 className="text-lg font-semibold text-surface-900">Process Flow</h2>
          </div>
          <ProcessFlowDiagram items={items} deps={deps} users={users} />
        </div>

        {/* Member Workload Table */}
        <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
          <WorkloadTable users={users} items={items} />
        </div>
      </main>

      {/* Modals */}
      <WorkItemForm
        isOpen={showWorkItemForm}
        onClose={() => setShowWorkItemForm(false)}
        onSubmit={handleCreateWorkItem}
        users={users}
        items={items}
      />

      <DependencyModal
        isOpen={showDependencyModal}
        onClose={() => setShowDependencyModal(false)}
        onSubmit={handleCreateDependency}
        items={items}
        existingDeps={deps}
      />
    </div>
  )
}
