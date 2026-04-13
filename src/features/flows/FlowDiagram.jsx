import React from 'react'
import { ReactFlow, Background, Controls } from './reactflowCompat'
import '@reactflow/core/dist/style.css'
import '@reactflow/controls/dist/style.css'

import { nodes as retentionNodes, edges as retentionEdges } from '../../flows/retentionFlow'

import StateNode from './nodes/StateNode'
import DecisionNode from './nodes/DecisionNode'
import OutcomeNode from './nodes/OutcomeNode'
import CommunicationNode from './nodes/CommunicationNode'
import ContainerNode from './nodes/ContainerNode'
import BadgeEdge from './edges/BadgeEdge'

function getNodeBounds(nodes) {
  if (!Array.isArray(nodes) || !nodes.length) {
    return { minX: 0, minY: 0 }
  }

  return nodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node?.position?.x ?? 0),
      minY: Math.min(acc.minY, node?.position?.y ?? 0),
    }),
    { minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY }
  )
}

function getBranchDelta(edge) {
  const handle = String(edge?.sourceHandle || '')
  const label = String(edge?.data?.primary || edge?.label || '').toLowerCase()

  if (
    handle.includes('left') ||
    label.includes('yes') ||
    label.includes('sì') ||
    label.includes('si')
  ) {
    return -1
  }

  if (handle.includes('right') || label.includes('no')) {
    return 1
  }

  if (handle.includes('center') || handle === 'out' || label.includes('warm')) {
    return 0
  }

  return 0
}

function getBranchSortValue(edge) {
  const delta = getBranchDelta(edge)
  if (delta < 0) return 0
  if (delta === 0) return 1
  return 2
}

function getBackboneSortValue(edge) {
  const handle = String(edge?.sourceHandle || '')
  const label = String(edge?.data?.primary || edge?.label || '').toLowerCase()

  if (handle.includes('center') || handle === 'out' || label.includes('warm')) return 0
  if (
    handle.includes('left') ||
    label.includes('yes') ||
    label.includes('sì') ||
    label.includes('si')
  )
    return 1
  if (handle.includes('right') || label.includes('no')) return 2
  return 1
}

function buildBackboneNodeIds(roots, outgoingMap) {
  const backboneIds = new Set()
  const rootId = roots[0]?.id
  if (!rootId) return backboneIds

  let currentNodeId = rootId
  let guard = 0

  while (currentNodeId && !backboneIds.has(currentNodeId) && guard < 500) {
    backboneIds.add(currentNodeId)
    const nextEdge = [...(outgoingMap.get(currentNodeId) || [])]
      .sort((left, right) => getBackboneSortValue(left) - getBackboneSortValue(right))
      .find((edge) => edge?.target && !backboneIds.has(edge.target))

    currentNodeId = nextEdge?.target || null
    guard += 1
  }

  return backboneIds
}

function getSoliticsNodeSize(node) {
  if (node?.type === 'decision') {
    return { width: 176, height: 92 }
  }

  if (node?.type === 'outcome') {
    return { width: 164, height: 86 }
  }

  if (node?.type === 'communication') {
    return { width: 132, height: 72 }
  }

  if (node?.type === 'state') {
    if (node?.data?.flowRole === 'entry' || node?.id === 'E0') {
      return { width: 196, height: 88 }
    }

    if (node?.data?.templateId) {
      return { width: 196, height: 88 }
    }

    return { width: 164, height: 72 }
  }

  return { width: 176, height: 84 }
}

function reserveNearestLane(occupiedLanesByLevel, level, desiredLane) {
  const occupied = occupiedLanesByLevel.get(level) || new Set()
  if (!occupied.has(desiredLane)) {
    occupied.add(desiredLane)
    occupiedLanesByLevel.set(level, occupied)
    return desiredLane
  }

  for (let distance = 1; distance < 12; distance += 1) {
    const lower = desiredLane - distance
    if (!occupied.has(lower)) {
      occupied.add(lower)
      occupiedLanesByLevel.set(level, occupied)
      return lower
    }

    const upper = desiredLane + distance
    if (!occupied.has(upper)) {
      occupied.add(upper)
      occupiedLanesByLevel.set(level, occupied)
      return upper
    }
  }

  occupied.add(desiredLane)
  occupiedLanesByLevel.set(level, occupied)
  return desiredLane
}

