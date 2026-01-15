import { getTraderPointInfo } from '../../../traderPoints';

export function calcTradePoints(rows: any[]) {
  return rows.map((row) => {
    const info = getTraderPointInfo(row.Symbol);
    const notionalUnit = info?.valoreNozionalePerPunto ?? 1000;
    const factor = info?.puntiPerLotto ?? 1.0;
    const volume = parseFloat(row.Volume?.toString().replace(/,/g, '')) || 0;
    const tradePoints = +(volume / notionalUnit * factor).toFixed(2);
    return { ...row, tradePoints, traderPointInfo: info };
  });
}
