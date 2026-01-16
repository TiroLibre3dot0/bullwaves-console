import React from 'react';
import Papa from 'papaparse';
import { useI18n } from '../../../i18n/I18nContext.ts'

interface CsvUploaderProps {
  onData: (rows: any[], info: {parsed: number, skipped: number}) => void;
  parseInfo: {parsed: number, skipped: number};
}

export default function CsvUploader({ onData, parseInfo }: CsvUploaderProps) {
  const { t } = useI18n()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const parsed = rows.length;
        const skipped = (results.errors || []).length;
        onData(rows, { parsed, skipped });
      },
    });
  };
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 mb-2">
      <div className="font-semibold mb-2 text-slate-200">{t('traderPoints.csvUploader.title')}</div>
      <input type="file" accept=".csv" onChange={handleFile} className="mb-2 text-sm text-slate-200" />
      <div className="text-sm text-emerald-300">
        {parseInfo.parsed > 0 && t('traderPoints.csvUploader.rowsLoaded', { count: parseInfo.parsed })}
        {parseInfo.skipped > 0 && t('traderPoints.csvUploader.rowsSkipped', { count: parseInfo.skipped })}
      </div>
    </div>
  );
}
