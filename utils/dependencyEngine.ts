/**
 * Dependency Engine — Core logic for work item dependency resolution.
 *
 * Handles:
 *  - Blocking status computation (isItemBlocked)
 *  - Bottleneck detection (detectBottlenecks)
 *  - Circular dependency detection (hasCycle)
 *  - Recursive cascade status updates (cascadeStatusUpdate)
 *  - Skill-based assignee suggestions (suggestAssignees)
 *  - Workload scoring (getWorkloadScore)
 *  - Estimated completion time (estimateCompletion)
 */

import type { Dependency, WorkItem, WorkStatus } from '@/types'

/**
 * Determines whether a specific work item is blocked by its dependencies.
 *
 * An item is blocked if ANY predecessor (dependency where this item is the 	o_id)
 * has not yet reached the required threshold AND the predecessor is not done.
 *
 * Edge cases handled:
 *  - Empty deps array → never blocked
 *  - threshold = 0 → never blocked (0 >= 0 is always true)
 *  - Predecessor is 'done' → never blocks (done items are considered fully satisfied)
 *  - Predecessor progress exactly at threshold → NOT blocked (>= comparison)
 */
export function isItemBlocked(itemId: string, items: WorkItem[], deps: Dependency[]): boolean {
  const predecessors = deps.filter((dep) => dep.to_id === itemId)

  if (predecessors.length === 0) return false

  return predecessors.some((dep) => {
    const predecessor = items.find((item) => item.id === dep.from_id)
    if (!predecessor) return false
    if (predecessor.status === 'done') return false
    return predecessor.progress < dep.threshold
  })
}

/**
 * Detects bottleneck items — work items that are blocking multiple downstream tasks
 * and are not yet complete.
 *
 * A bottleneck is defined as an item that:
 *  - Has 2+ successors (items that depend on it)
 *  - At least one successor is not 'done'
 *  - The item itself is not 'done'
 */
export function detectBottlenecks(items: WorkItem[], deps: Dependency[]): WorkItem[] {
  return items.filter((item) => {
    if (item.status === 'done') return false

    const successors = deps.filter((dep) => dep.from_id === item.id)
    if (successors.length < 2) return false

    const activeSuccessors = successors.filter((dep) => {
      const successor = items.find((i) => i.id === dep.to_id)
      return successor && successor.status !== 'done'
    })

    return activeSuccessors.length >= 2
  })
}

/**
 * Detects circular dependencies using DFS cycle detection.
 *
 * Builds an adjacency list from existing dependencies plus the proposed dependency,
 * then performs DFS from each node to detect back edges (cycles).
 *
 * Returns:
 *  - hasCycle: boolean — whether a cycle was detected
 *  - cyclePath: string — the path of the cycle (UUIDs joined by ' → '), empty if no cycle
 *
 * Edge cases handled:
 *  - Self-dependency (from_id === to_id) → detected as cycle
 *  - Complex multi-node cycles (A→B→C→A) → detected with full path
 *  - No cycle → returns hasCycle: false
 */
export function hasCycle(
  existingDeps: Dependency[],
  proposed?: Dependency
): { hasCycle: boolean; cyclePath: string } {
  const allDeps = proposed ? [...existingDeps, proposed] : existingDeps

  const adj = new Map<string, string[]>()
  for (const dep of allDeps) {
    if (!adj.has(dep.from_id)) adj.set(dep.from_id, [])
    adj.get(dep.from_id)!.push(dep.to_id)
  }

  const visited = new Set<string>()
  const recStack = new Set<string>()
  const parent = new Map<string, string>()

  function dfs(node: string): string | null {
    visited.add(node)
    recStack.add(node)

    const neighbors = adj.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        parent.set(neighbor, node)
        const cycle = dfs(neighbor)
        if (cycle) return cycle
      } else if (recStack.has(neighbor)) {
        // Reconstruct cycle path
        const path: string[] = [neighbor, node]
        let current = node
        while (current !== neighbor) {
          current = parent.get(current) || ''
          if (current && current !== neighbor) {
            path.unshift(current)
          } else {
            break
          }
        }
        path.push(neighbor)
        return path.join(' → ')
      }
    }

    recStack.delete(node)
    return null
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      const cycle = dfs(node)
      if (cycle) return { hasCycle: true, cyclePath: cycle }
    }
  }

  return { hasCycle: false, cyclePath: '' }
}

/**
 * Recursively cascades status updates through the dependency graph.
 *
 * When a work item's progress changes, this function:
 *  1. Checks all successors (items that depend on the changed item)
 *  2. For each successor, recomputes blocked status
 *  3. If status changed (blocked ↔ in-progress), recursively cascades to THAT item's successors
 *  4. Handles BOTH forward progress (unblocking) AND backward progress (re-blocking)
 *
 * This is a recursive, multi-level cascade — changes propagate through the entire
 * dependency chain, not just one level.
 *
 * Returns a new array of WorkItems with updated statuses.
 */
