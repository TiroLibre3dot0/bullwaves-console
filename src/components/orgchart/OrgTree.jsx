import React, { useEffect, useMemo } from 'react'

function defaultNodeClassName({ clickable, active, matched }) {
  const base =
    'px-4 py-2 rounded-full border bg-slate-900/60 text-slate-100 text-sm font-semibold shadow-sm '
  const border = active ? 'border-cyan-400 ' : 'border-slate-700 '
  const hover = clickable ? 'hover:border-cyan-400 hover:text-white cursor-pointer ' : ''
  const glow = matched ? 'ring-2 ring-cyan-400/40 ' : ''
  return base + border + hover + glow
}

function layoutTree(nodes, edges, { nodeWidth, levelGap, sidePadding }) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  const childrenByParent = new Map()
  for (const n of nodes) {
    if (!n.parentId) continue
    if (!childrenByParent.has(n.parentId)) childrenByParent.set(n.parentId, [])
    childrenByParent.get(n.parentId).push(n.id)
  }

  // Sort children for stable layouts.
  for (const [k, ids] of childrenByParent.entries()) {
    ids.sort((a, b) => {
      const na = nodeById.get(a)
      const nb = nodeById.get(b)
      return (na?.label || '').localeCompare(nb?.label || '')
    })
    childrenByParent.set(k, ids)
  }

  // Identify root (node with no parent) and do a simple level assignment.
  const roots = nodes.filter((n) => !n.parentId)
  const root = roots[0]

  const levelById = new Map()
  if (root) levelById.set(root.id, 0)

  const queue = root ? [root.id] : []
  while (queue.length) {
    const id = queue.shift()
    const level = levelById.get(id) || 0
    const childIds = childrenByParent.get(id) || []
    for (const childId of childIds) {
      if (!levelById.has(childId)) {
        levelById.set(childId, level + 1)
        queue.push(childId)
      }
    }
  }

  const maxLevel = Math.max(0, ...Array.from(levelById.values()))

  const nodesByLevel = Array.from({ length: maxLevel + 1 }, () => [])
  for (const n of nodes) {
    const lvl = levelById.get(n.id)
    if (typeof lvl !== 'number') continue
    nodesByLevel[lvl].push(n.id)
  }

  // Basic horizontal positioning: spread each level evenly.
  const levelCounts = nodesByLevel.map((ids) => ids.length)
  const maxCount = Math.max(1, ...levelCounts)
  const width = sidePadding * 2 + Math.max(1, maxCount) * nodeWidth

  const positions = new Map()
  for (let lvl = 0; lvl < nodesByLevel.length; lvl++) {
    const ids = nodesByLevel[lvl]
    const count = Math.max(1, ids.length)
    const gap = count === 1 ? 0 : (width - sidePadding * 2 - nodeWidth) / (count - 1)
    for (let i = 0; i < ids.length; i++) {
      const x = count === 1 ? width / 2 : sidePadding + nodeWidth / 2 + gap * i
      const y = 28 + lvl * levelGap
      positions.set(ids[i], { x, y })
    }
  }

  // Use given edges if present, else derive parent-child edges.
  const derivedEdges = (edges || []).filter((e) => nodeById.has(e.from) && nodeById.has(e.to))

  return { width, height: 28 + maxLevel * levelGap + 28, positions, edges: derivedEdges }
}

export default function OrgTree({
  nodes = [],
  edges = [],
  activeNodeId = null,
  matchedNodeIds = new Set(),
  onNodeClick,
  variant = 'compact',
  scroll = true,
  viewportTransform = null,
  onLayout,
}) {
  const isPublic = variant === 'public'

  const dims = useMemo(() => {
    const nodeWidth = isPublic ? 190 : 180
    const levelGap = isPublic ? 78 : 72
    const sidePadding = 32
    return layoutTree(nodes, edges, { nodeWidth, levelGap, sidePadding })
  }, [nodes, edges, isPublic])

  const nodeWidth = isPublic ? 190 : 180
  const nodeHeight = isPublic ? 38 : 38

  const clickable = typeof onNodeClick === 'function'

  useEffect(() => {
    if (typeof onLayout === 'function') {
      onLayout({ width: dims.width, height: dims.height })
    }
  }, [dims.width, dims.height, onLayout])

  const transformStyle = useMemo(() => {
    if (!viewportTransform) return null
    const x = Number(viewportTransform.x || 0)
    const y = Number(viewportTransform.y || 0)
    const scale = Number(viewportTransform.scale || 1)
    return {
      transform: `translate(${x}px, ${y}px) scale(${scale})`,
      transformOrigin: '0 0',
    }
  }, [viewportTransform])

  return (
    <div className={`w-full ${scroll ? 'overflow-x-auto' : 'overflow-hidden'}`}>
      <div
        className="relative"
        style={{
          width: dims.width,
          height: dims.height,
          minWidth: scroll ? dims.width : undefined,
          ...transformStyle,
        }}
      >
        <svg
          width={dims.width}
          height={dims.height}
          className="absolute inset-0"
          aria-hidden="true"
        >
          {dims.edges.map((e) => {
            const from = dims.positions.get(e.from)
            const to = dims.positions.get(e.to)
            if (!from || !to) return null

            const y1 = from.y + nodeHeight / 2
            const y2 = to.y - nodeHeight / 2
            const midY = (y1 + y2) / 2

            const d = `M ${from.x} ${y1} C ${from.x} ${midY} ${to.x} ${midY} ${to.x} ${y2}`
            const isCross = e.kind === 'cross'
            return (
              <path
                key={`${e.from}-${e.to}-${e.kind}`}
                d={d}
                fill="none"
                stroke="rgba(148,163,184,0.6)"
                strokeWidth="2"
                strokeDasharray={isCross ? '6 6' : undefined}
              />
            )
          })}
        </svg>

        {nodes.map((n) => {
          const pos = dims.positions.get(n.id)
          if (!pos) return null

          const isActive = activeNodeId === n.id
          const isMatched = matchedNodeIds?.has?.(n.id)

          return (
            <button
              key={n.id}
              type="button"
              onClick={clickable ? () => onNodeClick(n) : undefined}
              className={defaultNodeClassName({ clickable, active: isActive, matched: isMatched })}
              style={{
                position: 'absolute',
                left: pos.x - nodeWidth / 2,
                top: pos.y - nodeHeight / 2,
                width: nodeWidth,
                height: nodeHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
              title={n.label}
            >
              <span className="truncate" style={{ maxWidth: nodeWidth - 24 }}>
                {n.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
