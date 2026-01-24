import React, { useEffect, useMemo } from 'react'
import ProjectBoardPage from '../ProjectBoardPage'
import { decodeSharePayload } from '../../../utils/shareCodec'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'

export default function PublicProjectBoardSharePage({ token }) {
  const decoded = useMemo(() => decodeSharePayload(token), [token])

  useEffect(() => {
    setOpenGraphMeta({
      title: 'Project Board — Board View',
      description: 'Public read-only view of the Project Board (Kanban).',
      image: '/Logo.png',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })
    return () => resetOpenGraphMeta()
  }, [])

  const isValid =
    decoded &&
    decoded.v === 1 &&
    Array.isArray(decoded.tasks) &&
    decoded.tasks.every((t) => t && typeof t === 'object' && typeof t.id === 'string')

  if (!isValid) {
    return (
      <div style={{ minHeight: '100vh', background: '#070b14', color: '#e2e8f0', padding: 24 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ fontSize: 22, fontWeight: 950 }}>Project Board</div>
          <div style={{ marginTop: 8, color: 'rgba(148,163,184,0.95)', fontWeight: 700 }}>
            Invalid or expired link.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b14' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/Logo.png"
              alt="Bullwaves"
              style={{ height: 26, width: 'auto', display: 'block', opacity: 0.95 }}
            />
          </div>
        </div>

        <div
          style={{
            marginBottom: 12,
            color: 'rgba(148,163,184,0.95)',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          Read-only share · Generated{' '}
          {decoded.generatedAt ? new Date(decoded.generatedAt).toLocaleString() : '—'}
        </div>
        <ProjectBoardPage publicMode sharePayload={decoded} />
      </div>
    </div>
  )
}
