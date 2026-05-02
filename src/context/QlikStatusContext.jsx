/**
 * QlikStatusContext – shared context that tracks the Qlik API data source
 * across all sections that depend on it.
 *
 * Any hook or component that fetches from Qlik calls `setQlikSource`:
 *   - 'api'   → live data from Qlik Engine
 *   - 'local' → fallback to local JSON (API unavailable)
 *   - null    → not yet resolved (e.g. first load)
 *
 * The Topbar reads `qlikSource` and renders a pill badge.
 *
 * Multiple sections can report. The context keeps the *most pessimistic*
 * value: if any section is 'local', the pill shows Local.
 */
import { createContext, useCallback, useContext, useRef, useState } from 'react'

const QlikStatusContext = createContext(null)

export function QlikStatusProvider({ children }) {
  // Map of { sectionKey → 'api' | 'local' }
  const reportMap = useRef({})
  const [qlikSource, setQlikSourceState] = useState(null)

  const recompute = useCallback((map) => {
    const values = Object.values(map)
    if (!values.length) {
      setQlikSourceState(null)
      return
    }
    // If any section fell back to local, show Local.
    const hasLocal = values.some((v) => v === 'local')
    setQlikSourceState(hasLocal ? 'local' : 'api')
  }, [])

  /**
   * Report the data source for a named section.
   * Pass source=null to unregister the section (e.g. on unmount).
   * @param {string} section – unique key, e.g. 'creolabs-breakdown', 'profitable-ranking'
   * @param {'api'|'local'|null} source
   */
  const reportQlikSource = useCallback(
    (section, source) => {
      if (source == null) {
        // Unregister: remove the section key so it no longer contributes.
        const next = { ...reportMap.current }
        delete next[section]
        reportMap.current = next
      } else {
        reportMap.current = { ...reportMap.current, [section]: source }
      }
      recompute(reportMap.current)
    },
    [recompute]
  )

  return (
    <QlikStatusContext.Provider value={{ qlikSource, reportQlikSource }}>
      {children}
    </QlikStatusContext.Provider>
  )
}

export function useQlikStatus() {
  const ctx = useContext(QlikStatusContext)
  if (!ctx) throw new Error('useQlikStatus must be used inside QlikStatusProvider')
  return ctx
}
