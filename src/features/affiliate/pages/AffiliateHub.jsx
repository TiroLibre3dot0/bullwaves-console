import React from 'react'
import AffiliateAnalysis from '../../affiliate-analysis/AffiliateAnalysis'
import InvestmentsDashboard from '../../investments/components/InvestmentsDashboard'
import Dashboard from '../../../components/Dashboard'
import AffiliatePayments2 from '../components/AffiliatePayments2'

export default function AffiliateHub({ section = 'analysis', onSectionChange }) {
  const renderSection = () => {
    if (section === 'payments') return <InvestmentsDashboard />
    if (section === 'payments2') return <AffiliatePayments2 />
    if (section === 'cohort') return <Dashboard />
    return <AffiliateAnalysis />
  }

  return (
    <div className="affiliate-hub">
      {renderSection()}
    </div>
  )
}
