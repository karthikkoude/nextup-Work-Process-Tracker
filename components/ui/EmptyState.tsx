import { type LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={['flex flex-col items-center text-center py-16 text-ink-muted', className].join(' ')}>
      <Icon className="w-12 h-12 mb-4 text-ink-faint" />
      <h3 className="text-sm font-semibold text-ink-primary mb-1">{title}</h3>
      <p className="text-xs text-ink-muted max-w-sm">{description}</p>
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
