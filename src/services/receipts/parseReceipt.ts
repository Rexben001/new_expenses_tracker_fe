import { extractReceiptDate } from "./getDate";
import { getMerchantName } from "./getMerchantName";
import { pickTotalsNL } from "./getTotal";

type Parsed = {
  merchant: string | null;
  total: string | null;
  rawText: string;
  date: string | null;
};

export function parseReceipt(text: string): Parsed {
  const merchant = getMerchantName({ rawText: text });
  const total = pickTotalsNL(text);
  const hit = extractReceiptDate(text);
  let date;
  if (hit) {
    date = hit.date;
  } else {
    date = null;
  }

  const totalAmt =
    total.used === "basket" ? total.basketTotal : total.paidTotal;

  return {
    merchant,
    total: totalAmt,
    date,
    rawText: text,
  };
}
