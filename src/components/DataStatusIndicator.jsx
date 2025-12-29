import React from 'react';

/**
 * Componente per mostrare lo stato dei dati in una sezione.
 * @param {Object} dataStatus - Risultato di checkDataStatus.
 * @param {boolean} showPopup - Se mostrare come popup invece di banner fisso.
 * @param {Function} onClosePopup - Callback per chiudere il popup.
 * @param {Function} onPillClick - Callback per cliccare il pill e mostrare il popup.
 */
export default function DataStatusIndicator({ dataStatus, showPopup = false, onClosePopup, onPillClick }) {
  const { status, message } = dataStatus;

  const getStyle = () => {
    switch (status) {
      case 'updated':
        return 'bg-black text-white';
      case 'outdated':
        return 'bg-black text-white';
      case 'no-data':
        return 'bg-black text-white';
      default:
        return 'bg-black text-white';
    }
  };

  const content = (
    <div 
      className={`px-4 py-2 rounded-full text-sm font-medium inline-flex items-center cursor-pointer shadow-lg border-2 border-white ${getStyle()}`}
      onClick={onPillClick}
    >
      <span>{message}</span>
      {showPopup && onClosePopup && (
        <button onClick={onClosePopup} className="ml-2 text-gray-500 hover:text-gray-700">×</button>
      )}
    </div>
  );

  const getIcon = () => {
    switch (status) {
      case 'updated': return '✅';
      case 'outdated': return '⚠️';
      case 'no-data': return '❌';
      default: return 'ℹ️';
    }
  };

  const getPopupBg = () => {
    switch (status) {
      case 'updated': return 'from-green-400 to-green-600';
      case 'outdated': return 'from-yellow-400 to-yellow-600';
      case 'no-data': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (showPopup) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${getPopupBg()} flex items-center justify-center text-3xl`}>
              {getIcon()}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Stato Dati</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={onClosePopup}
              className="px-6 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>{content}</div>
      </>
    );
  }

  return <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>{content}</div>;
}