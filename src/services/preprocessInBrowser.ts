export async function preprocessInBrowser(file: File): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("Failed to load image"));
    img.src = url;
  });

  const targetW = Math.min(1800, img.width);
  const scale = targetW / img.width;
  const w = targetW;
  const h = Math.round(img.height * (scale || 1));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    d[i] = d[i + 1] = d[i + 2] = gray;
  }
  ctx.putImageData(imgData, 0, 0);
  URL.revokeObjectURL(url);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
      0.95
    )
  );
  return blob;
}

type PreprocessOpts = {
  maxWidth?: number; // default 1600
  format?: "image/webp" | "image/jpeg"; // default "image/webp"
  quality?: number; // 0..1, default 0.9
  contrast?: number; // e.g. 1.1 -> +10% contrast
  grayscale?: boolean; // default true
};

export async function preprocessInBrowserFast(
  file: File,
  opts: PreprocessOpts = {}
): Promise<Blob> {
  const {
    maxWidth = 1600,
    format = "image/webp",
    quality = 0.9,
    contrast = 1.1,
    grayscale = true,
  } = opts;

  // Try to decode as an ImageBitmap (fast path)
  let bitmap: ImageBitmap | null = null;
  try {
    // Resize during decode if supported.
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = null;
  }

  // Determine target size
  let srcW: number, srcH: number;
  if (bitmap) {
    srcW = bitmap.width;
    srcH = bitmap.height;
  } else {
    // Fallback to <img> decode
    const img = new Image();
    const url = URL.createObjectURL(file);
    await img.decode?.().catch(() => {});
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("Failed to load image"));
      img.src = url;
    });
    srcW = img.naturalWidth || img.width;
    srcH = img.naturalHeight || img.height;
    bitmap = await createImageBitmap(img); // still faster to draw
    URL.revokeObjectURL(url);
  }

  const scale = Math.min(1, maxWidth / (srcW || 1));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  // Use OffscreenCanvas when available (faster, has convertToBlob)
  const canUseOffscreen = typeof OffscreenCanvas !== "undefined";
  const canvas = canUseOffscreen
    ? new OffscreenCanvas(w, h)
    : document.createElement("canvas");
  // @ts-ignore width/height are present on both
  canvas.width = w;
  // @ts-ignore
  canvas.height = h;
  const ctx = (canvas as any).getContext("2d", {
    willReadFrequently: false,
  }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Canvas not supported");

  // GPU-accelerated filters instead of manual loops
  const filterParts = [];
  if (grayscale) filterParts.push("grayscale(1)");
  if (contrast !== 1) filterParts.push(`contrast(${contrast})`);
  // @ts-ignore
  ctx.filter = filterParts.join(" ") || "none";

  // Draw scaled + filtered
  // @ts-ignore
  ctx.imageSmoothingQuality = "high";
  // @ts-ignore
  ctx.imageSmoothingEnabled = true;
  // @ts-ignore
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  // Export (OffscreenCanvas has convertToBlob, which is faster than toBlob)
  if ("convertToBlob" in canvas) {
    // @ts-ignore
    return await (canvas as OffscreenCanvas).convertToBlob({
      type: format,
      quality,
    });
  }

  // Fallback for normal canvas
  const outFormat = formatSupported(format) ? format : "image/jpeg";
  return await new Promise<Blob>((resolve, reject) =>
    (canvas as HTMLCanvasElement).toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      outFormat,
      quality
    )
  );
}

function formatSupported(type: string) {
  // Quick check for WebP support (widely supported now)
  if (type !== "image/webp") return true;
  const c = document.createElement("canvas");
  return c.toDataURL("image/webp").startsWith("data:image/webp");
}
