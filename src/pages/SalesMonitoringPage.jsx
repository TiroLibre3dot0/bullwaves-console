import { useState } from 'react'
import CommissionValidationRulesPage from './CommissionValidationRulesPage'
import SalesAgentsMonitor from './Retention/SalesAgentsMonitor'

const TABS = [
  { key: 'rules', label: 'Rules' },
  { key: 'performance', label: 'Performance' },
]

export default function SalesMonitoringPage({ initialTab = 'rules' }) {
  const [tab, setTab] = useState(initialTab)

  return (
    <div className="sales-monitoring">
      <div className="sales-monitoring__header">
        <div className="sales-monitoring__breadcrumb">
          <span className="sales-monitoring__macro">Sales</span>
          <span className="sales-monitoring__sep" aria-hidden="true">
            ›
          </span>
          <span className="sales-monitoring__section">Monitoring</span>
        </div>

        <div className="sales-monitoring__pills" role="tablist" aria-label="Monitoring sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`sales-monitoring__pill pill-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sales-monitoring__body">
        {tab === 'rules' ? <CommissionValidationRulesPage /> : null}
        {tab === 'performance' ? <SalesAgentsMonitor /> : null}
      </div>
    </div>
  )
}
