// merchant.ts
// getMerchantName({ rawText, preferShortBrand? }) -> brand | null

import { getFirstItem } from "./getFirstName";

/* ===================== Public API ===================== */

export type MerchantOpts = {
  rawText: string; // full data.text from tesseract.js
  preferShortBrand?: boolean; // e.g., "Dirk" instead of "Dirk van den Broek"
  fallbackToItem?: boolean; // if no brand found, return first item line (for independents)
};

export function getMerchantName(opts: MerchantOpts): string | null {
  const { rawText, preferShortBrand, fallbackToItem = true } = opts;
  if (!rawText) return null;

  // 1) VAT → brand (robust to OCR noise)
  const byVat = brandFromVatText(rawText);
  if (byVat) return maybeShorten(byVat, preferShortBrand);

  // 2) Fuzzy brand for big chains
  const byText = brandFromTextFuzzy(rawText);
  if (byText) return maybeShorten(byText, preferShortBrand);

  const byHeaderGeneric = merchantFromGenericHeader(rawText);
  if (byHeaderGeneric) return byHeaderGeneric;

  if (fallbackToItem) {
    const item = getFirstItem(rawText);
    if (item) return item;
  }

  // 5) Last-chance tiny header heuristic
  const byQuickHeader = headerHeuristic(rawText);
  return byQuickHeader ? maybeShorten(byQuickHeader, preferShortBrand) : null;
}

/* ===================== VAT mapping ===================== */

export const VAT_MAP: Record<string, string[] | undefined> = {
  "Dirk van den Broek": ["NL008492529B01"],
  "Albert Heijn": ["NL002230884B01"],
  Jumbo: ["NL001172359B01"],
  Lidl: ["NL804079043B01"],
  ALDI: ["NL814075095B01"],
  PLUS: ["NL001550548B01"],
  Action: ["NL813233409B01"],
  "Gall & Gall": ["NL003183592B01"],
  Etos: ["NL003183579B01"],
  Kruidvat: ["NL004461034B01"],
  HEMA: ["NL814217412B01"],
  IKEA: ["NL004445879B01"],
  Blokker: ["NL003481773B01"],
  Gamma: ["NL005681716B01"],
  Praxis: ["NL004371021B01"],
  MediaMarkt: ["NL814700792B01", "NL009453180B01"],
  Decathlon: ["NL819689762B01"],
};

const VAT_TO_BRAND: Record<string, string> = Object.entries(VAT_MAP).reduce(
  (acc, [brand, vats]) => {
    (vats ?? []).forEach((v) => (acc[v] = brand));
    return acc;
  },
  {} as Record<string, string>
);

/* ===================== VAT extraction (tolerant) ===================== */

type VatHit = { vat: string; index: number };

export function extractNLVats(rawText: string): VatHit[] {
  if (!rawText) return [];
  const clean = rawText
    .normalize("NFKD")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const mapDigit = (ch: string): string | null => {
    if (/[0-9]/.test(ch)) return ch;
    switch (ch) {
      case "O":
      case "D":
      case "Q":
        return "0";
      case "I":
      case "L":
        return "1";
      case "S":
        return "5";
      case "Z":
        return "2";
      case "G":
        return "6";
      case "B":
        return "8"; // in the 9-digit block
      default:
        return null;
    }
  };

  const hits: VatHit[] = [];
  for (let i = 0; i < clean.length - 13; i++) {
    if (clean[i] !== "N") continue;
    const L = clean[i + 1];
    if (!(L === "L" || L === "I" || L === "1")) continue;

    // 9 digits
    let j = i + 2,
      digits = "";
    while (j < clean.length && digits.length < 9) {
      const d = mapDigit(clean[j]);
      if (d != null) digits += d;
      j++;
    }
    if (digits.length !== 9) continue;

    // 'B' (allow '8') within a few chars
    let k = j,
      bPos = -1;
    for (let step = 0; step < 6 && k < clean.length; step++, k++) {
      const c = clean[k];
      if (c === "B" || c === "8") {
        bPos = k;
        break;
      }
    }
    if (bPos < 0) continue;

    // 2 digits
    let suf = "",
      m = bPos + 1;
    while (m < clean.length && suf.length < 2) {
      const d = mapDigit(clean[m]);
      if (d != null) suf += d;
      m++;
    }
    if (suf.length !== 2) continue;

    hits.push({ vat: `NL${digits}B${suf}`, index: i });
  }

  const seen = new Map<string, number>();
  for (const h of hits) {
    if (!seen.has(h.vat) || h.index < (seen.get(h.vat) as number))
      seen.set(h.vat, h.index);
  }
  return Array.from(seen.entries()).map(([vat, index]) => ({ vat, index }));
}