function getSoliticsNodeStyle(node, selectedNodeId, connectedNodeIds) {
  const isSelected = node?.id === selectedNodeId
  const isConnected = connectedNodeIds.has(node?.id)
  const isSecondary = Boolean(node?.data?.isSecondaryBranch)
  const isBackbone = Boolean(node?.data?.isBackbone)
  const isSupporting = node?.type === 'communication'

  if (isSelected) {
    return {
      ...(node?.style || {}),
      opacity: 1,
      zIndex: 40,
    }
  }

  if (isConnected) {
    return {
      ...(node?.style || {}),
      opacity: isSupporting ? 0.92 : 1,
      zIndex: 24,
    }
  }

  if (isSecondary || isSupporting) {
    return {
      ...(node?.style || {}),
      opacity: isSupporting ? 0.36 : 0.74,
      zIndex: 4,
    }
  }

  return {
    ...(node?.style || {}),
    opacity: isBackbone ? 0.98 : 0.9,
    zIndex: isBackbone ? 14 : 12,
  }
}

function getSoliticsEdgeVisibility({
  hasSelection,
  isConnected,
  isSupportingEdge,
  isSecondaryConnection,
  isMainHorizontalConnection,
}) {
  if (isConnected) return 'focus'
  if (isSupportingEdge) return hasSelection ? 'hidden' : 'supporting'
  if (isSecondaryConnection) return hasSelection ? 'hidden' : 'secondary'
  if (isMainHorizontalConnection) return 'main'
  return 'secondary'
}

function getSoliticsEdgeStyle(edgeVisibility, fallbackStroke) {
  switch (edgeVisibility) {
    case 'focus':
      return {
        opacity: 1,
        stroke: 'rgba(15, 118, 110, 0.96)',
        strokeWidth: 2.6,
      }
    case 'main':
      return {
        opacity: 0.92,
        stroke: fallbackStroke || 'rgba(51, 65, 85, 0.8)',
        strokeWidth: 2.05,
      }
    case 'secondary':
      return {
        opacity: 0.52,
        stroke: fallbackStroke || 'rgba(100, 116, 139, 0.62)',
        strokeWidth: 1.35,
      }
    case 'supporting':
      return {
        opacity: 0.32,
        stroke: fallbackStroke || 'rgba(148, 163, 184, 0.6)',
        strokeWidth: 1.1,
        strokeDasharray: '4 4',
      }
    default:
      return {
        opacity: 0.14,
        stroke: fallbackStroke || 'rgba(148, 163, 184, 0.42)',
        strokeWidth: 1,
      }
  }
}

