import TopNav from './TopNav'
import Sidebar from './Sidebar'

interface AdminShellProps {
  email: string
  children: React.ReactNode
}

export default function AdminShell({ email, children }: AdminShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <TopNav email={email} role="admin" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-surface-base px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
