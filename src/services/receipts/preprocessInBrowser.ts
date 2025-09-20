// utils/preprocess.ts
type PreprocessOpts = {
  maxWidth?: number; // default 1600
  format?: "image/webp" | "image/jpeg"; // default "image/webp"
  quality?: number; // default 0.9
  grayscale?: boolean; // default true
  contrast?: number; // default 1.1
};

let _webpSupported: boolean | null = null;
export function webpSupported(): boolean {
  if (_webpSupported != null) return _webpSupported;
  try {
    if (typeof document !== "undefined") {
      const c = document.createElement("canvas");
      _webpSupported = c.toDataURL("image/webp").startsWith("data:image/webp");
      return _webpSupported;
    }
    if (typeof OffscreenCanvas !== "undefined") {
      const oc = new OffscreenCanvas(1, 1);
      _webpSupported = "convertToBlob" in oc; // heuristic; we still retry encode below
      return _webpSupported;
    }
  } catch {}
  _webpSupported = false;
  return false;
}

export async function normalizeHeicToJpeg(file: File | Blob): Promise<Blob> {
  const name = (file as File).name || "";
  const type = (file as File).type || "";
  const isHeic = /image\/hei[cf]/i.test(type) || /\.(heic|heif)$/i.test(name);

  if (!isHeic) return file;

  try {
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
    return Array.isArray(out) ? (out[0] as Blob) : (out as Blob);
  } catch {
    // Safari can often decode HEIC directly; let downstream try.
    return file;
  }
}

// NOTE: setting src *before* waiting is important—calling decode() too early was the bug.
function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image decode failed"));
    img.src = src;
  });
}

/** Last-ditch: data URL (helps with odd blob URL issues on some iOS builds) */

export function isLikelyFreshCameraCapture(file: File, minutes = 3) {
  const isPhoto = /^image\//.test(file.type);
  const fresh = Date.now() - file.lastModified < minutes * 60 * 1000; // taken just now
  // Camera snaps are usually JPEG on Android; iOS may be HEIC. Keep it loose.
  return isPhoto && fresh;
}

// preprocess.ts
export async function preprocessInBrowserFast(
  input: File | Blob,
  opts: PreprocessOpts = {}
): Promise<Blob> {
  const {
    maxWidth = 1600,
    format = "image/webp",
    quality = 0.9,
    grayscale = true,
    contrast = 1.1,
  } = opts;

  if (!input || (input as File).size === 0)
    throw new Error("Empty or invalid file.");

  let drawSource: ImageBitmap | HTMLImageElement | null = null;
  let srcWidth = 0,
    srcHeight = 0;

  const canCreate = typeof createImageBitmap === "function";
  if (canCreate) {
    try {
      const bm = await createImageBitmap(input);
      if (bm) {
        drawSource = bm;
        srcWidth = bm.width;
        srcHeight = bm.height;
      }
    } catch {}
  }

  if (!drawSource) {
    const url =
      typeof URL !== "undefined" && URL.createObjectURL
        ? URL.createObjectURL(input)
        : "";
    try {
      const img = await loadHtmlImage(url || (input as any));
      drawSource = img;
      srcWidth = img.naturalWidth || img.width;
      srcHeight = img.naturalHeight || img.height;
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  }

  if (!drawSource || !srcWidth || !srcHeight)
    throw new Error("Failed to decode image.");

  const scale = Math.min(1, maxWidth / srcWidth);
  const w = Math.max(1, Math.round(srcWidth * scale));
  const h = Math.max(1, Math.round(srcHeight * scale));

  const canvas = drawToCanvas(drawSource, w, h, { grayscale, contrast });
  (drawSource as ImageBitmap).close?.();

  const wantType =
    format === "image/webp" && !webpSupported() ? "image/jpeg" : format;
  return await exportCanvasBlob(canvas, wantType, quality);
}

async function exportCanvasBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: "image/webp" | "image/jpeg",
  quality: number
): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    try {
      return await (canvas as OffscreenCanvas).convertToBlob({ type, quality });
    } catch {
      if (type === "image/webp") {
        return await (canvas as OffscreenCanvas).convertToBlob({
          type: "image/jpeg",
          quality,
        });
      }
      throw new Error("convertToBlob failed");
    }
  }
  return await new Promise<Blob>((resolve, reject) =>
    (canvas as HTMLCanvasElement).toBlob(
      (b) => {
        if (b) return resolve(b);
        if (type === "image/webp") {
          (canvas as HTMLCanvasElement).toBlob(
            (b2) => (b2 ? resolve(b2) : reject(new Error("toBlob failed"))),
            "image/jpeg",
            quality
          );
        } else {
          reject(new Error("toBlob failed"));
        }
      },
      type,
      quality
    )
  );
}

function drawToCanvas(
  src: ImageBitmap | HTMLImageElement,
  w: number,
  h: number,
  opts: { grayscale: boolean; contrast: number }
) {
  const useOffscreen = typeof OffscreenCanvas !== "undefined";
  const canvas = useOffscreen
    ? new OffscreenCanvas(w, h)
    : document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Narrow context type to those supporting drawImage
  if (
    ctx instanceof CanvasRenderingContext2D ||
    (typeof OffscreenCanvasRenderingContext2D !== "undefined" && ctx instanceof OffscreenCanvasRenderingContext2D)
  ) {
    if ("imageSmoothingEnabled" in ctx) ctx.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";

    if ("filter" in ctx) {
      const parts: string[] = [];
      if (opts.grayscale) parts.push("grayscale(1)");
      if (opts.contrast !== 1) parts.push(`contrast(${opts.contrast})`);
      ctx.filter = parts.join(" ");
    }

    ctx.drawImage(src, 0, 0, w, h);
  } else {
    throw new Error("Unsupported canvas context for drawing images.");
  }
  return canvas as OffscreenCanvas | HTMLCanvasElement;
}