function projectSoliticsLayout(nodes, edges) {
  const safeNodes = Array.isArray(nodes) ? nodes : []
  const safeEdges = Array.isArray(edges) ? edges : []
  const communicationNodes = safeNodes.filter((node) => node?.type === 'communication')
  const primaryNodes = safeNodes.filter((node) => node?.type !== 'communication')
  const primaryNodeIds = new Set(primaryNodes.map((node) => node.id))
  const primaryEdges = safeEdges.filter(
    (edge) => primaryNodeIds.has(edge?.source) && primaryNodeIds.has(edge?.target)
  )
  const incomingCount = new Map(primaryNodes.map((node) => [node.id, 0]))
  const outgoingMap = new Map(primaryNodes.map((node) => [node.id, []]))

  primaryEdges.forEach((edge) => {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1)
    outgoingMap.get(edge.source)?.push(edge)
  })

  outgoingMap.forEach((list) => {
    list.sort((left, right) => getBranchSortValue(left) - getBranchSortValue(right))
  })

  const roots = primaryNodes
    .filter((node) => (incomingCount.get(node.id) || 0) === 0)
    .sort(
      (left, right) =>
        (left?.position?.y ?? 0) - (right?.position?.y ?? 0) ||
        (left?.position?.x ?? 0) - (right?.position?.x ?? 0)
    )

  const queue = [...roots.map((node) => node.id)]
  const topoOrder = []
  const remainingIncoming = new Map(incomingCount)

  while (queue.length) {
    const nodeId = queue.shift()
    topoOrder.push(nodeId)

    for (const edge of outgoingMap.get(nodeId) || []) {
      const nextIncoming = (remainingIncoming.get(edge.target) || 0) - 1
      remainingIncoming.set(edge.target, nextIncoming)
      if (nextIncoming === 0) {
        queue.push(edge.target)
      }
    }
  }

  const levelMap = new Map()
  roots.forEach((node, index) => {
    levelMap.set(node.id, index)
  })

  const backboneIds = buildBackboneNodeIds(roots, outgoingMap)

  topoOrder.forEach((nodeId) => {
    for (const edge of outgoingMap.get(nodeId) || []) {
      const currentLevel = levelMap.get(nodeId) || 0
      const targetLevel = Math.max(levelMap.get(edge.target) || 0, currentLevel + 1)
      levelMap.set(edge.target, targetLevel)
    }
  })

  const laneMap = new Map()
  roots.forEach((node) => {
    laneMap.set(node.id, backboneIds.has(node.id) ? 0 : 1)
  })

  topoOrder.forEach((nodeId) => {
    const currentLane = laneMap.get(nodeId) || 0
    const outgoing = outgoingMap.get(nodeId) || []
    if (!outgoing.length) return

    const sameLevelChildren = outgoing.filter((edge) => edge?.target)
    sameLevelChildren.forEach((edge) => {
      const delta = getBranchDelta(edge)
      const targetIsBackbone = backboneIds.has(edge.target)
      const sourceIsBackbone = backboneIds.has(nodeId)
      const normalizedDelta = delta === 0 ? (currentLane < 0 ? -1 : 1) : delta
      const desiredLane = targetIsBackbone
        ? 0
        : sourceIsBackbone
          ? normalizedDelta
          : currentLane + normalizedDelta
      const previousLane = laneMap.get(edge.target)

      if (previousLane == null) {
        laneMap.set(edge.target, desiredLane)
      } else if (targetIsBackbone) {
        laneMap.set(edge.target, 0)
      } else if (Math.abs(previousLane) < Math.abs(desiredLane)) {
        laneMap.set(edge.target, desiredLane)
      }
    })
  })

  const occupiedLanesByLevel = new Map()
  const normalizedNodes = topoOrder.length ? topoOrder : primaryNodes.map((node) => node.id)

  normalizedNodes.forEach((nodeId) => {
    const level = levelMap.get(nodeId) || 0
    const desiredLane = laneMap.get(nodeId) || 0
    const reservedLane = backboneIds.has(nodeId)
      ? reserveNearestLane(occupiedLanesByLevel, level, 0)
      : reserveNearestLane(occupiedLanesByLevel, level, desiredLane)
    laneMap.set(nodeId, reservedLane)
  })

  const primaryLevels = [...new Set(primaryNodes.map((node) => levelMap.get(node.id) || 0))].sort(
    (a, b) => a - b
  )
  const levelSpacing = 226
  const laneSpacing = 176
  const startX = 96
  const mainRowY = 258

  const projectedPrimaryNodes = primaryNodes.map((node) => {
    const nodeLevel = levelMap.get(node.id) || 0
    const nodeLane = laneMap.get(node.id) || 0
    const normalizedLevel = primaryLevels.indexOf(nodeLevel)
    const isEntryNode = (incomingCount.get(node.id) || 0) === 0 && normalizedLevel === 0
    const isSecondaryBranch = nodeLane !== 0
    const size = getSoliticsNodeSize({
      ...node,
      data: {
        ...node?.data,
        flowRole: isEntryNode ? 'entry' : node?.data?.flowRole,
      },
    })

    return {
      ...node,
      position: {
        x: Math.round(startX + normalizedLevel * levelSpacing),
        y: Math.round(mainRowY + nodeLane * laneSpacing),
      },
      style: {
        ...(node?.style || {}),
        width: size.width,
        height: size.height,
      },
      data: {
        ...node?.data,
        flowDirection: 'horizontal',
        flowRole: isEntryNode ? 'entry' : node?.data?.flowRole,
        isBackbone: backboneIds.has(node.id),
        isSecondaryBranch,
      },
    }
  })

  const projectedMap = new Map(projectedPrimaryNodes.map((node) => [node.id, node]))
  const anchorCounts = new Map()
  const { minX, minY } = getNodeBounds(safeNodes)

  const projectedCommunicationNodes = communicationNodes.map((node) => {
    const relatedEdge = safeEdges.find(
      (edge) => edge?.source === node?.id || edge?.target === node?.id
    )
    const anchorId = relatedEdge?.source === node?.id ? relatedEdge?.target : relatedEdge?.source
    const anchorNode = projectedMap.get(anchorId)
    const originalAnchorNode = safeNodes.find((candidate) => candidate?.id === anchorId)

    if (!anchorNode || !originalAnchorNode) {
      const fallbackX = node?.position?.y ?? 0
      const fallbackY = node?.position?.x ?? 0

      return {
        ...node,
        position: {
          x: Math.round((fallbackX - minY) * 0.86 + 100),
          y: Math.round((fallbackY - minX) * 1.02 + 72),
        },
        data: {
          ...node?.data,
          flowDirection: 'horizontal',
        },
      }
    }

    const anchorIndex = anchorCounts.get(anchorId) || 0
    anchorCounts.set(anchorId, anchorIndex + 1)

    const side = (node?.position?.x ?? 0) <= (originalAnchorNode?.position?.x ?? 0) ? -1 : 1
    const rowShift = anchorIndex * 52
    const size = getSoliticsNodeSize(node)

    return {
      ...node,
      position: {
        x: Math.round(anchorNode.position.x + 30),
        y: Math.round(anchorNode.position.y + side * (118 + rowShift)),
      },
      style: {
        ...(node?.style || {}),
        width: size.width,
        height: size.height,
      },
      data: {
        ...node?.data,
        flowDirection: 'horizontal',
        isSecondaryBranch: true,
      },
    }
  })

  return [...projectedPrimaryNodes, ...projectedCommunicationNodes]
}

