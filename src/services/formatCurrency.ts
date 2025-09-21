export function formatCurrency(
  amount?: number,
  currency: string = "USD",
  fullAmount = true
): string {
  const value = amount || 0;
  const abs = Math.abs(value);
  const locale = "en-US";

  if (fullAmount || abs < 10_000) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const symbol = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(0)
    .replace(/[\d.,\s]/g, "");

  const shortValue =
    abs >= 1_000_000
      ? `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
      : `${(value / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`;

  return `${symbol}${shortValue}`;
}
