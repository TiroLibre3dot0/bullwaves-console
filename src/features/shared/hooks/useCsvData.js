import { useEffect, useState, useCallback } from 'react'
import { parseCsv } from '../../../lib/csv'

// Generic CSV loader with fallback paths and optional row mapping
export function useCsvData(candidatePaths = [], mapRow = (r) => r) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sourcePath, setSourcePath] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let text = ''
      let used = null
      for (const path of candidatePaths) {
        const resp = await fetch(path)
        if (resp.ok) {
          text = await resp.text()
          used = path
          break
        }
      }
      if (!text) {
        setData([])
        setSourcePath(null)
        return
      }
      const rows = parseCsv(text).map(mapRow)
      setData(rows)
      setSourcePath(used)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [candidatePaths, mapRow])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, sourcePath, reload: load }
}

export default useCsvData
