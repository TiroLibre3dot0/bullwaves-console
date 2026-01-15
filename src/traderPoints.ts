// Bullwaves_new/src/traderPoints.ts
// Mappa dei simboli più tradati con i parametri Plus500 per i punti trader
// Aggiorna/espandi secondo necessità


export interface TraderPointInfo {
  symbol: string;
  puntiPerLotto: number;
  lottoStandard: number;
  valoreNozionalePerPunto: number;
  categoria: string;
}

// Mappa dei simboli normalizzati (solo chiave pulita)
export const traderPoints: Record<string, TraderPointInfo> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    puntiPerLotto: 0.37, // Oro
    lottoStandard: 100, // 100 oz
    valoreNozionalePerPunto: 1000,
    categoria: 'Oro',
  },
  EURUSD: {
    symbol: 'EURUSD',
    puntiPerLotto: 0.74, // Forex
    lottoStandard: 100000,
    valoreNozionalePerPunto: 1000,
    categoria: 'Forex',
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    puntiPerLotto: 0.11, // Crypto
    lottoStandard: 1, // 1 BTC
    valoreNozionalePerPunto: 1000,
    categoria: 'Crypto',
  },
  XAGUSD: {
    symbol: 'XAGUSD',
    puntiPerLotto: 0.37, // Argento
    lottoStandard: 5000, // 5000 oz
    valoreNozionalePerPunto: 1000,
    categoria: 'Argento',
  },
};

// Normalizza il simbolo: trim, uppercase, rimuove ! e . e spazi, eventuali altri caratteri non alfanumerici finali
export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/[!\.\s_-]+/g, '').replace(/[^A-Z0-9]+$/, '');
}

// Ottieni info punti trader da un simbolo (normalizzato)
export function getTraderPointInfo(symbol: string): TraderPointInfo | undefined {
  const key = normalizeSymbol(symbol);
  return traderPoints[key];
}

// Verifica se esiste info punti trader per un simbolo
export function hasTraderPointInfo(symbol: string): boolean {
  return !!getTraderPointInfo(symbol);
}

// Esempi d'uso (inline doc):
// getTraderPointInfo("XAUUSD!")        // => trova XAUUSD
// getTraderPointInfo("EURUSD.")        // => trova EURUSD
// getTraderPointInfo(" btcusd! ")      // => trova BTCUSD
// getTraderPointInfo("XAGUSD")         // => trova XAGUSD
// getTraderPointInfo("xauusd.")        // => trova XAUUSD
// getTraderPointInfo("eurusd!")        // => trova EURUSD
