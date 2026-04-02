'use client'

import { LogOut } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface TopNavProps {
  email: string
  role: 'admin' | 'member'
}

export default function TopNav({ email, role }: TopNavProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="h-14 px-6 flex items-center justify-between bg-surface-card border-b border-surface-border sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="NestUp logo"
        >
          <rect width="28" height="28" rx="6" fill="var(--color-brand)" />
          <path
            d="M8 20V8L14 16L20 8V20"
            stroke="var(--color-ink-inverse)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-semibold text-ink-primary tracking-tight">
          NestUp
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-muted">{email}</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
              role === 'admin'
                ? 'bg-brand-subtle text-brand'
                : 'bg-surface-offset text-ink-muted'
            }`}
          >
            {role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-ink-muted hover:bg-surface-hover hover:text-ink-body rounded transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  )
}
