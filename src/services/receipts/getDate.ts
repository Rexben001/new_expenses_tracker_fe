// date-extract.ts
type DateHit = {
  iso: string; // ISO string (local midnight if no time)
  date: string; // "YYYY-MM-DD"
  time?: string; // "HH:mm" or "HH:mm:ss"
  confidence: number;
  snippet: string; // small bit of surrounding text
};

export function extractReceiptDate(
  rawText: string,
  opts: { preferDMY?: boolean; timezone?: string } = {}
): DateHit | null {
  const preferDMY = opts.preferDMY ?? true; // NL/EU default

  const text = (rawText || "").replace(/\u00A0/g, " ");
  const norm = text.replace(/\s+/g, " ").trim();

  // Nearby label words (NL + EN)
  const LABEL =
    /(datum|tijd|date|time|betaling|betaald|betalen|receipt|kassabon)/i;

  // Month names (NL + EN, short and long)
  const MONTHS: Record<string, number> = {
    jan: 1,
    januari: 1,
    feb: 2,
    februari: 2,
    mar: 3,
    maart: 3,
    apr: 4,
    april: 4,
    may: 5,
    mei: 5,
    jun: 6,
    juni: 6,
    jul: 7,
    juli: 7,
    aug: 8,
    augustus: 8,
    sep: 9,
    september: 9,
    oct: 10,
    okt: 10,
    oktober: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  // --- helpers ---
  const expandYear = (yy: number): number => {
    // Map 2-digit years to 2000–2099 usually; fall back to 1900s for very big yy.
    const nowYY = new Date().getFullYear() % 100;
    if (yy >= 0 && yy <= nowYY + 1) return 2000 + yy;
    if (yy < 100) return 2000 + yy; // receipts rarely from 1900s
    return yy;
  };
  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const makeIso = (
    y: number,
    m: number,
    d: number,
    hh?: number,
    mm?: number,
    ss?: number
  ) => {
    if (!hh && !mm && !ss) return `${y}-${pad2(m)}-${pad2(d)}T00:00:00`;
    return `${y}-${pad2(m)}-${pad2(d)}T${pad2(hh || 0)}:${pad2(mm || 0)}:${pad2(
      ss || 0
    )}`;
  };
  const valid = (y: number, m: number, d: number) => {
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100)
      return false;
    const dt = new Date(y, m - 1, d);
    return (
      dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
    );
  };

  type Cand = {
    y: number;
    m: number;
    d: number;
    hh?: number;
    mm?: number;
    ss?: number;
    score: number;
    snippet: string;
    idx: number;
  };

  const cands: Cand[] = [];

  // Regexes
  const reTime = /(\b[01]?\d|2[0-3])[:.](\d{2})(?:[:.](\d{2}))?\b/g; // 9:47, 14.23.17
  const reYMD = /\b(20\d{2}|19\d{2})[.\-\\/](\d{1,2})[.\-\\/](\d{1,2})\b/g;
  const reDMY = /\b(\d{1,2})[.\-\\/](\d{1,2})[.\-\\/](\d{2,4})\b/g;
  const reTextMonth = new RegExp(
    String.raw`\b(\d{1,2})\s+(${Object.keys(MONTHS).join("|")})\s+(\d{2,4})\b`,
    "gi"
  );

  // Pre-index times by position
  const times: Array<{ i: number; hh: number; mm: number; ss?: number }> = [];
  for (let m; (m = reTime.exec(norm)); ) {
    times.push({
      i: m.index,
      hh: +m[1],
      mm: +m[2],
      ss: m[3] ? +m[3] : undefined,
    });
  }
  const nearestTime = (i: number) => {
    let best: (typeof times)[0] | null = null;
    let bestDist = Infinity;
    for (const t of times) {
      const dist = Math.abs(t.i - i);
      if (dist < bestDist) {
        best = t;
        bestDist = dist;
      }
    }
    return best && bestDist <= 25 ? best : null; // within ~25 chars
  };

  // 1) YYYY-MM-DD (least ambiguous)
  for (let m; (m = reYMD.exec(norm)); ) {
    const y = +m[1],
      mo = +m[2],
      d = +m[3];
    if (!valid(y, mo, d)) continue;
    const t = nearestTime(m.index);
    const ctx = norm.slice(
      Math.max(0, m.index - 20),
      Math.min(norm.length, m.index + m[0].length + 20)
    );
    let score = 60; // base
    if (LABEL.test(ctx)) score += 20;
    if (t) score += 10;
    cands.push({
      y,
      m: mo,
      d,
      hh: t?.hh,
      mm: t?.mm,
      ss: t?.ss,
      score,
      snippet: ctx,
      idx: m.index,
    });
  }

  // 2) DD-MM-YYYY or MM-DD-YYYY (we prefer DMY)
  for (let m; (m = reDMY.exec(norm)); ) {
    const a = +m[1],
      b = +m[2];
    let y = +m[3];
    if (y < 100) y = expandYear(y);

    let d = a,
      mo = b;
    if (!preferDMY && a <= 12 && b <= 12) {
      // prefer MDY only if you flip the flag
      mo = a;
      d = b;
    } else if (preferDMY && a <= 31 && b <= 12) {
      // DMY as default
    } else if (a <= 12 && b <= 31 && !preferDMY) {
      mo = a;
      d = b;
    }
    if (!valid(y, mo, d)) continue;

    const t = nearestTime(m.index);
    const ctx = norm.slice(
      Math.max(0, m.index - 20),
      Math.min(norm.length, m.index + m[0].length + 20)
    );
    let score = 55;
    if (LABEL.test(ctx)) score += 20;
    if (t) score += 10;
    cands.push({
      y,
      m: mo,
      d,
      hh: t?.hh,
      mm: t?.mm,
      ss: t?.ss,
      score,
      snippet: ctx,
      idx: m.index,
    });
  }

  // 3) 17 feb 2019 / 7 augustus 2019
  for (let m; (m = reTextMonth.exec(norm)); ) {
    const d = +m[1];
    const mo = MONTHS[m[2].toLowerCase()];
    let y = +m[3];
    if (y < 100) y = expandYear(y);
    if (!valid(y, mo, d)) continue;

    const t = nearestTime(m.index);
    const ctx = norm.slice(
      Math.max(0, m.index - 20),
      Math.min(norm.length, m.index + m[0].length + 20)
    );
    let score = 65; // textual months are strong
    if (LABEL.test(ctx)) score += 15;
    if (t) score += 10;
    cands.push({
      y,
      m: mo,
      d,
      hh: t?.hh,
      mm: t?.mm,
      ss: t?.ss,
      score,
      snippet: ctx,
      idx: m.index,
    });
  }

  if (!cands.length) return null;

  // Prefer later-in-text (often totals/footer) slightly, then higher score
  cands.sort((A, B) => B.score - A.score || B.idx - A.idx);

  const best = cands[0];
  const iso = makeIso(best.y, best.m, best.d, best.hh, best.mm, best.ss);

  return {
    iso,
    date: `${best.y}-${pad2(best.m)}-${pad2(best.d)}`,
    time:
      best.hh != null
        ? `${pad2(best.hh)}:${pad2(best.mm ?? 0)}${
            best.ss != null ? `:${pad2(best.ss)}` : ""
          }`
        : undefined,
    confidence: Math.min(100, best.score),
    snippet: best.snippet.trim(),
  };
}
