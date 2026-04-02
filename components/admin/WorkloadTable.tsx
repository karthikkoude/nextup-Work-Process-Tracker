'use client'

import type { User, WorkItem } from '@/types'
import { getWorkloadScore } from '@/utils/dependencyEngine'
import { Users, TrendingUp, AlertTriangle } from 'lucide-react'

interface WorkloadTableProps {
  users: User[]
  items: WorkItem[]
}

const OVERLOAD_THRESHOLD = 15

export default function WorkloadTable({ users, items }: WorkloadTableProps) {
  const members = users.filter((u) => u.role === 'member')

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-surface-200 bg-surface-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-surface-500" />
            <h3 className="text-lg font-semibold text-surface-900">Member Workload</h3>
          </div>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-surface-400" />
          </div>
          <h3 className="text-base font-semibold text-surface-900 mb-1">No members found</h3>
          <p className="text-sm text-surface-500">Add members to see their workload distribution.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-surface-200 bg-surface-50 px-6 py-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-surface-500" />
          <h3 className="text-lg font-semibold text-surface-900">Member Workload</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="px-6 py-3.5 font-semibold text-surface-600 text-xs uppercase tracking-wider">Name</th>
              <th className="px-6 py-3.5 font-semibold text-surface-600 text-xs uppercase tracking-wider">Skills</th>
              <th className="px-6 py-3.5 font-semibold text-surface-600 text-xs uppercase tracking-wider text-center">Active Tasks</th>
              <th className="px-6 py-3.5 font-semibold text-surface-600 text-xs uppercase tracking-wider text-center">Workload Score</th>
              <th className="px-6 py-3.5 font-semibold text-surface-600 text-xs uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const score = getWorkloadScore(member.id, items)
              const activeTasks = items.filter(
                (item) => item.assigned_to === member.id && item.status !== 'done'
              )
              const isOverloaded = score > OVERLOAD_THRESHOLD

              return (
                <tr key={member.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50/50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                        isOverloaded
                          ? 'bg-danger-100 text-danger-700'
                          : score >= 10
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-brand-100 text-brand-700'
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-surface-900">{member.name}</span>
                        {isOverloaded && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3 text-danger-500" />
                            <span className="text-xs font-medium text-danger-600">Overloaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {member.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 text-sm font-semibold text-surface-700">
                      {activeTasks.length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-bold ${
                        isOverloaded
                          ? 'bg-danger-100 text-danger-700'
                          : score >= 10
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-success-100 text-success-700'
                      }`}
                    >
                      {score}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        isOverloaded
                          ? 'bg-danger-100 text-danger-800'
                          : activeTasks.length === 0
                          ? 'bg-surface-100 text-surface-600'
                          : 'bg-success-100 text-success-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isOverloaded
                          ? 'bg-danger-500'
                          : activeTasks.length === 0
                          ? 'bg-surface-400'
                          : 'bg-success-500'
                      }`} />
                      {isOverloaded ? 'Overloaded' : activeTasks.length === 0 ? 'Available' : 'Active'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
