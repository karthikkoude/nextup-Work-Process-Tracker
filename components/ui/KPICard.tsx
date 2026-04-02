interface KPICardProps {
  label: string
  value: string | number
  color?: 'default' | 'muted'
  className?: string
}

const valueColorClasses: Record<string, string> = {
  default: 'text-ink-primary',
  muted: 'text-ink-muted',
}

function KPICard({ label, value, color = 'default', className = '' }: KPICardProps) {
  return (
    <div className={['bg-surface-card shadow-card rounded-md p-4', className].join(' ')}>
      <div className={['text-2xl tabular-nums font-bold', valueColorClasses[color]].join(' ')}>
        {value}
      </div>
      <div className="text-xs text-ink-muted uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}

export { KPICard }
