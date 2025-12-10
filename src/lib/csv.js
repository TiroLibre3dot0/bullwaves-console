import { cleanNumber } from './formatters';

export function splitCsvLine(line = '') {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      out.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  out.push(current);
  return out;
}

export function parseCsv(text = '') {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/(^"|"$)/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function parseMonthLabel(raw) {
  if (!raw) return { label: 'Unknown', monthIndex: -1, year: '—', key: 'unknown' };
  const [m, y] = raw.split('/');
  const monthIndex = Math.max(0, (Number(m) || 1) - 1);
  const year = Number(y) || '—';
  return { label: `${monthNames[monthIndex]} ${year}`, monthIndex, year, key: `${year}-${String(monthIndex).padStart(2, '0')}` };
}

export function parseMonthFirstDate(raw) {
  if (!raw) return null;
  const parts = raw.split('/').map((p) => Number(p));
  if (parts.length < 3) return null;
  const [m, d, y] = parts;
  const date = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function monthMetaFromDate(date) {
  if (!date || Number.isNaN(date.getTime())) return { label: 'Unknown', monthIndex: -1, year: '—', key: 'unknown' };
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  return { label: `${monthNames[monthIndex]} ${year}`, monthIndex, year, key: `${year}-${String(monthIndex).padStart(2, '0')}` };
}

export function safeCleanNumber(value) {
  return cleanNumber(value);
}

export default {
  splitCsvLine,
  parseCsv,
  parseMonthLabel,
  parseMonthFirstDate,
  monthMetaFromDate,
  safeCleanNumber,
};
