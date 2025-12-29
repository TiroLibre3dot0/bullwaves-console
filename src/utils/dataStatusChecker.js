/**
 * Calcola lo stato dei dati basato sulla data più recente nei dati forniti.
 * @param {Array} data - Array di oggetti contenenti i dati (es. da CSV).
 * @param {string} dateKey - Chiave dell'oggetto che contiene la data (es. 'Date').
 * @param {string} reportName - Nome del report per personalizzare il messaggio (es. 'Media Report').
 * @returns {Object} - { status: 'updated' | 'outdated' | 'no-data', message: string, latestDate: Date | null, daysDiff: number, reportName: string }
 */
export function checkDataStatus(data, dateKey = 'Date', reportName = 'Report') {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      status: 'no-data',
      message: 'Nessun dato disponibile',
      latestDate: null,
      daysDiff: 0
    };
  }

  // Trova la data più recente
  let latestDate = null;
  for (const item of data) {
    const dateStr = item[dateKey];
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime()) && (!latestDate || date > latestDate)) {
        latestDate = date;
      }
    }
  }

  if (!latestDate) {
    return {
      status: 'no-data',
      message: `Nessuna data valida trovata in ${reportName}`,
      latestDate: null,
      daysDiff: 0,
      reportName
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Ignora ore/minuti per confronto giornaliero
  const latest = new Date(latestDate);
  latest.setHours(0, 0, 0, 0);

  const diffTime = today - latest;
  const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let status, message;
  if (daysDiff <= 1) { // Considera aggiornato se entro 1 giorno
    status = 'updated';
    message = `${reportName} aggiornato fino al ${latestDate.toLocaleDateString('it-IT')}`;
  } else {
    status = 'outdated';
    message = `${reportName} obsoleto: ultimo aggiornamento ${latestDate.toLocaleDateString('it-IT')} (${daysDiff} giorni fa)`;
  }

  return {
    status,
    message,
    latestDate,
    daysDiff,
    reportName
  };
}