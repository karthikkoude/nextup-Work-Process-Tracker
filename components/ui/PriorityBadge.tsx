import { type Priority } from '@/types'

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

const priorityClasses: Record<Priority, string> = {
  critical: 'bg-priority-criticalBg text-priority-critical border border-priority-criticalBorder',
  high: 'bg-priority-highBg text-priority-high border border-priority-highBorder',
  medium: 'bg-priority-mediumBg text-priority-medium border border-priority-mediumBorder',
  low: 'bg-priority-lowBg text-priority-low border border-priority-lowBorder',
}

function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5',
        'text-xs font-semibold uppercase tracking-wide',
        priorityClasses[priority],
        className,
      ].join(' ')}
    >
      {priority}
    </span>
  )
}

export { PriorityBadge }
