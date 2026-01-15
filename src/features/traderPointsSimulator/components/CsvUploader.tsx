import React from 'react';
import Papa from 'papaparse';

interface CsvUploaderProps {
  onData: (rows: any[], info: {parsed: number, skipped: number}) => void;
  parseInfo: {parsed: number, skipped: number};
}

export default function CsvUploader({ onData, parseInfo }: CsvUploaderProps) {
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
      <div className="font-semibold mb-2 text-slate-200">1. Carica report posizioni</div>
      <input type="file" accept=".csv" onChange={handleFile} className="mb-2 text-sm text-slate-200" />
      <div className="text-sm text-emerald-300">
        {parseInfo.parsed > 0 && `Righe caricate: ${parseInfo.parsed}`}
        {parseInfo.skipped > 0 && ` | Righe saltate: ${parseInfo.skipped}`}
      </div>
    </div>
  );
}
