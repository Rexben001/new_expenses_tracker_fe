// utils/preprocess.ts
type PreprocessOpts = {
  maxWidth?: number; // default 1600
  format?: "image/webp" | "image/jpeg"; // default "image/webp"
  quality?: number; // default 0.9
  grayscale?: boolean; // default true
  contrast?: number; // default 1.1
};

function webpSupported(): boolean {
  const c = document.createElement("canvas");
  return c.toDataURL("image/webp").startsWith("data:image/webp");
}

// heic.ts
// If you use strict TS, add:  declare module "heic2any";
// If TS complains about types, add a d.ts:  declare module "heic2any";
export async function normalizeHeicToJpeg(file: File | Blob): Promise<Blob> {
  const name = (file as File).name || "";
  const type = (file as File).type || "";
  const isHeic = /image\/hei[cf]/i.test(type) || /\.(heic|heif)$/i.test(name);

  if (!isHeic) return file;

  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  return Array.isArray(out) ? (out[0] as Blob) : (out as Blob);
}

// NOTE: setting src *before* waiting is important—calling decode() too early was the bug.
function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
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

  if (!input || (input as File).size === 0) {
    throw new Error("Empty or invalid file.");
  }

  // 1) Decode to ImageBitmap (fast path), with fallback via <img>
  let bitmap: ImageBitmap | null = null;
  try {
    // imageOrientation honors EXIF rotation on supporting browsers
    bitmap = await createImageBitmap(input, { imageOrientation: "from-image" });
  } catch {
    // Fallback: blob URL -> <img> -> ImageBitmap
    const url = URL.createObjectURL(input);
    try {
      const img = await loadHtmlImage(url);
      bitmap = await createImageBitmap(img, { imageOrientation: "from-image" });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (!bitmap) throw new Error("Failed to decode image.");

  // 2) Scale
  const srcW = bitmap.width;
  const scale = Math.min(1, maxWidth / (srcW || 1));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  // 3) Draw with GPU filters (grayscale/contrast) — no per-pixel JS loops
  const useOffscreen = typeof OffscreenCanvas !== "undefined";
  const canvas = useOffscreen
    ? new OffscreenCanvas(w, h)
    : document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // @ts-expect-error: imageSmoothingEnabled may not be present on all canvas contexts
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    ctx.imageSmoothingQuality = "high";
  }
  // @ts-expect-error: ctx.filter is not present on all canvas contexts, but is supported in modern browsers
  ctx.filter = `${grayscale ? "grayscale(1)" : ""} ${
    contrast !== 1 ? `contrast(${contrast})` : ""
  }`.trim();
  // @ts-expect-error: drawImage may not accept ImageBitmap in all TS versions
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  // 4) Export (prefer WebP, fallback to JPEG if not supported)
  const wantType =
    format === "image/webp" && !webpSupported() ? "image/jpeg" : format;

  if ("convertToBlob" in canvas) {
    return await (canvas as OffscreenCanvas).convertToBlob({
      type: wantType,
      quality,
    });
  }
  return await new Promise<Blob>((resolve, reject) =>
    (canvas as HTMLCanvasElement).toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      wantType,
      quality
    )
  );
}
