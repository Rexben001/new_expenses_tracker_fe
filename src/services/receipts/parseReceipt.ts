import { extractReceiptDate } from "./getDate";
import { getMerchantName } from "./getMerchantName";
import { pickTotalNL } from "./getTotal";

type Parsed = {
  merchant: string | null;
  total: string | null;
  rawText: string;
  date: string | null;
};

export function parseReceipt(text: string): Parsed {
  const merchant = getMerchantName({ rawText: text });
  const total = pickTotalNL(text);
  const hit = extractReceiptDate(text);
  let date;
  if (hit) {
    date = hit.date;
  } else {
    date = null;
  }

  return { merchant, total, date, rawText: text };
}
