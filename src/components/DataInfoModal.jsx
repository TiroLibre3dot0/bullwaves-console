import React from 'react'

const DataInfoModal = ({ isOpen, onClose, dataInfo }) => {
  if (!isOpen) return null

  const registrationsIso = dataInfo?.registrationsLatestDate || ''
  const registrationsDate = registrationsIso ? new Date(registrationsIso) : null
  const registrationsLabel =
    registrationsDate && !Number.isNaN(registrationsDate.getTime())
      ? registrationsDate.toLocaleString('it-IT')
      : 'N/A'
  const registrationsOutdated = Boolean(dataInfo?.registrationsOutdated)

  const openCellXpert = () => {
    window.open(
      'https://partner.trackingaffiliates.com/v2/login/admin-login/',
      '_blank',
      'noopener,noreferrer'
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Stato Dati</h2>
                <p className="text-blue-100 text-sm">Informazioni sull'ultimo aggiornamento</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Data più recente */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600">📅</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data più recente</p>
              <p className="font-semibold text-gray-900">{dataInfo.lastDate}</p>
            </div>
          </div>

          {/* Media Report */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">📄</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Media Report</p>
              <p className="font-semibold text-gray-900">{dataInfo.mediaFile}</p>
            </div>
          </div>

          {/* Payments Report */}
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payments Report</p>
              <p className="font-semibold text-gray-900">{dataInfo.paymentsFile}</p>
            </div>
          </div>

          {/* Registrations Report freshness */}
          {registrationsIso ? (
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                registrationsOutdated ? 'bg-red-50' : 'bg-green-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  registrationsOutdated ? 'bg-red-100' : 'bg-green-100'
                }`}
              >
                <span className={registrationsOutdated ? 'text-red-700' : 'text-green-700'}>
                  {registrationsOutdated ? '⚠️' : '✅'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registrations Report</p>
                <p className="font-semibold text-gray-900">Ultima data: {registrationsLabel}</p>
                {registrationsOutdated ? (
                  <p className="text-sm text-red-700">
                    Attenzione: i dati delle registrazioni non sono aggiornati a oggi.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Info aggiuntiva */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600 mt-0.5">💡</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Suggerimento:</p>
                <p>
                  Per aggiornare i dati, scarica i nuovi report da CellXpert e sostituiscili nella
                  cartella public.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Chiudi
          </button>
          <button
            onClick={openCellXpert}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <span>🔗</span>
            <span>Apri CellXpert</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DataInfoModal
