import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ongoingItems from '../data/ongoingItems'
import { strategicObjectives, projects2026 } from '../../roadmap/data/roadmapData'
import { useI18n } from '../../../i18n/I18nContext'

const platformAreas = ['Trading', 'Analytics', 'Payments', 'Infra', 'Profile', 'Internal']
const departments = ['Infrastructure', 'Product', 'Data', 'Compliance', 'UX', 'Partners']
const statusFilters = ['All', 'Active', 'Blocked', 'Done']

const impactTypes = ['revenue', 'retention', 'risk_reduction', 'efficiency']
const STORAGE_KEY = 'bw_execution_tasks_v1'

function mapById(list, labelKey = 'label') {
  return list.reduce((acc, item) => {
    acc[item.id] = { label: item[labelKey], ...item }
    return acc
  }, {})
}

function loadTasks(seed) {
  if (typeof window === 'undefined') return seed
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return parsed
  } catch (e) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

export default function OngoingPage() {
  const { t } = useI18n()
  const megaMap = useMemo(() => mapById(strategicObjectives), [])
  const storyMap = useMemo(() => mapById(projects2026, 'activity'), [])

  const validateTask = useCallback(
    (task) => {
      if (!megaMap[task.megaStoryId])
        return { valid: false, reason: t('ongoing.triage.reason.unknownMegaStoryId') }
      const story = storyMap[task.storyId]
      if (!story) return { valid: false, reason: t('ongoing.triage.reason.unknownStoryId') }
      if (story.objectiveId && story.objectiveId !== task.megaStoryId)
        return { valid: false, reason: t('ongoing.triage.reason.storyNotUnderMegaStoryId') }
      return { valid: true }
    },
    [megaMap, storyMap, t]
  )

  const [tasks, setTasks] = useState(() => loadTasks(ongoingItems))
  const [viewMode, setViewMode] = useState('active')
  const [megaFilter, setMegaFilter] = useState('All')
  const [storyFilter, setStoryFilter] = useState('All')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [showImpactModal, setShowImpactModal] = useState(false)
  const [impactDraft, setImpactDraft] = useState({
    impactType: '',
    impactedDepartment: '',
    impactedPlatformArea: '',
    impactedKPI: '',
    impactNote: '',
  })
  const [triageOpen, setTriageOpen] = useState(false)
  const [fixMega, setFixMega] = useState('')
  const [fixStory, setFixStory] = useState('')

  const selectedTask = tasks.find((t) => t.id === selectedId) || null
  const selectedValidation = selectedTask ? validateTask(selectedTask) : null

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (e) {
      // ignore persist errors
    }
  }, [tasks])

  const resetToSeed = () => {
    const ok = window.confirm(t('ongoing.confirm.resetToSeed'))
    if (!ok) return
    setTasks(ongoingItems)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ongoingItems))
    } catch (e) {
      // ignore persist errors
    }
  }

  const { validTasks, triageTasks } = useMemo(() => {
    const valid = []
    const triage = []
    tasks.forEach((task) => {
      const verdict = validateTask(task)
      if (verdict.valid) {
        valid.push(task)
      } else {
        triage.push({ ...task, triageReason: verdict.reason })
      }
    })
    return { validTasks: valid, triageTasks: triage }
  }, [tasks, validateTask])

  const storyOptions = useMemo(() => {
    const filtered = validTasks.filter((t) =>
      megaFilter === 'All' ? true : t.megaStoryId === megaFilter
    )
    const ids = Array.from(new Set(filtered.map((t) => t.storyId)))
    return ['All', ...ids]
  }, [megaFilter, validTasks])

  const baseFiltered = useMemo(() => {
    const scope =
      viewMode === 'done'
        ? validTasks.filter((t) => t.status === 'done')
        : validTasks.filter((t) => t.status !== 'done')
    return scope
      .filter((t) => (megaFilter === 'All' ? true : t.megaStoryId === megaFilter))
      .filter((t) => (storyFilter === 'All' ? true : t.storyId === storyFilter))
      .filter((t) => (departmentFilter === 'All' ? true : t.department === departmentFilter))
      .filter((t) => (platformFilter === 'All' ? true : t.platformArea === platformFilter))
      .filter((t) => (statusFilter === 'All' ? true : t.status === statusFilter.toLowerCase()))
      .sort((a, b) => {
        const statusRank = { active: 0, blocked: 1, done: 2 }
        const priorityRank = { high: 0, medium: 1, low: 2 }
        if (statusRank[a.status] !== statusRank[b.status])
          return statusRank[a.status] - statusRank[b.status]
        if (priorityRank[a.priority] !== priorityRank[b.priority])
          return priorityRank[a.priority] - priorityRank[b.priority]
        return a.createdAt.localeCompare(b.createdAt)
      })
  }, [
    departmentFilter,
    megaFilter,
    platformFilter,
    statusFilter,
    storyFilter,
    validTasks,
    viewMode,
  ])

  useEffect(() => {
    if (viewMode === 'done') {
      setStatusFilter('Done')
    } else if (statusFilter === 'Done') {
      setStatusFilter('All')
    }
  }, [statusFilter, viewMode])

  useEffect(() => {
    const exists = tasks.some((t) => t.id === selectedId)
    if (selectedId && exists) return
    if (baseFiltered.length > 0) {
      setSelectedId(baseFiltered[0].id)
      return
    }
    if (triageTasks.length > 0) {
      setSelectedId(triageTasks[0].id)
      return
    }
    setSelectedId(null)
  }, [baseFiltered, selectedId, tasks, triageTasks])

  useEffect(() => {
    if (selectedTask) {
      setFixMega(selectedTask.megaStoryId || '')
      setFixStory(selectedTask.storyId || '')
    } else {
      setFixMega('')
      setFixStory('')
    }
  }, [selectedTask])

  const totals = useMemo(() => {
    const base = { active: 0, blocked: 0, done: 0 }
    validTasks.forEach((t) => {
      base[t.status] += 1
    })
    return base
  }, [validTasks])

  const handleMarkDone = () => {
    if (!selectedTask) return
    setImpactDraft({
      impactType: '',
      impactedDepartment: '',
      impactedPlatformArea: '',
      impactedKPI: '',
      impactNote: '',
    })
    setShowImpactModal(true)
  }

  const saveImpact = () => {
    if (!selectedTask) return
    const { impactType, impactedDepartment, impactedPlatformArea, impactedKPI } = impactDraft
    if (!impactType || !impactedDepartment || !impactedPlatformArea || !impactedKPI) return
    const completedAt = new Date().toISOString().slice(0, 10)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
          ? {
              ...t,
              status: 'done',
              impactType,
              impactedDepartment,
              impactedPlatformArea,
              impactedKPI,
              impactNote: impactDraft.impactNote,
              completedAt,
            }
          : t
      )
    )
    setShowImpactModal(false)
    setViewMode('done')
    setStatusFilter('Done')
  }

  const storyLabel = (storyId) => storyMap[storyId]?.label || storyId
  const megaLabel = (megaId) => megaMap[megaId]?.label || megaId
  const triageFixStories = useMemo(
    () => Object.values(storyMap).filter((s) => !fixMega || s.objectiveId === fixMega),
    [fixMega, storyMap]
  )

  return (
    <div className="ongoing-page">
      <div className="ongoing-header card-global">
        <div className="ongoing-title-wrap">
          <p className="ongoing-label">{t('ongoing.header.layerLabel')}</p>
          <h1 className="ongoing-title">{t('ongoing.header.title')}</h1>
          <p className="ongoing-subtitle">{t('ongoing.header.subtitle')}</p>
        </div>
        <div className="ongoing-header-actions">
          <div className="ongoing-counter-pill">
            <span className="pill-dot dot-progress" aria-hidden="true" />
            <span>{t('ongoing.counters.active', { count: totals.active })}</span>
            <span className="pill-sep">·</span>
            <span className="pill-blocked">
              {t('ongoing.counters.blocked', { count: totals.blocked })}
            </span>
            <span className="pill-sep">·</span>
            <span>{t('ongoing.counters.done', { count: totals.done })}</span>
          </div>
          <button type="button" className="btn secondary" onClick={resetToSeed}>
            {t('ongoing.actions.resetToSeed')}
          </button>
          <div className="ongoing-toggle">
            <button
              type="button"
              className={`chip ${viewMode === 'active' ? 'active' : ''}`}
              onClick={() => setViewMode('active')}
            >
              {t('ongoing.toggle.active')}
            </button>
            <button
              type="button"
              className={`chip ${viewMode === 'done' ? 'active' : ''}`}
              onClick={() => setViewMode('done')}
            >
              {t('ongoing.toggle.done')}
            </button>
          </div>
        </div>
      </div>

      <div className="ongoing-kpi-grid">
        <div className="ongoing-kpi card">
          <span className="kpi-label">{t('ongoing.kpis.activeExecution')}</span>
          <div className="kpi-value">{totals.active + totals.blocked}</div>
        </div>
        <div className="ongoing-kpi card">
          <span className="kpi-label">{t('ongoing.kpis.active')}</span>
          <div className="kpi-value">{totals.active}</div>
        </div>
        <div className="ongoing-kpi card">
          <span className="kpi-label">{t('ongoing.kpis.blocked')}</span>
          <div className="kpi-value">{totals.blocked}</div>
        </div>
        <div className="ongoing-kpi card">
          <span className="kpi-label">{t('ongoing.kpis.doneHistory')}</span>
          <div className="kpi-value">{totals.done}</div>
        </div>
      </div>

      <div className="ongoing-filters card">
        <div className="filter-field">
          <label>{t('ongoing.filters.megaStory')}</label>
          <select value={megaFilter} onChange={(e) => setMegaFilter(e.target.value)}>
            <option value="All">{t('common.all')}</option>
            {Object.keys(megaMap).map((id) => (
              <option key={id} value={id}>
                {megaLabel(id)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t('ongoing.filters.story')}</label>
          <select value={storyFilter} onChange={(e) => setStoryFilter(e.target.value)}>
            {storyOptions.map((id) => (
              <option key={id} value={id}>
                {id === 'All' ? t('common.all') : storyLabel(id)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t('ongoing.filters.department')}</label>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="All">{t('common.all')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {t(`departments.${d}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t('ongoing.filters.platformArea')}</label>
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
            <option value="All">{t('common.all')}</option>
            {platformAreas.map((p) => (
              <option key={p} value={p}>
                {t(`ongoing.platformArea.${p}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t('ongoing.filters.status')}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={viewMode === 'done'}
          >
            {statusFilters.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? t('common.all') : t(`ongoing.status.${s.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ongoing-layout">
        <div className="ongoing-feed card">
          <div className="ongoing-feed-header">
            <div>
              <p className="ongoing-label">
                {viewMode === 'done'
                  ? t('ongoing.feed.historyLabel')
                  : t('ongoing.feed.executionFeedLabel')}
              </p>
              <h3 className="ongoing-feed-title">
                {viewMode === 'done'
                  ? t('ongoing.feed.completedTasksTitle')
                  : t('ongoing.feed.activeExecutionTitle')}
              </h3>
            </div>
            <span className="feed-count">
              {t('ongoing.feed.itemsCount', { count: baseFiltered.length })}
            </span>
          </div>
          <div className="ongoing-feed-list">
            {baseFiltered.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`ongoing-card ${selectedId === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="ongoing-card-header">
                  <div>
                    <div className="ongoing-card-title">{item.title}</div>
                    <div className="ongoing-card-meta">
                      <span className="ongoing-pill subtle">{megaLabel(item.megaStoryId)}</span>
                      <span className="ongoing-pill subtle">{storyLabel(item.storyId)}</span>
                      <span className={`ongoing-badge status-${item.status}`}>
                        {t(`ongoing.status.${item.status}`)}
                      </span>
                      <span className={`ongoing-badge priority-${item.priority}`}>
                        {t(`ongoing.priority.${item.priority}`)}
                      </span>
                      <span className="ongoing-pill">{item.owner}</span>
                    </div>
                  </div>
                  <div className="ongoing-updated">
                    {viewMode === 'done'
                      ? t('ongoing.card.completed', { date: item.completedAt || '—' })
                      : t('ongoing.card.created', { date: item.createdAt })}
                  </div>
                </div>
                <div className="ongoing-line">
                  <span className="label">{t('ongoing.labels.nextStep')}</span>
                  <span className="value">{item.nextStep}</span>
                </div>
                {item.status === 'blocked' && item.dependencies?.length > 0 && (
                  <div className="ongoing-line">
                    <span className="label">{t('ongoing.labels.blocker')}</span>
                    <span className="value">{item.dependencies.join(' • ')}</span>
                  </div>
                )}
                {viewMode === 'done' && item.impactType && (
                  <div className="ongoing-line">
                    <span className="label">{t('ongoing.labels.impact')}</span>
                    <span className="value">{`${t(`ongoing.impactType.${item.impactType}`)} · ${t(`departments.${item.impactedDepartment}`)} · ${t(`ongoing.platformArea.${item.impactedPlatformArea}`)}`}</span>
                  </div>
                )}
              </button>
            ))}
            {baseFiltered.length === 0 && (
              <div className="ongoing-empty">{t('ongoing.empty.noTasksMatchFilters')}</div>
            )}
          </div>
        </div>

        <aside className="ongoing-details card">
          {selectedTask ? (
            <div className="ongoing-details-content">
              <div className="ongoing-detail-head">
                <div>
                  <p className="ongoing-label">{t('ongoing.details.title')}</p>
                  <h3 className="ongoing-detail-title">{selectedTask.title}</h3>
                  <div className="detail-subline">
                    {megaLabel(selectedTask.megaStoryId)} · {storyLabel(selectedTask.storyId)}
                  </div>
                </div>
                <div className="ongoing-detail-badges">
                  <span className={`ongoing-badge status-${selectedTask.status}`}>
                    {t(`ongoing.status.${selectedTask.status}`)}
                  </span>
                  <span className={`ongoing-badge priority-${selectedTask.priority}`}>
                    {t(`ongoing.priority.${selectedTask.priority}`)}
                  </span>
                  <span className="ongoing-pill">
                    {t(`departments.${selectedTask.department}`)}
                  </span>
                  <span className="ongoing-pill subtle">
                    {t(`ongoing.platformArea.${selectedTask.platformArea}`)}
                  </span>
                </div>
              </div>

              {selectedValidation && !selectedValidation.valid && (
                <div className="ongoing-detail-section">
                  <div className="detail-label">{t('ongoing.triage.needsTriage')}</div>
                  <p className="detail-text">{selectedValidation.reason}</p>
                  <div className="detail-label" style={{ marginTop: 8 }}>
                    {t('ongoing.filters.megaStory')}
                  </div>
                  <select
                    value={fixMega}
                    onChange={(e) => {
                      setFixMega(e.target.value)
                      setFixStory('')
                    }}
                  >
                    <option value="">{t('ongoing.triage.selectMegaStory')}</option>
                    {Object.keys(megaMap).map((id) => (
                      <option key={id} value={id}>
                        {megaLabel(id)}
                      </option>
                    ))}
                  </select>
                  <div className="detail-label" style={{ marginTop: 8 }}>
                    {t('ongoing.filters.story')}
                  </div>
                  <select
                    value={fixStory}
                    onChange={(e) => setFixStory(e.target.value)}
                    disabled={!fixMega}
                  >
                    <option value="">{t('ongoing.triage.selectStory')}</option>
                    {triageFixStories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <div className="ongoing-detail-actions" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        if (!fixMega || !fixStory) return
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === selectedTask.id
                              ? { ...t, megaStoryId: fixMega, storyId: fixStory }
                              : t
                          )
                        )
                      }}
                    >
                      {t('ongoing.triage.saveMapping')}
                    </button>
                  </div>
                </div>
              )}

              <div className="ongoing-detail-section">
                <div className="detail-label">{t('ongoing.details.objective')}</div>
                <p className="detail-text">{selectedTask.objective}</p>
              </div>
              <div className="ongoing-detail-section">
                <div className="detail-label">{t('ongoing.details.nextStep')}</div>
                <p className="detail-text">{selectedTask.nextStep}</p>
              </div>
              {selectedTask.dependencies?.length > 0 && (
                <div className="ongoing-detail-section">
                  <div className="detail-label">{t('ongoing.details.dependenciesBlockers')}</div>
                  <p className="detail-text">{selectedTask.dependencies.join(' · ')}</p>
                </div>
              )}
              <div className="ongoing-detail-section">
                <div className="detail-label">{t('ongoing.details.created')}</div>
                <p className="detail-text">{selectedTask.createdAt}</p>
              </div>

              {selectedTask.status === 'done' && (
                <div className="ongoing-detail-section">
                  <div className="detail-label">{t('ongoing.details.impact')}</div>
                  <p className="detail-text">
                    {selectedTask.impactType
                      ? `${t(`ongoing.impactType.${selectedTask.impactType}`)} · ${t(`departments.${selectedTask.impactedDepartment}`)} · ${t(`ongoing.platformArea.${selectedTask.impactedPlatformArea}`)}`
                      : t('ongoing.details.capturedWhenDone')}
                  </p>
                  {selectedTask.impactedKPI && (
                    <p className="detail-text">
                      {t('ongoing.details.kpi')}: {selectedTask.impactedKPI}
                    </p>
                  )}
                  {selectedTask.impactNote && (
                    <p className="detail-text">
                      {t('ongoing.details.note')}: {selectedTask.impactNote}
                    </p>
                  )}
                  {selectedTask.completedAt && (
                    <p className="detail-text">
                      {t('ongoing.details.completedOn', { date: selectedTask.completedAt })}
                    </p>
                  )}
                </div>
              )}

              {selectedTask.status !== 'done' && selectedValidation?.valid && (
                <div className="ongoing-detail-actions">
                  <button type="button" className="btn secondary" onClick={handleMarkDone}>
                    {t('ongoing.actions.markAsDone')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ongoing-empty">
              <p className="ongoing-label">{t('ongoing.details.panelTitle')}</p>
              <h3 className="ongoing-feed-title">{t('ongoing.details.selectTask')}</h3>
            </div>
          )}
        </aside>
      </div>

      {showImpactModal && (
        <div className="modal-backdrop">
          <div className="modal-card modal-form">
            <div className="modal-header">
              <div>
                <div className="detail-label">{t('ongoing.modal.title')}</div>
                <h3 style={{ margin: 0 }}>{selectedTask?.title}</h3>
              </div>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowImpactModal(false)}
              >
                {t('common.close')}
              </button>
            </div>

            <div className="modal-form__grid">
              <div className="modal-section">
                <div className="label">{t('ongoing.modal.impactType')}</div>
                <select
                  value={impactDraft.impactType}
                  onChange={(e) => setImpactDraft((d) => ({ ...d, impactType: e.target.value }))}
                >
                  <option value="">{t('ongoing.modal.selectImpactType')}</option>
                  {impactTypes.map((impactType) => (
                    <option key={impactType} value={impactType}>
                      {t(`ongoing.impactType.${impactType}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-section">
                <div className="label">{t('ongoing.modal.impactedDepartment')}</div>
                <select
                  value={impactDraft.impactedDepartment}
                  onChange={(e) =>
                    setImpactDraft((d) => ({ ...d, impactedDepartment: e.target.value }))
                  }
                >
                  <option value="">{t('ongoing.modal.selectDepartment')}</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {t(`departments.${d}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-section">
                <div className="label">{t('ongoing.modal.impactedPlatformArea')}</div>
                <select
                  value={impactDraft.impactedPlatformArea}
                  onChange={(e) =>
                    setImpactDraft((d) => ({ ...d, impactedPlatformArea: e.target.value }))
                  }
                >
                  <option value="">{t('ongoing.modal.selectPlatformArea')}</option>
                  {platformAreas.map((p) => (
                    <option key={p} value={p}>
                      {t(`ongoing.platformArea.${p}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-section">
                <div className="label">{t('ongoing.modal.impactedKpi')}</div>
                <input
                  type="text"
                  value={impactDraft.impactedKPI}
                  onChange={(e) => setImpactDraft((d) => ({ ...d, impactedKPI: e.target.value }))}
                  placeholder={t('ongoing.placeholder.example')}
                />
              </div>
              <div className="modal-section modal-form__full">
                <div className="label">{t('ongoing.modal.impactNoteOptional')}</div>
                <textarea
                  rows={3}
                  value={impactDraft.impactNote}
                  onChange={(e) => setImpactDraft((d) => ({ ...d, impactNote: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-form__footer ongoing-detail-actions" style={{ marginTop: 6 }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowImpactModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button type="button" className="btn" onClick={saveImpact}>
                {t('ongoing.modal.saveImpactClose')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
        <div
          className="ongoing-feed-header"
          style={{ cursor: 'pointer' }}
          onClick={() => setTriageOpen((v) => !v)}
        >
          <div>
            <p className="ongoing-label">{t('ongoing.triage.needsTriage')}</p>
            <h3 className="ongoing-feed-title">{t('ongoing.triage.mappingFixesRequired')}</h3>
          </div>
          <div className="ongoing-pill subtle">{triageTasks.length}</div>
        </div>
        {triageOpen && (
          <div className="ongoing-feed-list">
            {triageTasks.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`ongoing-card ${selectedId === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="ongoing-card-header">
                  <div>
                    <div className="ongoing-card-title">{item.title}</div>
                    <div className="ongoing-card-meta">
                      <span className={`ongoing-badge priority-${item.priority}`}>
                        {t(`ongoing.priority.${item.priority}`)}
                      </span>
                    </div>
                  </div>
                  <div className="ongoing-updated">
                    {item.megaStoryId || t('ongoing.triage.noMega')} ·{' '}
                    {item.storyId || t('ongoing.triage.noStory')}
                  </div>
                </div>
                <div className="ongoing-line">
                  <span className="label">{t('ongoing.triage.reasonLabel')}</span>
                  <span className="value">{item.triageReason}</span>
                </div>
              </button>
            ))}
            {triageTasks.length === 0 && (
              <div className="ongoing-empty">{t('ongoing.triage.noTasks')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
