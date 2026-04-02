import { type WorkStatus } from '@/types'
import { XCircle, Clock, CheckCircle } from 'lucide-react'

interface StatusChipProps {
  status: WorkStatus
  className?: string
}

const statusConfig: Record<WorkStatus, { classes: string; icon: React.ReactNode; label: string }> = {
  blocked: {
    classes: 'bg-status-blockedBg border-status-blockedBorder text-status-blocked',
    icon: <XCircle className="w-3 h-3 mr-1" />,
    label: 'Blocked',
  },
  'in-progress': {
    classes: 'bg-status-progressBg border-status-progressBorder text-status-progress',
    icon: <Clock className="w-3 h-3 mr-1" />,
    label: 'In Progress',
  },
  done: {
    classes: 'bg-status-doneBg border-status-doneBorder text-status-done',
    icon: <CheckCircle className="w-3 h-3 mr-1" />,
    label: 'Done',
  },
}

function StatusChip({ status, className = '' }: StatusChipProps) {
  const config = statusConfig[status]

  return (
    <span
      className={[
        'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium border',
        config.classes,
        className,
      ].join(' ')}
    >
      {config.icon}
      {config.label}
    </span>
  )
}

export { StatusChip }
