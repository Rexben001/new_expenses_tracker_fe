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

// totals-nl.ts
type Totals = {
  paidTotal: string | null; // amount actually paid (PIN/Contant block)
  basketTotal: string | null; // goods total (before payment methods/emballage)
  used: "paid" | "basket" | "unknown";
};

const AMOUNT_RE =
  /(?:(€|eur)\s*)?([-+]?\d{1,3}(?:[.,]\d{3})*|\d+)[.,](\d{2})(?!\d)/gi;

const LABEL_TOTAL =
  /\b(algemeen\s+tota+a*l?|tota+a*l?|te\s*betalen|grand\s*total|amount\s*due|total)\b/i;
const LABEL_SUBTOTAL = /\b(subtota+a*l?|sub\s*total)\b/i;

const VAT_ANCHOR = /\bbtw\b/i; // anchor VAT zone only by "BTW"
const BAD_ROW =
  /(tarief|netto|bruto|omschrijving|qty|e\.?p\.?|excl\.?|incl\.?|korting|voordeel)/i;

// payment block anchors & signals
const PAY_ANCHOR =
  /(betaald met|klantticket|terminal|v[\s-]?pay|maestro|visa|mastercard|autorisatie|leesmethode|contactless|kaart|kaarts?erienummer|pinnen?\b|pin\b|betaling\b)/i;
const PAY_SIG = /(pin|pinnen|contant|contactless|betaling|betaald\b)/i;

function parseAmounts(line: string): number[] {
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = AMOUNT_RE.exec(line))) {
    const intPart = m[2].replace(/[.,](?=\d{3}\b)/g, "");
    const val = parseFloat(intPart + "." + m[3]);
    if (!Number.isNaN(val)) out.push(+val.toFixed(2));
  }
  return out;
}

export function pickTotalsNL(rawText: string): Totals {
  const lines = (rawText || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!lines.length)
    return { paidTotal: null, basketTotal: null, used: "unknown" };

  // ---------- zones ----------
  const vatAnchors = lines
    .map((l, i) => (VAT_ANCHOR.test(l) ? i : -1))
    .filter((i) => i >= 0);
  const isVatZone = (i: number) =>
    vatAnchors.some((a) => i >= a - 1 && i <= a + 6);

  const payAnchors = lines
    .map((l, i) => (PAY_ANCHOR.test(l) ? i : -1))
    .filter((i) => i >= 0);
  const isPayZone = (i: number) =>
    payAnchors.some((a) => i >= a - 3 && i <= a + 10);

  // ---------- basket total (goods) ----------
  const getBasket = (): number | null => {
    // A) same-line label outside VAT/payment
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        !LABEL_TOTAL.test(line) ||
        BAD_ROW.test(line) ||
        isVatZone(i) ||
        isPayZone(i)
      )
        continue;
      const amts = parseAmounts(line);
      if (amts.length) {
        const ge1 = amts.filter((n) => n >= 1);
        return (ge1.length ? ge1 : amts)[(ge1.length ? ge1 : amts).length - 1];
      }
    }
    // B) label on neighbour line
    for (let i = 0; i < lines.length - 1; i++) {
      const a = lines[i],
        b = lines[i + 1];
      if (
        LABEL_TOTAL.test(a) &&
        !(BAD_ROW.test(a) || isVatZone(i) || isPayZone(i))
      ) {
        const amts = parseAmounts(b).filter((n) => !Number.isNaN(n));
        if (amts.length)
          return (amts.filter((n) => n >= 1).pop() ?? amts.pop())!;
      }
      if (
        LABEL_TOTAL.test(b) &&
        !(BAD_ROW.test(b) || isVatZone(i + 1) || isPayZone(i + 1))
      ) {
        const amts = parseAmounts(a);
        if (amts.length)
          return (amts.filter((n) => n >= 1).pop() ?? amts.pop())!;
      }
    }
    // C) fallback to subtotal if present (outside VAT/payment)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        !LABEL_SUBTOTAL.test(line) ||
        BAD_ROW.test(line) ||
        isVatZone(i) ||
        isPayZone(i)
      )
        continue;
      const amts = parseAmounts(line);
      if (amts.length) return (amts.filter((n) => n >= 1).pop() ?? amts.pop())!;
    }
    return null;
  };

  // ---------- paid total (amount charged) ----------
  const getPaid = (): number | null => {
    // Define a payment region: from first pay anchor to either end or next VAT anchor
    const firstPay = payAnchors.length ? Math.max(0, payAnchors[0] - 2) : -1;
    const endOfRegion =
      firstPay >= 0 ? vatAnchors.find((a) => a > firstPay) ?? lines.length : -1;

    if (firstPay < 0) return null;
    const region = lines.slice(firstPay, endOfRegion);

    // A) "Totaal" inside payment region
    for (let i = 0; i < region.length; i++) {
      const line = region[i];
      if (LABEL_TOTAL.test(line) && !BAD_ROW.test(line)) {
        const amts = parseAmounts(line);
        if (amts.length)
          return (amts.filter((n) => n >= 1).pop() ?? amts.pop())!;
      }
    }
    for (let i = region.length - 1; i >= 0; i--) {
      const line = region[i];
      if (!PAY_SIG.test(line)) continue;
      const amts = parseAmounts(line);
      if (amts.length) return (amts.filter((n) => n >= 1).pop() ?? amts.pop())!;
    }
    // C) otherwise largest amount ≥ 1 in region
    const nums = region.flatMap(parseAmounts).filter((n) => n >= 1);
    if (nums.length) return Math.max(...nums);
    const any = region.flatMap(parseAmounts);
    return any.length ? Math.max(...any) : null;
  };

  const basket = getBasket();
  const paid = getPaid();

  // choose "used" (prefer paid when available)
  if (paid != null)
    return {
      paidTotal: paid.toFixed(2),
      basketTotal: basket != null ? basket.toFixed(2) : null,
      used: "paid",
    };
  if (basket != null)
    return { paidTotal: null, basketTotal: basket.toFixed(2), used: "basket" };
  return { paidTotal: null, basketTotal: null, used: "unknown" };
}
