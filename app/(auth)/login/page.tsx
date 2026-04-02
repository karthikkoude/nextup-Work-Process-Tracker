import LoginForm from '@/components/auth/LoginForm'
import { Shield, Zap, Users } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Zap className="w-6 h-6 text-brand-200" />
            </div>
            <span className="text-2xl font-bold tracking-tight">NestUp</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            Work Process<br />
            <span className="text-brand-200">Tracker</span>
          </h1>
          <p className="text-lg text-brand-100/80 mb-12 max-w-md leading-relaxed">
            Manage tasks with intelligent dependency chains. See bottlenecks before they block your team.
          </p>

          {/* Feature List */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-brand-200" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Smart Dependencies</h3>
                <p className="text-sm text-brand-100/70">Auto-block and unblock tasks based on progress thresholds</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-brand-200" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Team Workload Balance</h3>
                <p className="text-sm text-brand-100/70">Track member capacity and prevent overload before it happens</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-brand-200" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Real-time Updates</h3>
                <p className="text-sm text-brand-100/70">Live dashboard syncs instantly when team members update progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-surface-50 px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900">NestUp</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-surface-900">Welcome back</h2>
            <p className="mt-2 text-surface-500">Sign in to your account to continue</p>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-8 shadow-lg shadow-surface-200/50">
            <LoginForm />
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
            <p className="text-xs font-semibold text-brand-800 mb-2 uppercase tracking-wide">Demo Credentials</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <code className="text-brand-700 bg-brand-100/50 px-2 py-0.5 rounded font-mono text-xs">admin@nestup.com</code>
                <span className="text-brand-600 text-xs font-medium">Admin</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <code className="text-brand-700 bg-brand-100/50 px-2 py-0.5 rounded font-mono text-xs">alex@nestup.com</code>
                <span className="text-brand-600 text-xs font-medium">Member</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-brand-600">Password: <code className="font-mono bg-brand-100/50 px-1.5 py-0.5 rounded">Demo1234!</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
