import { useEffect, useState, useCallback } from 'react'
import { fetchFirstOkCsvRowsCached } from '../../../lib/fetchCache'

const EMPTY_PATHS = []
const IDENTITY_ROW = (r) => r

// Generic CSV loader with fallback paths and optional row mapping
export function useCsvData(
  candidatePaths = EMPTY_PATHS,
  mapRow = IDENTITY_ROW,
  { enabled = true } = {}
) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sourcePath, setSourcePath] = useState(null)

  const load = useCallback(
    async (force = false) => {
      if (!enabled) {
        setData([])
        setSourcePath(null)
        setError(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const { rows, sourcePath: used } = await fetchFirstOkCsvRowsCached(candidatePaths, {
          force,
        })
        setData((rows || []).map(mapRow))
        setSourcePath(used)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    },
    [candidatePaths, mapRow, enabled]
  )

  useEffect(() => {
    load()
  }, [load])

  // When uploads complete, `UploadReportsPage` bumps bw_reports_version and emits an event.
  // Refresh CSV-backed data automatically so dashboards reflect the new reports without manual reload.
  useEffect(() => {
    if (!enabled) return
    const onReportsUpdated = () => {
      load(true)
    }

    const onStorage = (e) => {
      if (!e || e.key === 'bw_reports_version') onReportsUpdated()
    }

    window.addEventListener('bw-reports-updated', onReportsUpdated)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('bw-reports-updated', onReportsUpdated)
      window.removeEventListener('storage', onStorage)
    }
  }, [enabled, load])

  return { data, loading, error, sourcePath, reload: load }
}

export default useCsvData
