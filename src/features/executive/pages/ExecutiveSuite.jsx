import React from 'react'
import GlobalDashboard from '../../media-payments/components/GlobalDashboard'
import ExecutiveView from '../../executive-view/pages/ExecutiveView'

export default function ExecutiveSuite({ section = 'summary', onSectionChange }) {
  const renderSection = () => {
    if (section === 'view') return <ExecutiveView />
    return <GlobalDashboard />
  }

  return (
    <div className="executive-suite">
      {renderSection()}
    </div>
  )
}
