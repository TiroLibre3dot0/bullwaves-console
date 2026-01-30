import React from 'react'
import AffiliateAnalysis from '../../affiliate-analysis/AffiliateAnalysis'
import InvestmentsDashboard from '../../investments/components/InvestmentsDashboard'
import AffiliatePayments2 from '../components/AffiliatePayments2'
import AffiliateCohortPage from './AffiliateCohortPage'
import CommentsAnalysisPage from '../../../pages/CommentsAnalysisPage'

export default function AffiliateHub({ section = 'analysis', onSectionChange }) {
  const renderSection = () => {
    if (section === 'payments') return <InvestmentsDashboard />
    if (section === 'payments2') return <AffiliatePayments2 />
    if (section === 'clientsMoved') return <CommentsAnalysisPage mode="transfersOnly" />
    if (section === 'cohort') return <AffiliateCohortPage />
    return <AffiliateAnalysis />
  }

  return <div className="affiliate-hub">{renderSection()}</div>
}
