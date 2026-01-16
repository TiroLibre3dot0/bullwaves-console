import React, { useEffect, useMemo } from 'react'

function buildTree(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const childrenByParent = new Map()
  for (const n of nodes) {
    if (!n.parentId) continue
    if (!childrenByParent.has(n.parentId)) childrenByParent.set(n.parentId, [])
    childrenByParent.get(n.parentId).push(n.id)
  }

  // Stable ordering: root->divisions->departments etc.
  for (const [parentId, ids] of childrenByParent.entries()) {
    ids.sort((a, b) => {
      const na = byId.get(a)
      const nb = byId.get(b)
      const ta = na?.type || ''
      const tb = nb?.type || ''
      if (ta !== tb) return ta.localeCompare(tb)
      return (na?.label || '').localeCompare(nb?.label || '')
    })
    childrenByParent.set(parentId, ids)
  }

  const root = nodes.find((n) => !n.parentId) || null
  return { byId, childrenByParent, rootId: root?.id || null }
}

function tidyLayout({ byId, childrenByParent, rootId }, { nodeW, nodeH, gapX, gapY, padX, padY }) {
  let nextX = 0
  const pos = new Map()

  function walk(id, depth) {
    const children = childrenByParent.get(id) || []
    if (children.length === 0) {
      const x = nextX
      const y = depth * (nodeH + gapY)
      pos.set(id, { x, y })
      nextX += nodeW + gapX
      return
    }

    for (const childId of children) walk(childId, depth + 1)

    const first = pos.get(children[0])
    const last = pos.get(children[children.length - 1])
    const x = first && last ? (first.x + last.x) / 2 : nextX
    const y = depth * (nodeH + gapY)
    pos.set(id, { x, y })
  }

  if (rootId) walk(rootId, 0)

  // Normalize positions to start at 0,0.
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const [id, p] of pos.entries()) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }

  if (!Number.isFinite(minX)) minX = 0
  if (!Number.isFinite(minY)) minY = 0
  if (!Number.isFinite(maxX)) maxX = 0
  if (!Number.isFinite(maxY)) maxY = 0

  const width = padX * 2 + (maxX - minX) + nodeW
  const height = padY * 2 + (maxY - minY) + nodeH

  const positions = new Map()
  for (const [id, p] of pos.entries()) {
    positions.set(id, {
      x: padX + (p.x - minX),
      y: padY + (p.y - minY),
    })
  }

  return { width, height, positions }
}

function nodeStyle(type) {
  // Keep consistent with existing style system.
  if (type === 'root') {
    return {
      className:
        'bg-slate-900/70 border border-cyan-400/70 text-slate-100 rounded-xl shadow-sm shadow-cyan-500/10 px-4 py-2 text-sm font-semibold',
    }
  }
  if (type === 'group' || type === 'person') {
    return {
      className:
        'bg-slate-900/70 border border-violet-400/60 text-slate-100 rounded-xl shadow-sm shadow-violet-500/10 px-4 py-2 text-sm font-semibold',
    }
  }
  if (type === 'division') {
    return {
      className:
        'bg-slate-900/70 border border-sky-400/55 text-slate-100 rounded-xl shadow-sm shadow-sky-500/10 px-4 py-2 text-sm font-semibold',
    }
  }
  if (type === 'department') {
    return {
      className:
        'bg-slate-900/65 border border-emerald-400/45 text-slate-200 rounded-xl shadow-sm shadow-emerald-500/10 px-3 py-2 text-xs font-semibold',
    }
  }
  if (type === 'cross') {
    return {
      className:
        'bg-slate-900/65 border border-amber-400/50 text-slate-200 rounded-xl shadow-sm shadow-amber-500/10 px-3 py-2 text-xs font-semibold',
    }
  }
  return {
    className:
      'bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl shadow-sm px-3 py-2 text-xs font-semibold',
  }
}

export default function OrgDiagram({
  nodes = [],
  edges = [],
  viewportTransform,
  onLayout,
  nodeSize = 'md',
  showEdges = true,
}) {
  const sizes = useMemo(() => {
    if (nodeSize === 'sm') {
      // Tighter + more compact for public share view.
      return { nodeW: 160, nodeH: 38, gapX: 18, gapY: 28, padX: 34, padY: 34 }
    }
    return { nodeW: 176, nodeH: 42, gapX: 22, gapY: 34, padX: 40, padY: 40 }
  }, [nodeSize])

  const { byId, childrenByParent, rootId } = useMemo(() => buildTree(nodes), [nodes])

  const layout = useMemo(() => {
    return tidyLayout({ byId, childrenByParent, rootId }, sizes)
  }, [byId, childrenByParent, rootId, sizes])

  useEffect(() => {
    if (typeof onLayout === 'function') {
      onLayout({ width: layout.width, height: layout.height })
    }
  }, [layout.width, layout.height, onLayout])

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

  const parentEdges = useMemo(() => {
    // Prefer parentId edges for cleanliness.
    const res = []
    for (const n of nodes) {
      if (!n.parentId) continue
      res.push({ from: n.parentId, to: n.id, kind: 'reporting' })
    }

    // Optional cross edges (limit to avoid clutter)
    const cross = (edges || []).filter((e) => e.kind === 'cross')
    for (const e of cross.slice(0, 10)) res.push(e)

    return res
  }, [nodes, edges])

  return (
    <div
      className="relative"
      style={{ width: layout.width, height: layout.height, ...transformStyle }}
    >
      {showEdges ? (
        <svg
          width={layout.width}
          height={layout.height}
          className="absolute inset-0"
          aria-hidden="true"
        >
          {parentEdges.map((e) => {
            const a = layout.positions.get(e.from)
            const b = layout.positions.get(e.to)
            if (!a || !b) return null

            const from = { x: a.x + sizes.nodeW / 2, y: a.y + sizes.nodeH }
            const to = { x: b.x + sizes.nodeW / 2, y: b.y }

            const midY = (from.y + to.y) / 2
            const d = `M ${from.x} ${from.y} C ${from.x} ${midY} ${to.x} ${midY} ${to.x} ${to.y}`

            const isCross = e.kind === 'cross'
            return (
              <path
                key={`${e.from}-${e.to}-${e.kind}`}
                d={d}
                fill="none"
                stroke={isCross ? 'rgba(251,191,36,0.35)' : 'rgba(148,163,184,0.58)'}
                strokeWidth={isCross ? 1.25 : 1.75}
                strokeDasharray={isCross ? '6 6' : undefined}
              />
            )
          })}
        </svg>
      ) : null}

      {nodes.map((n) => {
        const p = layout.positions.get(n.id)
        if (!p) return null
        const meta = nodeStyle(n.type)

        return (
          <div
            key={n.id}
            className={meta.className}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: sizes.nodeW,
              height: sizes.nodeH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
            title={n.label}
          >
            <span className="truncate" style={{ maxWidth: sizes.nodeW - 20 }}>
              {n.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
