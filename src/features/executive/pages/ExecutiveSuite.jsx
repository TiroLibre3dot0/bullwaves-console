import React from 'react'
import GlobalDashboard from '../../media-payments/components/GlobalDashboard'
import ExecutiveView from '../../executive-view/pages/ExecutiveView'

const tabs = [
  { key: 'summary', label: 'Executive Summary' },
  { key: 'view', label: 'Executive View' },
]

export default function ExecutiveSuite({ section = 'summary', onSectionChange }) {
  const renderSection = () => {
    if (section === 'view') return <ExecutiveView />
    return <GlobalDashboard />
  }

  return (
    <div className="executive-suite">
      <nav className="subnav" style={{ marginBottom: 12 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${section === tab.key ? 'active' : ''}`}
            onClick={() => onSectionChange?.(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {renderSection()}
    </div>
  )
}
