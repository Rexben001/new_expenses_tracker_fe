// ocrWorker.ts
import { createWorker, OEM, type Worker } from "tesseract.js";
let _worker: Worker | null = null;

// ocrWorker.ts

export async function getOcrWorker(
  lang: "eng" | "nld" = "nld",
  setProgress: (p: number) => void = () => {}
) {
  if (_worker) return _worker;
  _worker = await createWorker(lang, OEM.DEFAULT, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        setProgress(Math.round(m.progress * 100));
      }
    },
  });
  await _worker.setParameters({
    psm: 4, // assume a single column of text (receipts)
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789€$.,:-/ &",
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
  });
  return _worker;
}
