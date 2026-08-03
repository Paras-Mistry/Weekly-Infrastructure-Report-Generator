// Shared currency + change formatting helpers

export function formatMoney(amount, currency = "$") {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency}${Math.abs(amount).toFixed(2)}`;
}

export function pctChange(current, last) {
  if (!last) return current > 0 ? 100 : 0;
  return ((current - last) / Math.abs(last)) * 100;
}

export function changeArrow(diff) {
  return diff > 0 ? "↑" : diff < 0 ? "↓" : "↔";
}

// Status emoji based on % change. `flatBand` = the +/- window treated as "flat".
export function statusEmoji(
  pct,
  { flatBand = 2, highBand = 10, criticalBand = 25 } = {},
) {
  if (pct <= 0 || Math.abs(pct) <= flatBand) return "🟢";
  if (Math.abs(pct) >= criticalBand) return "🔴";
  if (Math.abs(pct) >= highBand) return "🟡";
  return "🟢";
}

// e.g. "+$19.17 (+110%)" / "-£8.67 (-21%)"
export function formatChangeLabel(current, last, currency = "$") {
  const diff = current - last;
  const pct = pctChange(current, last);
  const diffSign = diff >= 0 ? "+" : "-";
  const pctSign = pct >= 0 ? "+" : "";
  return `${diffSign}${currency}${Math.abs(diff).toFixed(2)} (${pctSign}${pct.toFixed(0)}%)`;
}
