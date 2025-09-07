export function pickTotalNL(rawText: string): string | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const LABEL =
    /\b(algemeen\s+tota+a*l?|tota+a*l?|te\s*betalen|grand\s*total|amount\s*due|total)\b/i;
  const BAD_ROW =
    /(subtota+|sub\s*total|korting|tarief|netto|bruto|omschrijving|qty|e\.?p\.?|excl\.?|incl\.?)/i;
  const VAT_ROW = /\bbtw\b/i; // specific VAT indicator

  type Amt = {
    value: number;
    start: number;
    end: number;
    hasCurrency: boolean;
    ctx: string;
    lineIdx: number;
  };

  const amountsOn = (s: string, lineIdx: number): Amt[] => {
    const out: Amt[] = [];
    const re =
      /(?:(€|eur)\s*)?([-+]?\d{1,3}(?:[.,]\d{3})*|\d+)[.,](\d{2})(?!\d)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      const intPart = m[2].replace(/[.,](?=\d{3}\b)/g, "");
      const val = parseFloat(intPart + "." + m[3]);
      if (!Number.isNaN(val)) {
        // local context around the amount (±14 chars)
        const a = Math.max(0, m.index - 14);
        const b = Math.min(s.length, m.index + m[0].length + 14);
        const ctx = s.slice(a, b);
        out.push({
          value: +val.toFixed(2),
          start: m.index,
          end: m.index + m[0].length,
          hasCurrency: !!m[1],
          ctx,
          lineIdx,
        });
      }
    }
    return out;
  };

  const score = (line: string, a: Amt, sameLineHasLabel: boolean): number => {
    let s = 0;

    // Label strength
    if (sameLineHasLabel && /\btota+a*l?\b/i.test(line)) s += 3.5;
    if (sameLineHasLabel && /\balgemeen\s+tota+a*l?\b/i.test(line)) s += 4.0;
    if (sameLineHasLabel && /\bte\s*betalen\b/i.test(line)) s += 3.0;

    // Right alignment & currency
    s += Math.min(2, a.end / Math.max(1, line.length)) * 1.2;
    if (a.hasCurrency) s += 1.2;

    // Prefer bottom half; penalize top quarter (column headers live there)
    if (a.lineIdx < Math.floor(lines.length * 0.25)) s -= 2.0;
    else if (a.lineIdx >= Math.floor(lines.length / 2)) s += 0.5;

    // Strongly penalize VAT/discount context near the number
    if (/\bbtw\b|\blaag\b|\bhoog\b|\bkorting\b/i.test(a.ctx)) s -= 5.0;

    // Penalize entire line if it is obviously VAT/discount/table
    if (VAT_ROW.test(line) || BAD_ROW.test(line)) s -= 3.5;

    return s;
  };

  // PASS A: same-line totals only (most receipts)
  const candA: { amt: Amt; sc: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasLabel = LABEL.test(line);
    if (!hasLabel) continue;

    const amts = amountsOn(line, i);
    for (const a of amts) candA.push({ amt: a, sc: score(line, a, true) });
  }
  if (candA.length) {
    candA.sort(
      (A, B) =>
        B.sc - A.sc || A.amt.end - B.amt.end || B.amt.value - A.amt.value
    );
    if (candA[0].sc > 0) return candA[0].amt.value.toFixed(2);
  }

  // PASS B: two-line window (label on one, amount on next), but keep VAT penalties local
  const candB: { amt: Amt; sc: number }[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const thisHas = LABEL.test(lines[i]);
    const nextHas = LABEL.test(lines[i + 1]);
    if (!thisHas && !nextHas) continue;

    // Only take amounts from the line that LOOKS like the value line
    // (avoid pulling VAT numbers from the neighbour)
    const valueLineIdx = thisHas ? i + 1 : i; // amount usually on the other line
    const valueLine = lines[valueLineIdx];
    const amts = amountsOn(valueLine, valueLineIdx);
    for (const a of amts) {
      const sc = score(valueLine, a, /*sameLineHasLabel*/ false) + 1.0; // small bonus for being next to a label
      candB.push({ amt: a, sc });
    }
  }
  if (candB.length) {
    candB.sort(
      (A, B) =>
        B.sc - A.sc || A.amt.end - B.amt.end || B.amt.value - A.amt.value
    );
    if (candB[0].sc > 0) return candB[0].amt.value.toFixed(2);
  }

  // PASS C: explicit "Algemeen Totaal" anywhere
  for (let i = 0; i < lines.length; i++) {
    if (!/\balgemeen\s+tota+a*l?\b/i.test(lines[i])) continue;
    const am = amountsOn(lines[i], i).filter(
      (a) => !/\bbtw\b|\blaag\b|\bhoog\b/i.test(a.ctx)
    );
    if (am.length) {
      const rightmost = am.reduce((a, b) => (a.end >= b.end ? a : b));
      return rightmost.value.toFixed(2);
    }
  }

  // PASS D: bottom 40% fallback — ignore VAT lines and pick rightmost amount
  const start = Math.floor(lines.length * 0.6);
  const tail = lines
    .slice(start)
    .filter((l) => !VAT_ROW.test(l) && !BAD_ROW.test(l))
    .join(" ");
  const amts = amountsOn(tail, lines.length - 1);
  if (amts.length) {
    const rightmost = amts.reduce((a, b) => (a.end >= b.end ? a : b));
    return rightmost.value.toFixed(2);
  }

  return null;
}
