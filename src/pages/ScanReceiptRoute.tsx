import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  normalizeHeicToJpeg,
  isLikelyFreshCameraCapture,
  preprocessInBrowserFast,
} from "../services/receipts/preprocessInBrowser";
import { suggestCategory } from "../services/suggestCategory";
import { parseReceipt } from "../services/receipts/parseReceipt";
import { getOcrWorker } from "../services/receipts/ocrWorker";
import { assertUsableReceipt } from "../services/receipts/ocrGuard";

export default function ScanReceiptRoute() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");

  const openCamera = () => inputRef.current?.click();

  useEffect(() => {
    const id = setTimeout(() => openCamera(), 100);
    return () => clearTimeout(id);
  }, []);

  const handleSelect = async (file: File) => {
    setError("");
    setIsScanning(true);
    setProgress(0);

    try {
      const worker = await getOcrWorker("nld", setProgress);

      let newData: Tesseract.Page;

      // If freshly captured via picker, skip HEIC conversion and use smaller max width
      if (isLikelyFreshCameraCapture(file)) {
        const processed = await preprocessInBrowserFast(file, {
          maxWidth: 1200,
        });
        const { data } = await worker.recognize(processed);
        newData = data;
      } else {
        const safe = await normalizeHeicToJpeg(file);
        const processed = await preprocessInBrowserFast(safe, {
          maxWidth: 1400,
        });
        const { data } = await worker.recognize(processed);
        newData = data;
      }

      const { text, confidence } = newData;
      assertUsableReceipt(text, { confidence: confidence });

      const { merchant, total, date } = parseReceipt(text);

      const category =
        suggestCategory(merchant || undefined, text) || undefined;

      navigate("/expenses/new", {
        replace: true,
        state: {
          amount: total ?? "",
          title: merchant ?? "",
          category,
          ocrText: text,
          updatedAt: date ?? "",
        },
      });
    } catch (e: unknown) {
      console.log({ e });
      setError(e instanceof Error ? e.message : "OCR failed");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-lg font-semibold">Scan a receipt</h2>
      <p className="text-sm text-gray-600 mb-3">
        Your camera will open. Good lighting and filling the frame help OCR.
        Make sure to crosscheck the value before saving. Works best with short
        receipts
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openCamera}
          disabled={isScanning}
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
        >
          {isScanning ? `Scanning… ${progress}%` : "Open Camera"}
        </button>

        <label className="px-4 py-2 rounded-md border cursor-pointer">
          Choose from gallery
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) handleSelect(f);
            }}
          />
        </label>
      </div>

      {error && <div className="text-red-600 mt-3">{error}</div>}

      {/* Hidden camera capture input (auto-triggered) */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) handleSelect(f);
        }}
      />
    </div>
  );
}

/**
 * TODO: Support date
 * Support multiple categories suggestions
 */