export function cascadeStatusUpdate(
  itemId: string,
  items: WorkItem[],
  deps: Dependency[]
): WorkItem[] {
  const itemMap = new Map<string, WorkItem>()
  items.forEach((item) => itemMap.set(item.id, { ...item }))

  function cascade(changedId: string) {
    const successors = deps.filter((dep) => dep.from_id === changedId)

    for (const dep of successors) {
      const successor = itemMap.get(dep.to_id)
      if (!successor) continue

      const wasBlocked = successor.status === 'blocked'
      const isNowBlocked = isItemBlocked(dep.to_id, Array.from(itemMap.values()), deps)

      if (wasBlocked && !isNowBlocked) {
        // Unblock: blocked → in-progress
        itemMap.set(dep.to_id, {
          ...successor,
          status: 'in-progress' as WorkStatus,
          blocked_reason: undefined,
        })
        // Recursively cascade from this newly unblocked item
        cascade(dep.to_id)
      } else if (!wasBlocked && isNowBlocked && successor.status !== 'done') {
        // Re-block: in-progress → blocked (handles backward progress)
        const predecessor = itemMap.get(dep.from_id)
        const reason = predecessor
          ? `Blocked by "${predecessor.title}" (needs ${dep.threshold}%, currently at ${predecessor.progress}%)`
          : 'Blocked by dependency'
        itemMap.set(dep.to_id, {
          ...successor,
          status: 'blocked' as WorkStatus,
          blocked_reason: reason,
        })
        // Recursively cascade from this newly blocked item
        cascade(dep.to_id)
      }
    }
  }

  cascade(itemId)
  return Array.from(itemMap.values())
}

/**
 * Suggests assignees for a work item based on required skills.
 *
 * Ranks members by:
 *  1. Number of matching skills (descending)
 *  2. Current workload score (ascending — prefer less loaded members)
 *
 * Only returns members with at least one matching skill.
 * Returns empty array if no members have matching skills.
 */
export function suggestAssignees(
  requiredSkills: string[],
  users: { id: string; name: string; role: string; skills: string[] }[],
  items: WorkItem[]
): { id: string; name: string; skills: string[] }[] {
  const members = users.filter((u) => u.role === 'member')

  const scored = members
    .map((member) => {
      const matchingSkills = member.skills.filter((skill) =>
        requiredSkills.includes(skill)
      )
      const workloadScore = getWorkloadScore(member.id, items)

      return {
        ...member,
        matchCount: matchingSkills.length,
        workloadScore,
      }
    })
    .filter((m) => m.matchCount > 0)
    .sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount
      return a.workloadScore - b.workloadScore
    })

  return scored.map(({ id, name, skills }) => ({ id, name, skills }))
}

/**
 * Calculates a workload score for a member based on their active tasks.
 *
 * Score = sum of priority weights for each active (non-done) task:
 *   critical = 4 points
 *   high     = 3 points
 *   medium   = 2 points
 *   low      = 1 point
 *
 * Higher score = more overloaded. Overload threshold is 15.
 * Returns 0 if member has no active tasks or all tasks are done.
 */
export function getWorkloadScore(memberId: string, items: WorkItem[]): number {
  const PRIORITY_WEIGHT: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }

  return items
    .filter((item) => item.assigned_to === memberId && item.status !== 'done')
    .reduce((sum, item) => {
      const weight = PRIORITY_WEIGHT[item.priority] ?? 1
      return sum + weight
    }, 0)
}

/**
 * Estimates days to completion based on progress history.
 *
 * Uses the average daily progress rate from historical snapshots
 * to project remaining work.
 *
 * Returns null if:
 *  - Item is already done
 *  - Fewer than 2 progress snapshots
 *  - Progress rate is zero or negative
 */
export function estimateCompletion(item: WorkItem): number | null {
  if (item.status === 'done') return null

  const history = item.progress_history as Array<{
    progress: number
    timestamp: string
  }>

  if (history.length < 2) return null

  const first = new Date(history[0].timestamp).getTime()
  const last = new Date(history[history.length - 1].timestamp).getTime()
  const daysElapsed = Math.max(1, (last - first) / (1000 * 60 * 60 * 24))

  const progressGained =
    history[history.length - 1].progress - history[0].progress

  if (progressGained <= 0) return null

  const dailyRate = progressGained / daysElapsed
  const remaining = 100 - item.progress

  return Math.ceil(remaining / dailyRate)
}

