import React, { useEffect, useMemo, useState } from 'react'
import CommandCenter from '../command-center/CommandCenterCockpit'
import { getPublicShareOrigin } from '../../utils/publicShareOrigin'
import { useI18n } from '../../i18n/I18nContext'
import LanguageSelect from '../../components/LanguageSelect'
import { buildBoardTasksFromStories, mergeTasksById } from '../project-board/storyTasksImport'

const StoriesKanbanPage = React.lazy(() => import('../stories-kanban/StoriesKanbanPage'))
const ProjectBoardPage = React.lazy(() => import('../project-board/ProjectBoardPage'))

const TAB_META_KEYS = [
  {
    key: 'commandCenter',
    labelKey: 'execHub.tabs.commandCenter',
    helperKey: 'execHub.tabs.commandCenter.helper',
  },
  {
    key: 'storiesKanban',
    labelKey: 'execHub.tabs.storiesKanban',
    helperKey: 'execHub.tabs.storiesKanban.helper',
  },
  {
    key: 'projectBoard',
    labelKey: 'execHub.tabs.tasks',
    helperKey: 'execHub.tabs.tasks.helper',
  },
]

export default function ExecutionHubPage({
  publicMode = false,
  sharePayload = null,
  activeTab,
  onChangeTab,
  showLanguageSelect = true,
}) {
  const { t, locale } = useI18n()
  const [mountedTabs, setMountedTabs] = useState(() => new Set([activeTab || 'commandCenter']))
  const [projectBoardSnapshot, setProjectBoardSnapshot] = useState(null)
  const [projectBoardFocus, setProjectBoardFocus] = useState(null)
  const [kanbanFocusStoryId, setKanbanFocusStoryId] = useState(null)
  const [kanbanFocusNonce, setKanbanFocusNonce] = useState(0)

  useEffect(() => {
    const key = activeTab || 'commandCenter'
    setMountedTabs((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [activeTab])

  const tabs = useMemo(
    () =>
      TAB_META_KEYS.map((x) => ({
        key: x.key,
        label: t(x.labelKey),
        helper: t(x.helperKey),
      })),
    [t]
  )
  const current = tabs.find((t) => t.key === activeTab) || tabs[0]

  const setTab = (key) => {
    if (!key) return
    if (typeof onChangeTab === 'function') onChangeTab(key)
  }

  const openKanban = (maybeStoryId) => {
    // If called by a click handler, this may be a React synthetic event.
    const storyId = typeof maybeStoryId === 'string' ? maybeStoryId : null
    if (storyId) {
      setKanbanFocusStoryId(storyId)
      setKanbanFocusNonce((n) => n + 1)
    } else {
      setKanbanFocusStoryId(null)
    }
    setTab('storiesKanban')
  }

  const openProjectBoard = (focus) => {
    setProjectBoardFocus(focus || null)
    setTab('projectBoard')
  }

  const createPublicLink = async () => {
    if (publicMode) return

    let tasksForShare = Array.isArray(projectBoardSnapshot?.tasks)
      ? projectBoardSnapshot.tasks
      : null

    // If the user never opened the Tasks tab, `projectBoardSnapshot` may be null.
    // In that case, fall back to seeded tasks so the public page isn't blank.
    if (!Array.isArray(tasksForShare) || tasksForShare.length === 0) {
      try {
        const mod = await import('../project-board/ProjectBoardPage')
        const seeded = typeof mod.seedTasks === 'function' ? mod.seedTasks({ locale }) : null
        if (Array.isArray(seeded) && seeded.length) tasksForShare = seeded
      } catch {
        // ignore
      }
    }

    // Always merge in story-level tasks so the board is aligned with the Stories view.
    try {
      const mod = await import('../stories-kanban/storiesSeed')
      const stories = typeof mod.seedStories === 'function' ? mod.seedStories({ locale }) : []
      const storyTasks = buildBoardTasksFromStories(stories, { t })
      tasksForShare = mergeTasksById(tasksForShare, storyTasks)
    } catch {
      // ignore
    }

    if (!Array.isArray(tasksForShare)) tasksForShare = []

    const shareOrigin = getPublicShareOrigin()
    const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    const isLocalhost = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(runtimeOrigin)

    const payload = {
      k: 'exec',
      v: 1,
      generatedAt: new Date().toISOString(),
      activeTab: activeTab || 'commandCenter',
      projectBoard: {
        title: 'Tasks',
        tasks: tasksForShare,
      },
    }

    let token = ''
    try {
      const resp = await fetch('/api/share/create-execution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })
      const data = await resp.json().catch(() => null)
      if (resp.ok && data?.ok && data?.token) token = String(data.token)
      else throw new Error(data?.error || data?.message || 'share-not-available')
    } catch {
      if (!isLocalhost) {
        window.alert(t('execHub.share.unavailable'))
        return
      }

      // Local fallback (dev only): store snapshot in localStorage (same browser/device only)
      try {
        const bytes = new Uint8Array(12)
        if (typeof window !== 'undefined' && window.crypto?.getRandomValues)
          window.crypto.getRandomValues(bytes)
        token = `share_local_${Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}`
      } catch {
        token = `share_local_${Math.random().toString(16).slice(2)}`
      }

      try {
        window.localStorage.setItem(`bw_share_execution:${token}`, JSON.stringify({ payload }))
      } catch {
        // ignore
      }
    }

    const isKvToken = token.startsWith('share_') && !token.startsWith('share_local_')
    const href = isKvToken
      ? `${shareOrigin}/s/${encodeURIComponent(token)}`
      : `${shareOrigin}/share/execution/${encodeURIComponent(token)}`

    try {
      window.open(href, '_blank', 'noopener,noreferrer')
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '18px 24px 0 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            {tabs.map((t) => {
              const isActive = t.key === (activeTab || 'commandCenter')
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    // Manual navigation should not keep a previous story-focus filter.
                    if (t.key === 'projectBoard') setProjectBoardFocus(null)
                    if (t.key === 'storiesKanban') setKanbanFocusStoryId(null)
                    setTab(t.key)
                  }}
                  className="no-card-hover"
                  style={{
                    padding: '10px 2px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: isActive ? 'rgba(226,232,240,0.94)' : 'rgba(148,163,184,0.92)',
                    fontWeight: isActive ? 950 : 800,
                    fontSize: 12,
                    letterSpacing: 0.2,
                    borderBottom: isActive
                      ? '2px solid rgba(56,189,248,0.95)'
                      : '2px solid transparent',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {showLanguageSelect ? <LanguageSelect /> : null}
            {!publicMode ? (
              <button
                type="button"
                onClick={createPublicLink}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  fontWeight: 900,
                  fontSize: 12,
                  background: 'rgba(59,130,246,0.14)',
                  border: '1px solid rgba(59,130,246,0.30)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('execHub.share.cta')}
              </button>
            ) : (
              <div style={{ width: 1, height: 1 }} />
            )}
          </div>
        </div>

        {/* Optional tiny helper line (subtle, left-aligned) */}
        <div
          style={{ marginTop: 10, color: 'rgba(148,163,184,0.82)', fontWeight: 650, fontSize: 12 }}
        >
          {current?.helper}
        </div>

        {/* Share button is in the top-right */}
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: '0 0 18px 0' }}>
        <div style={{ height: '100%' }}>
          {mountedTabs.has('commandCenter') ? (
            <div
              style={{ display: activeTab === 'commandCenter' ? 'block' : 'none', height: '100%' }}
            >
              <CommandCenter
                embedded
                publicMode={publicMode}
                onOpenKanban={openKanban}
                onOpenProjectBoard={() => {
                  openProjectBoard(null)
                }}
                onDrillDown={() => {
                  // Back-compat fallback if CommandCenter uses it.
                  openKanban(null)
                }}
              />
            </div>
          ) : null}

          {mountedTabs.has('storiesKanban') ? (
            <div
              style={{ display: activeTab === 'storiesKanban' ? 'block' : 'none', height: '100%' }}
            >
              <React.Suspense
                fallback={
                  <div style={{ padding: 24, color: 'rgba(148,163,184,0.9)' }}>
                    {t('common.loading')}
                  </div>
                }
              >
                <StoriesKanbanPage
                  embedded
                  publicMode={publicMode}
                  onOpenProjectBoard={openProjectBoard}
                  focusStoryId={kanbanFocusStoryId}
                  focusNonce={kanbanFocusNonce}
                />
              </React.Suspense>
            </div>
          ) : null}

          {mountedTabs.has('projectBoard') ? (
            <div
              style={{ display: activeTab === 'projectBoard' ? 'block' : 'none', height: '100%' }}
            >
              <React.Suspense
                fallback={
                  <div style={{ padding: 24, color: 'rgba(148,163,184,0.9)' }}>
                    {t('common.loading')}
                  </div>
                }
              >
                <ProjectBoardPage
                  embedded
                  publicMode={publicMode}
                  focus={projectBoardFocus}
                  onClearFocus={() => setProjectBoardFocus(null)}
                  sharePayload={
                    sharePayload?.projectBoard?.tasks
                      ? {
                          board: { title: sharePayload?.projectBoard?.title || 'Tasks' },
                          tasks: sharePayload.projectBoard.tasks,
                        }
                      : null
                  }
                  onShareSnapshot={publicMode ? undefined : setProjectBoardSnapshot}
                />
              </React.Suspense>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