function brandFromVatText(rawText: string): string | null {
  const hits = extractNLVats(rawText);
  for (const h of hits) {
    const brand = VAT_TO_BRAND[h.vat];
    if (brand) return brand;
  }
  return null;
}

/* === Replace your BRANDS and brandFromTextFuzzy with this === */

type Brand = { canonical: string; aliases: string[] };
const BRANDS: Brand[] = [
  {
    canonical: "Dirk van den Broek",
    aliases: ["dirk van den broek", "dirk van de broek", "dirk"],
  },
  {
    canonical: "Action",
    aliases: ["action", "action nederland", "action nederland bv"],
  },
  // NOTE: we intentionally DROP the short alias "ah" to avoid false matches
  { canonical: "Albert Heijn", aliases: ["albert heijn", "ah to go"] },
  { canonical: "Jumbo", aliases: ["jumbo"] },
  { canonical: "Lidl", aliases: ["lidl"] },
  { canonical: "ALDI", aliases: ["aldi"] },
  { canonical: "PLUS", aliases: ["plus", "plus supermarkt"] },
  { canonical: "HEMA", aliases: ["hema"] },
  { canonical: "Kruidvat", aliases: ["kruidvat"] },
  { canonical: "Etos", aliases: ["etos"] },
];

function brandFromTextFuzzy(rawText: string): string | null {
  const t = normalizeAscii(rawText);

  // Special handling: standalone "AH" token only in the header area
  const header = normalizeAscii(rawText.split(/\r?\n/).slice(0, 8).join(" "));
  if (/\bah\b/.test(header)) return "Albert Heijn";

  for (const b of BRANDS) {
    for (const alias of b.aliases) {
      if (fuzzyContains(t, alias)) return b.canonical;
    }
  }
  // Dirk wobble sometimes seen in OCR
  if (/\bpirk\b/.test(t) && /\bvan den\b/.test(t) && /\bbreek\b/.test(t)) {
    return "Dirk van den Broek";
  }
  return null;
}

function normalizeAscii(s: string) {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyContains(
  textNorm: string,
  needle: string,
  relErr = 0.35
): boolean {
  const n = normalizeAscii(needle);
  if (!textNorm || !n) return false;
  if (textNorm.includes(n)) return true;

  const tTok = textNorm.split(" ");
  const nTok = n.split(" ");
  const win = Math.max(1, nTok.length);

  for (let i = 0; i < tTok.length; i++) {
    const w = tTok.slice(i, i + win + 2).join(" ");
    if (levenshtein(w, n) <= Math.ceil(n.length * relErr)) return true;
  }
  return false;
}

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[n];
}

/* ===================== Generic header extractor (NEW) ===================== */

