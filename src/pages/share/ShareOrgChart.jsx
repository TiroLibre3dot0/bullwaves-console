import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'
import OrgDiagram from '../../components/orgchart/OrgDiagram'
import { buildPublicOrgTreeModel } from '../../components/orgchart/orgModel'
import { sections } from '../orgChartData'
import { track } from '../../utils/analytics'

function buildPeopleFromSections() {
  return sections.flatMap((section) => {
    const roles = Array.isArray(section.roles) ? section.roles : []
    return roles.map((r) => ({
      ...r,
      sectionId: section.id,
      sectionTitle: section.title,
    }))
  })
}

export default function ShareOrgChart() {
  const { t } = useI18n()

  const containerRef = useRef(null)
  const dragRef = useRef({
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  })
  const didInitRef = useRef(false)

  const [layout, setLayout] = useState(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const [dragging, setDragging] = useState(false)

  const people = useMemo(() => buildPeopleFromSections(), [])

  const labels = useMemo(
    () => ({
      ceo: t('orgChart.hierarchyItem.ceo'),
      managementTeam: t('orgChart.hierarchyItem.management'),
      categories: {
        'management-team': t('orgChart.toc.management'),
        'area-responsibility': t('orgChart.toc.areaLayer'),
        'support-team': t('orgChart.toc.support'),
        operations: t('orgChart.toc.operations'),
        affiliation: t('orgChart.toc.affiliation'),
        'business-development': t('orgChart.toc.businessDev'),
        marketing: t('orgChart.toc.marketing'),
        finance: t('orgChart.toc.finance'),
        payments: t('orgChart.toc.payments'),
        compliance: t('orgChart.toc.compliance'),
        dealing: t('orgChart.toc.dealing'),
      },
    }),
    [t]
  )

  const showNames = useMemo(() => {
    if (typeof window === 'undefined') return true
    const params = new window.URLSearchParams(window.location.search)
    const v = params.get('names')
    if (v == null) return true
    return v !== '0' && v !== 'false'
  }, [])

  const model = useMemo(() => {
    return buildPublicOrgTreeModel(people, {
      labels,
      showTopManagementNames: showNames,
      rootLabel: 'Bullwaves',
      includeDepartmentsRoles: false,
      includeCrossEdges: false,
    })
  }, [people, labels, showNames])

  const hasCrossEdges = useMemo(() => {
    return (model?.orgEdges || []).some((e) => e?.kind === 'cross')
  }, [model])

  useEffect(() => {
    if (didInitRef.current) return
    if (!layout) return
    if (!containerRef.current) return

    const el = containerRef.current
    const rect = el.getBoundingClientRect()

    // Slightly higher min zoom so the diagram is readable by default.
    // Users can always zoom out if the org is very wide.
    const scale = clamp(
      Math.min(rect.width / layout.width, rect.height / layout.height) * 0.92,
      0.75,
      1.15
    )
    const cx = (rect.width - layout.width * scale) / 2
    const cy = (rect.height - layout.height * scale) / 2

    didInitRef.current = true
    setView({ x: Number.isFinite(cx) ? cx : 0, y: Number.isFinite(cy) ? cy : 0, scale })
  }, [layout])

  const resetView = () => {
    didInitRef.current = false
    // trigger re-center on next effect tick
    setLayout((l) => (l ? { ...l } : l))
  }

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

  const onPointerDown = (e) => {
    if (!containerRef.current) return
    if (e.button != null && e.button !== 0) return

    const next = {
      dragging: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: view.x,
      baseY: view.y,
    }
    dragRef.current = next
    setDragging(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d.dragging) return
    if (d.pointerId != null && e.pointerId !== d.pointerId) return

    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    setView((prev) => ({ ...prev, x: d.baseX + dx, y: d.baseY + dy }))
  }

  const stopDrag = (e) => {
    const d = dragRef.current
    if (!d.dragging) return
    if (d.pointerId != null && e.pointerId !== d.pointerId) return
    dragRef.current = { dragging: false, pointerId: null, startX: 0, startY: 0, baseX: 0, baseY: 0 }
    setDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const onWheel = (e) => {
    if (!containerRef.current) return
    // prevent page scroll, use wheel to zoom
    e.preventDefault()

    const rect = containerRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    setView((prev) => {
      const direction = e.deltaY < 0 ? 1 : -1
      const factor = direction > 0 ? 1.08 : 0.92
      const nextScale = clamp(prev.scale * factor, 0.5, 1.35)

      // zoom around cursor
      const contentX = (px - prev.x) / prev.scale
      const contentY = (py - prev.y) / prev.scale

      const nextX = px - contentX * nextScale
      const nextY = py - contentY * nextScale

      return { x: nextX, y: nextY, scale: nextScale }
    })
  }

  useEffect(() => {
    track('page_view', { page: 'ShareOrgChart', access: 'public' })
  }, [])

  return (
    <div className="w-full min-h-screen">
      <div className="w-full px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2" aria-label="Bullwaves">
            <img src="/Logo.png" alt="Bullwaves" className="h-9 w-auto" />
          </a>

          <div className="text-xs text-slate-400 hidden sm:block">{t('orgChart.title')}</div>

          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-slate-700 text-slate-200 bg-slate-900/70 hover:border-cyan-400 hover:text-white text-sm"
            onClick={() => {
              resetView()
            }}
            title="Re-center"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="w-full px-4 md:px-6 pb-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="relative" style={{ height: 'calc(100vh - 110px)' }}>
            <div
              ref={containerRef}
              className="absolute inset-0"
              style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              onWheel={onWheel}
            >
              <div className="absolute left-4 top-4 z-10 text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                Drag to move • Scroll to zoom • No contact details
              </div>

              <div className="absolute left-4 bottom-4 z-10 text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                <div className="flex flex-wrap gap-3">
                  <span>
                    <span className="inline-block w-3 h-[2px] bg-slate-400/60 align-middle mr-2" />
                    Solid = reporting
                  </span>
                  {hasCrossEdges ? (
                    <span>
                      <span className="inline-block w-3 h-[2px] border-t-2 border-dashed border-slate-400/60 align-middle mr-2" />
                      Dashed = cross-functional
                    </span>
                  ) : null}
                </div>
              </div>

              <OrgDiagram
                nodes={model.orgNodes}
                edges={model.orgEdges}
                viewportTransform={view}
                onLayout={(d) => setLayout(d)}
                nodeSize="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
