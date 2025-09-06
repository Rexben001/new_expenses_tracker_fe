type Parsed = {
  merchant: string | null;
  total: string | null;
  rawText: string;
};

function parseReceipt(text: string): Parsed {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const merchant = (() => {
    const l = lines.find((s) => /[A-Za-z]{3,}/.test(s));
    if (!l) return null;
    return (
      l
        .replace(/[^A-Za-z\s&'.-]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim() || null
    );
  })();

  const findAmount = (needle: string): string | null => {
    for (const line of lines) {
      if (line.toLowerCase().includes(needle)) {
        const m = line.match(/\$?\s*([0-9]+[.,][0-9]{2})/);
        if (m) return m[1].replace(",", ".");
      }
    }
    return null;
  };

  let total =
    findAmount("order total") ||
    findAmount("grand total") ||
    findAmount("total");

  if (!total) {
    const nums = [...text.matchAll(/\$?\s*([0-9]+[.,][0-9]{2})/g)]
      .map((m) => parseFloat(m[1].replace(",", ".")))
      .filter((n) => !Number.isNaN(n));
    if (nums.length) total = Math.max(...nums).toFixed(2);
  }

  return { merchant, total: total ?? null, rawText: text };
}
export { parseReceipt };