function normalizeSoliticsSourceNodes(nodes) {
  const safeNodes = Array.isArray(nodes) ? nodes : []

  return safeNodes.map((node) => {
    const size = getSoliticsNodeSize(node)
    const isEntryNode = node?.data?.flowRole === 'entry' || node?.id === 'E0'

    return {
      ...node,
      style: {
        ...(node?.style || {}),
        width: node?.style?.width ?? size.width,
        height: node?.style?.height ?? size.height,
      },
      data: {
        ...node?.data,
        flowDirection: 'horizontal',
        flowRole: isEntryNode ? 'entry' : node?.data?.flowRole,
      },
    }
  })
}

const nodeTypes = {
  container: ContainerNode,
  state: StateNode,
  decision: DecisionNode,
  outcome: OutcomeNode,
  communication: CommunicationNode,
}

const edgeTypes = {
  badge: BadgeEdge,
}

export default function FlowDiagram({
  nodes = retentionNodes,
  edges = retentionEdges,
  onNavigateFlow,
  onOpenTemplate,
  onSelectNode,
  selectedNodeId,
  theme = 'default',
  height = 760,
  layoutMode = 'projected',
}) {
  const shouldProjectSoliticsLayout = theme === 'solitics' && layoutMode !== 'source'
  const baseNodes = shouldProjectSoliticsLayout
    ? projectSoliticsLayout(nodes, edges)
    : theme === 'solitics'
      ? normalizeSoliticsSourceNodes(nodes)
      : nodes
  const nodeById = new Map(baseNodes.map((node) => [node.id, node]))
  const connectedNodeIds = new Set(
    (edges || [])
      .filter((edge) => edge?.source === selectedNodeId || edge?.target === selectedNodeId)
      .flatMap((edge) => [edge?.source, edge?.target])
      .filter(Boolean)
  )

  const themedNodes = baseNodes.map((node) => ({
    ...node,
    style:
      theme === 'solitics'
        ? getSoliticsNodeStyle(node, selectedNodeId, connectedNodeIds)
        : node?.style,
    data: {
      ...node?.data,
      theme,
      isSelected: node?.id === selectedNodeId,
      showDetails: node?.id === selectedNodeId,
    },
  }))

  const themedEdges = edges.map((edge) => {
    const isConnected = edge?.source === selectedNodeId || edge?.target === selectedNodeId
    const hasSelection = Boolean(selectedNodeId)
    const sourceNode = nodeById.get(edge?.source)
    const targetNode = nodeById.get(edge?.target)
    const sourceType = sourceNode?.type
    const targetType = targetNode?.type
    const hasChoiceLabel = Boolean(edge?.data?.primary || edge?.data?.secondary || edge?.label)
    const isDecisionEdge = sourceType === 'decision'
    const pointsToOutcome = targetType === 'outcome'
    const isSupportingEdge = sourceType === 'communication' || targetType === 'communication'
    const isSecondaryConnection =
      sourceNode?.data?.isSecondaryBranch || targetNode?.data?.isSecondaryBranch
    const isMainHorizontalConnection =
      Math.abs((sourceNode?.position?.y ?? 0) - (targetNode?.position?.y ?? 0)) <= 12
    const edgeVisibility = getSoliticsEdgeVisibility({
      hasSelection,
      isConnected,
      isSupportingEdge,
      isSecondaryConnection,
      isMainHorizontalConnection,
    })
    const edgeStyle = getSoliticsEdgeStyle(edgeVisibility, edge?.style?.stroke)
    const markerEnd =
      theme === 'solitics'
        ? isSupportingEdge || edgeVisibility === 'hidden'
          ? undefined
          : isDecisionEdge || pointsToOutcome || hasChoiceLabel
            ? {
                type: 'arrowclosed',
                width: 18,
                height: 18,
                color:
                  edgeVisibility === 'focus' ? 'rgba(15, 118, 110, 0.95)' : 'rgba(15,23,42,0.46)',
              }
            : undefined
        : edge?.markerEnd

    return {
      ...edge,
      type: theme === 'solitics' ? 'badge' : edge?.type,
      markerEnd,
      data: {
        ...edge?.data,
        theme,
        isConnected,
        edgeVisibility,
        hasChoiceLabel,
        showDot: edgeVisibility === 'focus',
      },
      style:
        theme === 'solitics'
          ? {
              ...(edge?.style || {}),
              ...edgeStyle,
            }
          : edge?.style,
    }
  })

  const flowHeight = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`flow-diagram flow-diagram--${theme}`}
      style={{ width: '100%', height: flowHeight }}
    >
      <ReactFlow
        nodes={themedNodes}
        edges={themedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: theme === 'solitics' ? 0.08 : 0.14 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(e, node) => {
          if (typeof onSelectNode === 'function') {
            onSelectNode(node)
          }
          const templateId = node?.data?.templateId
          if (templateId && typeof onOpenTemplate === 'function') {
            e.preventDefault()
            e.stopPropagation()
            onOpenTemplate(String(templateId), node)
            return
          }
          const target = node?.data?.linkToFlow
          if (!target || typeof onNavigateFlow !== 'function') return
          e.preventDefault()
          e.stopPropagation()
          onNavigateFlow(target)
        }}
        defaultEdgeOptions={{
          type: theme === 'solitics' ? 'badge' : 'step',
          style:
            theme === 'solitics'
              ? { stroke: 'rgba(71,85,105,0.58)', strokeWidth: 1.8 }
              : { stroke: 'rgba(148,163,184,0.85)', strokeWidth: 1.6 },
          markerEnd:
            theme === 'solitics'
              ? undefined
              : {
                  type: 'arrowclosed',
                  width: 18,
                  height: 18,
                  color: 'rgba(226,232,240,0.85)',
                },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background
          color={theme === 'solitics' ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148,163,184,0.14)'}
          gap={theme === 'solitics' ? 32 : 18}
        />
      </ReactFlow>
    </div>
  )
}
