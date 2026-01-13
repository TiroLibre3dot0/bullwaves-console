import { useEffect, useState, useCallback } from 'react'
import { fetchFirstOkCsvRowsCached } from '../../../lib/fetchCache'

// Generic CSV loader with fallback paths and optional row mapping
export function useCsvData(candidatePaths = [], mapRow = (r) => r) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sourcePath, setSourcePath] = useState(null)

  const load = useCallback(
    async (force = false) => {
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
    [candidatePaths, mapRow]
  )

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, sourcePath, reload: load }
}

export default useCsvData
