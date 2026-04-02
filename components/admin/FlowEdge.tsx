import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react'
import type { DependencyType } from '@/types'

// ─── Edge Data Shape ───────────────────────────────────────────────
// Carries the dependency type and threshold for label rendering.

export interface FlowEdgeData extends Record<string, unknown> {
  depType: DependencyType
  threshold: number
}

export type FlowEdge = Edge<FlowEdgeData, 'flowEdge'>

// ─── Custom Edge Component ─────────────────────────────────────────
// Renders dependency edges with visual distinction:
// - Full: solid line, ink-muted color
// - Partial: dashed line, lighter color
// Label shows "Full" or "Partial X%" as a small pill.

const FlowEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
  }: EdgeProps<FlowEdge>) => {
    const depType = data?.depType ?? 'full'
    const threshold = data?.threshold ?? 100

    const isPartial = depType === 'partial'

    // Calculate the bezier path for the edge
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })

    // Build edge style based on dependency type
    // Uses CSS custom properties mapped to Tailwind v4 @theme tokens
    // --color-ink-muted = #64748b, --color-ink-faint = #94a3b8
    const edgeStyle: React.CSSProperties = {
      ...style,
      strokeWidth: 2,
      stroke: isPartial ? 'var(--color-ink-faint)' : 'var(--color-ink-muted)',
      ...(isPartial ? { strokeDasharray: '6 3' } : {}),
    }

    // Label text based on type and threshold
    const labelText = isPartial ? `Partial ${threshold}%` : 'Full'

    return (
      <>
        {/* Base SVG edge path */}
        <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />

        {/* Label rendered via EdgeLabelRenderer for HTML overlay */}
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            <span className="bg-surface-card border border-surface-border text-2xs text-ink-muted px-1.5 py-0.5 rounded-sm whitespace-nowrap">
              {labelText}
            </span>
          </div>
        </EdgeLabelRenderer>
      </>
    )
  }
)

FlowEdge.displayName = 'FlowEdge'

export default FlowEdge
