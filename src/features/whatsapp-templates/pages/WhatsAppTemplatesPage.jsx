/* global AbortController */
import { useEffect, useState } from 'react'
import ConvrsDiagnosticPanel from '../components/ConvrsDiagnosticPanel'
import TemplateKpiTable from '../components/TemplateKpiTable'
import WhatsAppTemplatesLiveStatus from '../components/WhatsAppTemplatesLiveStatus'
import { fetchConvrsLiveStats } from '../services/whatsappTemplatesLiveService'

const TABS = [
  { id: 'kpi', label: 'Performance KPI' },
  { id: 'diagnostic', label: 'Diagnostica & Setup' },
]

export default function WhatsAppTemplatesPage() {
  const [liveState, setLiveState] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState('kpi')

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()

    const loadLive = async () => {
      try {
        const payload = await fetchConvrsLiveStats(controller.signal)
        if (mounted) setLiveState(payload)
      } catch {
        // Keep existing view on error.
      }
    }

    loadLive()
    const timer = window.setInterval(loadLive, 60000)

    return () => {
      mounted = false
      controller.abort()
      window.clearInterval(timer)
    }
  }, [])

  const handleManualSync = async () => {
    try {
      setIsSyncing(true)
      const resp = await fetch('/api/convrs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeConversations: false,
          refreshMessageDetails: true,
          refreshMessageDetailsLimit: 50,
        }),
      })
      const payload = await resp.json()
      if (payload?.ok) setLiveState(payload)
    } catch {
      // Keep existing view if sync fails.
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-gray-100">WhatsApp Templates</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Monitoring performance template · KPI da callback Convrs real-time
          </p>
        </div>
      </div>

      {/* Status bar */}
      <WhatsAppTemplatesLiveStatus
        liveState={liveState}
        onManualSync={handleManualSync}
        syncing={isSyncing}
      />

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-gray-600 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-700 text-gray-100 border border-b-0 border-gray-600'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'kpi' ? (
        <TemplateKpiTable livePayload={liveState} />
      ) : (
        <ConvrsDiagnosticPanel livePayload={liveState} />
      )}
    </div>
  )
}
