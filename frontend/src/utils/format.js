export const CURRENCY = '₱';

export function formatCurrency(value, decimals = 2) {
  if (value == null) return (0).toFixed(decimals);

  if (typeof value === 'object') {
    if ('$numberDecimal' in value) value = value.$numberDecimal;
    else if (typeof value.toString === 'function') value = value.toString();
  }

  if (typeof value === 'bigint') value = Number(value);

  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(decimals) : (0).toFixed(decimals);
}

export function formatPercent(value, decimals = 0) {
  if (value == null) return (0).toFixed(decimals);
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(decimals) : (0).toFixed(decimals);
}
