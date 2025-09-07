// ocr-guard.ts
export class ReceiptOcrError extends Error {
  constructor(reason: string, score: number) {
    super(`OCR_TOO_NOISY: ${reason} (score=${score})`);
  }
}

export type OcrMeta = { confidence?: number };

type GuardOpts = {
  minScore?: number; // overall quality threshold
  minLines?: number; // structure requirement
  minChars?: number; // reject very short blobs
  requireAmount?: boolean; // must see at least one price-like value
  requireSignals?: boolean; // must see receipt words (total/totaal/btw/…)
};

const NL_SIGNALS = [
  "totaal",
  "algemeen",
  "btw",
  "korting",
  "te betalen",
  "kassabon",
  "bonnr",
  "filiaal",
  "datum",
  "tijd",
  "pin",
  "contant",
  "wisselgeld",
  "subtotaal",
];
const EN_SIGNALS = [
  "total",
  "amount due",
  "subtotal",
  "tax",
  "cash",
  "card",
  "change",
  "invoice",
  "receipt",
];
const POSTCODE_RE = /\b[1-9]\d{3}\s?[A-Z]{2}\b/; // 1017 AH
const PHONE_RE = /(tel(?:efoon)?|phone|\+?\d[\d ()\\-]{6,})/i;
const CURRENCY_RE = /(€|eur|euro|\$|£)/i;
const AMOUNT_RE = /(?:€|eur|\$|£)?\s*[-+]?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\b/gi;

export function assertUsableReceipt(
  rawText: string,
  meta: OcrMeta = {},
  {
    minScore = 50,
    minLines = 6,
    minChars = 80,
    requireAmount = true,
    requireSignals = true,
  }: GuardOpts = {}
): void {
  const text = (rawText || "").replace(/\u00A0/g, " ").trim();

  // quick hard rejections
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (text.length < minChars)
    throw new ReceiptOcrError("Too few characters", 0);
  if (lines.length < minLines) throw new ReceiptOcrError("Too few lines", 0);

  // stats
  const letters = (text.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  const digits = (text.match(/\d/g) || []).length;
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const oneLetterShare =
    tokens.filter((t) => t.length === 1).length / Math.max(1, tokens.length);
  const longTokens = tokens.filter((t) => t.length >= 3);
  const noVowelShare =
    longTokens.filter((t) => !/[aeiouyáéíóúäëïöü]/i.test(t)).length /
    Math.max(1, longTokens.length);

  const signalsCount =
    NL_SIGNALS.filter((w) => text.toLowerCase().includes(w)).length +
    EN_SIGNALS.filter((w) => text.toLowerCase().includes(w)).length +
    (POSTCODE_RE.test(text) ? 1 : 0) +
    (PHONE_RE.test(text) ? 1 : 0) +
    (CURRENCY_RE.test(text) ? 1 : 0);

  const amounts = text.match(AMOUNT_RE)?.length ?? 0;

  // composite score (0–100)
  let score = 0;
  const alphaRatio = letters / Math.max(1, text.length);
  const digitRatio = digits / Math.max(1, text.length);

  if (alphaRatio >= 0.35) score += 20;
  else if (alphaRatio >= 0.25) score += 10;
  if (digitRatio >= 0.05 && digitRatio <= 0.4) score += 10;
  if (oneLetterShare < 0.25) score += 15; // not mostly single letters
  if (noVowelShare < 0.55) score += 10; // words look pronounceable
  score += Math.min(20, signalsCount * 5);
  score += Math.min(15, amounts * 5);
  if (lines.length >= 10) score += 5;

  if (typeof meta.confidence === "number")
    score += Math.min(15, Math.max(0, meta.confidence) * 0.15);
  score = Math.max(0, Math.min(100, Math.round(score)));

  // reasons to fail
  if (oneLetterShare > 0.4)
    throw new ReceiptOcrError(
      "Too many single-letter tokens (looks like noise)",
      score
    );
  if (alphaRatio < 0.2)
    throw new ReceiptOcrError("Hardly any letters detected", score);
  if (requireSignals && signalsCount === 0)
    throw new ReceiptOcrError(
      "No receipt-like words (total/totaal/btw/…)",
      score
    );
  if (requireAmount && amounts === 0)
    throw new ReceiptOcrError("No price-like amounts found", score);
  if (score < minScore)
    throw new ReceiptOcrError("Low OCR quality score", score);
}
