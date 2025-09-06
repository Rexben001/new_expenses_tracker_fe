import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Tesseract from "tesseract.js";
import { preprocessInBrowser } from "../services/preprocessInBrowser";
import { suggestCategory } from "../services/suggestCategory";
import { parseReceipt } from "../services/parseReceipt";

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
      const processed = await preprocessInBrowser(file);

      const {
        data: { text },
      } = await Tesseract.recognize(processed, "eng", {
        logger: (m) => {
          if (
            m.status === "recognizing text" &&
            typeof m.progress === "number"
          ) {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const parsed = parseReceipt(text);

      const category =
        suggestCategory(parsed.merchant || undefined, text) || undefined;

      console.log({
        parsed,
        category,
      });

      navigate("/expenses/new", {
        replace: true,
        state: {
          amount: parsed.total ?? "",
          title: parsed.merchant ?? "",
          category,
          ocrText: text,
        },
      });
    } catch (e: unknown) {
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
