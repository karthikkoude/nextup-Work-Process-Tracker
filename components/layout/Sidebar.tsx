'use client'

import { LayoutDashboard, ListTodo, GitBranch, Users } from 'lucide-react'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Work Items', href: '/admin?tab=items', icon: ListTodo },
  { label: 'Dependencies', href: '/admin?tab=deps', icon: GitBranch },
  { label: 'Team', href: '/admin?tab=team', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-surface-card border-r border-surface-border flex flex-col h-[calc(100vh-3.5rem)]">
      <nav className="flex-1 py-4">
        <ul className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/admin' && !pathname.includes('?'))
            const Icon = item.icon

            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-subtle text-brand border-r-2 border-brand font-medium'
                      : 'text-ink-muted hover:bg-surface-hover hover:text-ink-body'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-4 py-3 border-t border-surface-border">
        <span className="text-xs text-ink-faint">v0.1.0</span>
      </div>
    </aside>
  )
}
