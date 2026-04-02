'use client'

import { useMemo, useCallback, useState, useEffect, memo } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type NodeProps,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'
import type { WorkItem, Dependency, User, WorkStatus, DependencyType } from '@/types'
import { X, Clock, AlertTriangle, CheckCircle2, User as UserIcon, Zap } from 'lucide-react'

interface ProcessFlowDiagramProps {
  items: WorkItem[]
  deps: Dependency[]
  users: User[]
}

const NODE_WIDTH = 240
const NODE_HEIGHT = 110

// Custom node component with rich content
const WorkItemNode = memo(({ data }: NodeProps<Node<{ label: string; priority: string; assignee: string; progress: number; status: string }>>) => {
  const priorityColors: Record<string, string> = {
    critical: 'bg-danger-500',
    high: 'bg-orange-500',
    medium: 'bg-blue-500',
    low: 'bg-surface-400',
  }

  const statusIcons: Record<string, React.ReactNode> = {
    blocked: <AlertTriangle className="w-3.5 h-3.5 text-danger-600" />,
    'in-progress': <Clock className="w-3.5 h-3.5 text-warning-600" />,
    done: <CheckCircle2 className="w-3.5 h-3.5 text-success-600" />,
  }

  const progressColor = data.progress === 100
    ? 'bg-success-500'
    : data.progress >= 50
    ? 'bg-brand-500'
    : 'bg-warning-500'

  return (
    <div className="w-full h-full flex flex-col justify-between p-3.5 bg-white rounded-xl border-2 border-surface-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-surface-400 !border-2 !border-white" />
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[data.priority] || 'bg-surface-400'}`} />
            <span className="text-xs font-semibold text-surface-900 truncate">{data.label}</span>
          </div>
          {statusIcons[data.status]}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-surface-500">
          <UserIcon className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{data.assignee}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor} rounded-full transition-all duration-500`}
            style={{ width: `${data.progress}%` }}
          />
        </div>
        <span className="text-xs font-bold text-surface-700 tabular-nums">{data.progress}%</span>
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-surface-400 !border-2 !border-white" />
    </div>
  )
})
WorkItemNode.displayName = 'WorkItemNode'

const nodeTypes = { workItem: WorkItemNode }

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

function getStatusColor(status: WorkStatus): string {
  switch (status) {
    case 'blocked':
      return '#fee2e2'
    case 'in-progress':
      return '#fef3c7'
    case 'done':
      return '#dcfce7'
    default:
      return '#f4f4f5'
  }
}

function getEdgeStyle(type: DependencyType) {
  return {
    stroke: type === 'partial' ? '#a1a1aa' : '#52525b',
    strokeWidth: 2,
    strokeDasharray: type === 'partial' ? '5,5' : undefined,
  }
}

export default function ProcessFlowDiagram({ items, deps, users }: ProcessFlowDiagramProps) {
  const [selectedNode, setSelectedNode] = useState<WorkItem | null>(null)

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (items.length === 0) {
      return { nodes: [], edges: [] }
    }

    const userMap = new Map<string, User>()
    users.forEach((u) => userMap.set(u.id, u))

    const nodes: Node[] = items.map((item) => ({
      id: item.id,
      type: 'workItem',
      position: { x: 0, y: 0 },
      data: {
        label: item.title,
        priority: item.priority,
        assignee: userMap.get(item.assigned_to)?.name ?? 'Unassigned',
        progress: item.progress,
        status: item.status,
      },
      style: {
        background: getStatusColor(item.status),
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
      },
    }))

    const edges: Edge[] = deps.map((dep) => ({
      id: `${dep.from_id}-${dep.to_id}`,
      source: dep.from_id,
      target: dep.to_id,
      label: dep.type === 'partial' ? `Partial ${dep.threshold}%` : 'Full',
      labelStyle: { fill: '#52525b', fontWeight: 600, fontSize: 11 },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, rx: 4, ry: 4 },
      style: getEdgeStyle(dep.type),
      animated: false,
    }))

    const layouted = getLayoutedElements(nodes, edges, 'LR')
    return layouted
  }, [items, deps, users])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const item = items.find((i) => i.id === node.id)
      if (item) setSelectedNode(item)
    },
    [items]
  )

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-16 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 mb-1">No work items yet</h3>
        <p className="text-surface-500 text-sm">Create a work item to see the process flow diagram.</p>
      </div>
    )
  }

  return (
    <div className="relative flex h-[600px] rounded-2xl border border-surface-200 bg-white overflow-hidden shadow-sm">
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <MiniMap
            nodeStrokeColor={(n: Node) => {
              const status = n.data?.status as string
              if (status === 'blocked') return '#ef4444'
              if (status === 'in-progress') return '#f59e0b'
              return '#22c55e'
            }}
            nodeColor={(n: Node) => {
              const status = n.data?.status as WorkStatus
              return getStatusColor(status)
            }}
            pannable
            zoomable
            className="!bg-surface-50 !rounded-lg !border !border-surface-200"
          />
          <Controls className="!bg-white !border !border-surface-200 !rounded-lg !shadow-sm" />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e4e4e7" />
        </ReactFlow>
      </div>

      {/* Side Panel */}
      {selectedNode && (
        <div className="w-80 border-l border-surface-200 bg-surface-50 p-6 overflow-y-auto animate-slide-up">
          <div className="flex items-start justify-between mb-5">
            <h3 className="text-lg font-bold text-surface-900 leading-tight">{selectedNode.title}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-200 transition-all duration-200"
              aria-label="Close details panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                selectedNode.status === 'blocked'
                  ? 'bg-danger-100 text-danger-700'
                  : selectedNode.status === 'in-progress'
                  ? 'bg-warning-100 text-warning-700'
                  : 'bg-success-100 text-success-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedNode.status === 'blocked'
                    ? 'bg-danger-500'
                    : selectedNode.status === 'in-progress'
                    ? 'bg-warning-500'
                    : 'bg-success-500'
                }`} />
                {selectedNode.status.charAt(0).toUpperCase() + selectedNode.status.slice(1).replace('-', ' ')}
              </span>
              <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                selectedNode.priority === 'critical'
                  ? 'bg-danger-100 text-danger-700'
                  : selectedNode.priority === 'high'
                  ? 'bg-orange-100 text-orange-700'
                  : selectedNode.priority === 'medium'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-surface-100 text-surface-600'
              }`}>
                {selectedNode.priority.charAt(0).toUpperCase() + selectedNode.priority.slice(1)}
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-surface-500 uppercase tracking-wide">Progress</label>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedNode.progress === 100 ? 'bg-success-500' : selectedNode.progress >= 50 ? 'bg-brand-500' : 'bg-warning-500'
                    }`}
                    style={{ width: `${selectedNode.progress}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-surface-700 tabular-nums">{selectedNode.progress}%</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-surface-500 uppercase tracking-wide">Description</label>
              <p className="mt-1.5 text-sm text-surface-700 leading-relaxed">{selectedNode.description || 'No description'}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-surface-500 uppercase tracking-wide">Required Skills</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedNode.required_skills.length > 0 ? (
                  selectedNode.required_skills.map((skill) => (
                    <span key={skill} className="rounded-lg bg-brand-50 border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-700">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-surface-400">None</span>
                )}
              </div>
            </div>

            {selectedNode.blocked_reason && (
              <div className="rounded-xl border border-danger-200 bg-danger-50 p-3">
                <label className="text-xs font-medium text-danger-600 uppercase tracking-wide">Block Reason</label>
                <p className="mt-1 text-sm text-danger-700 leading-relaxed">{selectedNode.blocked_reason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
