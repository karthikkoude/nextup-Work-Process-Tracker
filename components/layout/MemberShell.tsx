import TopNav from './TopNav'

interface MemberShellProps {
  email: string
  children: React.ReactNode
}

export default function MemberShell({ email, children }: MemberShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <TopNav email={email} role="member" />
      <main className="max-w-3xl mx-auto px-6 py-6 bg-surface-base flex-1">
        {children}
      </main>
    </div>
  )
}
