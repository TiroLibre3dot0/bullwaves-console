import React from 'react'
import AffiliateAnalysis from '../../affiliate-analysis/AffiliateAnalysis'
import InvestmentsDashboard from '../../investments/components/InvestmentsDashboard'
import Dashboard from '../../../components/Dashboard'

const tabs = [
  { key: 'analysis', label: 'Affiliate Analysis' },
  { key: 'payments', label: 'Affiliate Payments' },
  { key: 'cohort', label: 'Cohort' },
]

export default function AffiliateHub({ section = 'analysis', onSectionChange }) {
  const renderSection = () => {
    if (section === 'payments') return <InvestmentsDashboard />
    if (section === 'cohort') return <Dashboard />
    return <AffiliateAnalysis />
  }

  return (
    <div className="affiliate-hub">
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
