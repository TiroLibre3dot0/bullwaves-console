const defaultNumberFormat = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatNumber(value, opts) {
  const num = Number(value || 0);
  if (!opts) return defaultNumberFormat.format(num);
  const formatter = new Intl.NumberFormat('en-GB', opts);
  return formatter.format(num);
}

export function formatNumberShort(value) {
  const num = Number(value || 0);
  const abs = Math.abs(num);
  if (abs >= 1_000_000) return `${Math.round(num / 1_000_000)}M`;
  if (abs >= 1000) return `${Math.round(num / 1000)}k`;
  return defaultNumberFormat.format(Math.round(num));
}

export function formatEuro(value) {
  return `${formatNumberShort(value)} €`;
}

export function formatEuroFull(value) {
  return `${defaultNumberFormat.format(Number(value || 0))} €`;
}

export function formatPercent(value, digits = 1) {
  return `${Number(value || 0).toFixed(digits)}%`;
}

export function formatPercentRounded(value) {
  return `${Math.round(Number(value || 0))}%`;
}

export function cleanNumber(value) {
  if (value === null || value === undefined) return 0;
  const str = String(value).replace(/[$,]/g, '').trim();
  if (!str) return 0;
  const num = Number(str);
  return Number.isNaN(num) ? 0 : num;
}

export function cleanPercent(value) {
  if (value === null || value === undefined) return 0;
  const str = String(value).replace(/%/g, '').trim();
  const num = Number(str);
  return Number.isNaN(num) ? 0 : num;
}

export function normalizeKey(str = '') {
  return str.trim().toLowerCase();
}

export const formatters = {
  formatNumber,
  formatNumberShort,
  formatEuro,
  formatEuroFull,
  formatPercent,
  formatPercentRounded,
  cleanNumber,
  cleanPercent,
  normalizeKey,
};

export default formatters;
