import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { WorkItem } from '@/types'
import { PriorityBadge } from '@/components/ui/PriorityBadge'

// ─── Node Data Shape ───────────────────────────────────────────────
// The node.data carries the full WorkItem so the click handler can
// pass it directly to the side-panel without a lookup.
// We extend Record<string, unknown> to satisfy @xyflow/react v12 constraints.

export type FlowNodeData = WorkItem & Record<string, unknown>

export type FlowNode = Node<FlowNodeData, 'flowNode'>

// ─── Status → Tailwind Token Mapping ──────────────────────────────
// Uses the exact tokens from NESTUP_UI_WAVE.md design system.

const STATUS_BORDER: Record<WorkItem['status'], string> = {
  blocked: 'border-status-blocked',
  'in-progress': 'border-status-progressBorder',
  done: 'border-status-doneBorder',
}

const STATUS_BG: Record<WorkItem['status'], string> = {
  blocked: 'bg-status-blockedBg',
  'in-progress': 'bg-status-progressBg',
  done: 'bg-status-doneBg',
}

const STATUS_FILL: Record<WorkItem['status'], string> = {
  blocked: 'bg-status-blocked',
  'in-progress': 'bg-status-progress',
  done: 'bg-status-done',
}

// ─── Custom Node Component ─────────────────────────────────────────
// Most visually important component in the app.
// Displays: title, priority badge, assignee, progress bar.
// Handles: target=Left, source=Right (left-to-right dagre layout).

interface FlowNodeProps {
  onNodeClick?: (item: WorkItem) => void
}

const FlowNode = memo(
  ({ data, isConnectable, selected }: NodeProps<FlowNode> & FlowNodeProps) => {
    const { title, priority, progress, status, assigned_to } = data

    // Truncate title at 24 chars for consistent node sizing
    const displayTitle = title.length > 24 ? `${title.slice(0, 24)}…` : title

    // Resolve assignee name from the data (set by ProcessFlowDiagram)
    const assigneeName = (data as FlowNodeData & { assigneeName?: string }).assigneeName ?? 'Unassigned'

    return (
      <div
        className={[
          'w-48 rounded-md border-2 p-3 transition-shadow duration-200 cursor-pointer',
          STATUS_BORDER[status],
          STATUS_BG[status],
          selected ? 'shadow-panel ring-2 ring-brand ring-offset-1' : 'shadow-card',
          status === 'done' ? 'opacity-75' : '',
        ].join(' ')}
        role="button"
        tabIndex={0}
        aria-label={`Work item: ${title}, status: ${status}, progress: ${progress}%`}
      >
        {/* Target Handle — Left side (incoming dependencies) */}
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="!w-2.5 !h-2.5 !bg-surface-border !border-2 !border-white"
        />

        {/* Top: Title */}
        <div className="font-semibold text-sm text-ink-primary truncate mb-1.5" title={title}>
          {displayTitle}
        </div>

        {/* Middle: Priority Badge + Assignee */}
        <div className="flex items-center justify-between mb-2">
          <PriorityBadge priority={priority} />
          <span className="text-xs text-ink-muted truncate ml-2">{assigneeName}</span>
        </div>

        {/* Bottom: Progress Bar + Percentage */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-border h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${STATUS_FILL[status]}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-ink-muted tabular-nums shrink-0">
            {progress}%
          </span>
        </div>

        {/* Source Handle — Right side (outgoing dependencies) */}
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="!w-2.5 !h-2.5 !bg-surface-border !border-2 !border-white"
        />
      </div>
    )
  }
)

FlowNode.displayName = 'FlowNode'

export default FlowNode