const BUSINESS_KEYWORDS = [
  "market",
  "winkel",
  "supermarkt",
  "toko",
  "bakery",
  "bakkerij",
  "slager",
  "slagerij",
  "restaurant",
  "cafe",
  "mart",
  "shop",
  "store",
  "groenteman",
];
function merchantFromGenericHeader(rawText: string): string | null {
  const linesAll = rawText
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!linesAll.length) return null;

  // Limit to the visual header: everything before obvious meta like "Kassabon"/"Bonnr"
  const stopIdx = linesAll.findIndex((l) =>
    /\b(kassabon|bonnr|klantticket|invoice|factuur)\b/i.test(l)
  );
  const lines = linesAll.slice(
    0,
    stopIdx >= 0 ? stopIdx : Math.min(20, linesAll.length)
  );

  const BAD =
    /(delete|online|kassabon|bonnr|klantticket|totaal|subtotal|subtotaal|btw|datum|tijd|verk\.?|filiaal|terminal|transactie)/i;
  const hasDigits = (s: string) => /\d/.test(s);

  // PASS 1: Keyword lines (e.g., “… MARKET”, “… WINKEL”, “… SUPERMARKT”)
  for (const line of lines) {
    const s = stripPunctEnds(line);
    if (!s || BAD.test(s) || hasDigits(s)) continue;
    if (BUSINESS_KEYWORDS.some((k) => s.toLowerCase().includes(k))) {
      return finalizeHeaderName(s);
    }
  }

  // PASS 2: Best all-letters line (caps-heavy, no digits), scored
  const candidates = lines
    .map((s) => stripPunctEnds(s))
    .filter((s) => s && !BAD.test(s) && !hasDigits(s) && /[A-Za-z]{3,}/.test(s))
    .map((s) => ({
      text: s,
      score:
        ratioUpper(s) * 2 + // uppercase is a strong signal for logos/titles
        Math.min(s.replace(/[^A-Za-z]/g, "").length / 10, 3),
    }))
    .sort((a, b) => b.score - a.score);

  if (candidates.length) return finalizeHeaderName(candidates[0].text);
  return null;
}

function stripPunctEnds(s: string) {
  return s.replace(/^[\s:;.,\-–—•*_]+/, "").replace(/[\s:;.,\-–—•*_]+$/, "");
}
function ratioUpper(s: string) {
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (!letters) return 0;
  const upp = (letters.match(/[A-Z]/g) || []).length;
  return upp / letters.length;
}
function isAlphaWord(w: string) {
  return /^[A-Za-zÀ-ÿ'&.-]+$/.test(w);
}
function isConnector(w: string) {
  return /^(van|de|den|en|&)$/i.test(w);
}

function finalizeHeaderName(s: string): string {
  const t = stripPunctEnds(s).replace(/\s+/g, " ").trim();
  const toks = t.split(" ").filter(Boolean);

  // drop leading single-letter garbage (e.g., "i a AMANKS MARKET")
  while (toks.length && toks[0].length === 1 && !isConnector(toks[0]))
    toks.shift();

  const low = toks.map((x) => x.toLowerCase());
  const kwIdx = low.findIndex((x) => BUSINESS_KEYWORDS.includes(x));
  if (kwIdx >= 0) {
    const keep: string[] = [];
    for (let i = Math.max(0, kwIdx - 3); i < kwIdx; i++) {
      const w = toks[i];
      if (w.length >= 2 && (isAlphaWord(w) || isConnector(w))) keep.push(w);
    }
    keep.push(toks[kwIdx]);
    return keep
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return toks.join(" ");
}

/* ===================== Quick chain header fallback ===================== */

function headerHeuristic(rawText: string): string | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  const joined = normalizeAscii(lines.join(" "));
  if (/\baction\b/.test(joined)) return "Action";
  if (/\bdirk\b/.test(joined)) return "Dirk van den Broek";
  if (/\balbert heijn\b/.test(joined) || /\bah to go\b/.test(joined))
    return "Albert Heijn";
  if (/\bjumbo\b/.test(joined)) return "Jumbo";
  if (/\blidl\b/.test(joined)) return "Lidl";
  if (/\baldi\b/.test(joined)) return "ALDI";
  if (/\bplus\b/.test(joined)) return "PLUS";
  if (/\bhema\b/.test(joined)) return "HEMA";
  if (/\bkruidvat\b/.test(joined)) return "Kruidvat";
  if (/\betos\b/.test(joined)) return "Etos";
  return null;
}

/* ===================== Helpers ===================== */

function maybeShorten(canonical: string, short?: boolean) {
  if (!short) return canonical;
  if (/^Dirk van den Broek$/i.test(canonical)) return "Dirk";
  return canonical;
}
