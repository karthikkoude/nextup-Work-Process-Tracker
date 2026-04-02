import type { WorkStatus } from '@/types'

interface StatusChipProps {
  status: WorkStatus
}

const STATUS_STYLES: Record<WorkStatus, string> = {
  blocked: 'bg-danger-100 text-danger-800',
  'in-progress': 'bg-warning-100 text-warning-800',
  done: 'bg-success-100 text-success-800',
}

const STATUS_LABELS: Record<WorkStatus, string> = {
  blocked: 'Blocked',
  'in-progress': 'In Progress',
  done: 'Done',
}

const STATUS_DOTS: Record<WorkStatus, string> = {
  blocked: 'bg-danger-500',
  'in-progress': 'bg-warning-500',
  done: 'bg-success-500',
}

export default function StatusChip({ status }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-200 ${STATUS_STYLES[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  )
}
