import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FooterNav } from "../components/FooterNav";
import SwipeShell from "../components/SwipeShell";
import { scanReceiptV2 } from "../services/api";
import {
  isHeicImage,
  isLikelyFreshCameraCapture,
  normalizeHeicToJpeg,
  preprocessInBrowserFast,
} from "../services/receipts/preprocessInBrowser";
import { suggestCategory } from "../services/suggestCategory";

export default function ScanReceiptV2Route() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");

  const openCamera = () => inputRef.current?.click();

  useEffect(() => {
    const id = setTimeout(() => openCamera(), 100);
    return () => clearTimeout(id);
  }, []);

  const handleSelect = async (file: File) => {
    setError("");
    setIsScanning(true);
    setStatus("Preparing image");

    try {
      const source =
        isHeicImage(file) || !isLikelyFreshCameraCapture(file)
          ? await normalizeHeicToJpeg(file)
          : file;

      let processed: Blob;
      try {
        processed = await preprocessInBrowserFast(source, {
          maxWidth: 1800,
          format: "image/jpeg",
          quality: 0.86,
          grayscale: false,
          contrast: 1,
        });
      } catch (error) {
        if (isHeicImage(file)) {
          throw new Error(
            "Could not convert this HEIC receipt. Please try saving it as JPEG or retake the photo with Most Compatible enabled."
          );
        }
        throw error;
      }

      setStatus("Reading receipt with Textract");
      const imageBase64 = await blobToBase64(processed);
      const result = await scanReceiptV2({
        imageBase64,
        contentType: processed.type || "image/jpeg",
        fileName: file.name,
      });

      if (!result.rawText && !result.total && !result.merchant) {
        throw new Error("Textract could not read this receipt clearly.");
      }

      const merchant = normalizeReceiptField(result.merchant);
      const category =
        suggestCategory(merchant || undefined, result.rawText) ||
        undefined;

      navigate("/expenses/new", {
        replace: true,
        state: {
          amount: result.total ?? "",
          title: merchant,
          category,
          ocrText: result.rawText,
          updatedAt: result.date ?? "",
        },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Receipt scan failed");
      setStatus("Ready");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <SwipeShell refresh={Promise.resolve}>
      <div className="max-w-md mx-auto p-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Textract v2
          </p>
          <h2 className="text-lg font-semibold">Scan a receipt</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Your receipt is sent to Amazon Textract, then the expense form is
            prefilled with the detected merchant, total, and date.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {isScanning ? status : "Use the camera or choose an existing image."}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={openCamera}
              disabled={isScanning}
              className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
            >
              {isScanning ? "Scanning..." : "Open Camera"}
            </button>

            <label className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 cursor-pointer text-center">
              Choose from gallery
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0];
                  if (f) handleSelect(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 mt-3 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/expenses/scan")}
          className="mt-4 text-sm text-blue-600 dark:text-blue-300"
        >
          Use original on-device scanner
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f) handleSelect(f);
            e.currentTarget.value = "";
          }}
        />
      </div>
      <FooterNav />
    </SwipeShell>
  );
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read receipt image."));
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.readAsDataURL(blob);
  });
}

function normalizeReceiptField(value: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}
