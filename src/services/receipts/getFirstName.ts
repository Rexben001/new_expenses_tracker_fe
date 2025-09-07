/* ================================================
 * 1) First-item fallback
 * ================================================ */

const PRICE =
  /(?:(€|eur)\s*)?([-+]?\d{1,3}(?:[.,]\d{3})*|\d+)[.,](\d{2})(?!\d)/i;

const BAD_META =
  /(kassabon|bonnr|klantticket|betaling|betalen|totaal|subtotaal|korting|btw(?!-nr)|tarief|netto|bruto|datum|tijd|filiaal|terminal|transactie|merchant|kaart|pin|visa|mastercard|leesmethode|auteurs|aut\.? code)/i;

const ITEM_HEADERS =
  /(omschrijving|artikel|art\.?|qty|aantal|e\.?p\.?|price|prijs)/i;

function looksLikeItemLine(s: string, prev?: string, next?: string) {
  if (!s) return false;
  if (BAD_META.test(s)) return false;
  if (!/[A-Za-z]{3}/.test(s)) return false; // needs some letters
  const hasPriceHere = PRICE.test(s);
  const hasPriceNear =
    hasPriceHere || PRICE.test(prev ?? "") || PRICE.test(next ?? "");
  return hasPriceNear;
}

function cleanItemName(s: string): string {
  let t = s;

  // If there is a trailing price/qty column, strip everything from the first price onward
  const m = t.match(PRICE);
  if (m) t = t.slice(0, m.index).trim();

  // Strip very common leading counters/qty markers
  t = t
    .replace(/^\s*\d{1,3}\s*(x|×)\s*/i, "") // "2 x "
    .replace(/^\s*\d{1,3}[.)-]\s*/, "") // "1. " / "01) "
    .replace(
      /^\s*(artikel|art\.?|item|omschrijving|qty|aantal)\s*[:\\-]?\s*/i,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .trim();

  // Guard: don’t return a line that is now just units
  if (/^(kg|g|ml|cl|l|stk|stuks?)$/i.test(t)) return "";
  return t;
}

/** Returns the first plausible purchased item on the receipt, or null. */
export function getFirstItem(rawText: string): string | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Heuristic: start scanning after a header row if we see one
  let start = 0;
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    if (ITEM_HEADERS.test(lines[i])) {
      start = i + 1;
      break;
    }
  }

  for (let i = start; i < lines.length; i++) {
    const s = lines[i];
    const prev = lines[i - 1];
    const next = lines[i + 1];

    if (!looksLikeItemLine(s, prev, next)) continue;

    const name = cleanItemName(s);
    if (name && /[A-Za-z]{3}/.test(name)) {
      // Trim to a reasonable UI length, keep it readable
      return name.length > 60 ? name.slice(0, 57).trimEnd() + "…" : name;
    }
  }

  return null;
}
