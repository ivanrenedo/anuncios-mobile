/** Compact numeric formatter for counters (e.g. "1.234", "12,3 K"). */
export function formatNumber(
  value: number | string | null | undefined,
): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000_000) {
    let result = (n / 1_000_000_000)
      .toFixed(1)
      .replace(/\.0$/, '')
      .replace('.', ',');
    return `${Math.round(Number(result)).toLocaleString('es')} B`;
  }
  if (Math.abs(n) >= 1_000_000) {
    let result = (n / 1_000_000)
      .toFixed(1)
      .replace(/\.0$/, '')
      .replace('.', ',');
    return `${Math.round(Number(result)).toLocaleString('es')} M`;
  }
  if (Math.abs(n) >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} K`;
  }
  return Math.round(n).toLocaleString('es');
}
