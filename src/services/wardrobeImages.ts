import type { WardrobeColorAnalysis, RgbColor } from "./wardrobeColors";
import { analyzeDominantColor } from "./wardrobeColors";
import {
  isHeicImage,
  normalizeHeicToJpeg,
} from "./receipts/preprocessInBrowser";
import type { WardrobeCategory } from "../types/wardrobe";

export type PixelBuffer = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type CropBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WardrobeImageOptions = {
  /** Longest output edge before transparent cropping. */
  maxDimension?: number;
  /** RGB distance accepted as background. Higher removes more pixels. */
  backgroundThreshold?: number;
  /** Width of the image border sampled to estimate the background. */
  borderWidth?: number;
  /** Number of foreground pixels used to soften the cutout edge. */
  featherRadius?: number;
  /** Transparent pixels retained around the cropped garment. */
  cropPadding?: number;
};

export type BackgroundRemovalResult = {
  image: PixelBuffer;
  backgroundColor: RgbColor;
  backgroundMask: Uint8Array;
  cropBounds: CropBounds;
};

export type ProcessedWardrobeImage = {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  backgroundColor: RgbColor;
  colorAnalysis: WardrobeColorAnalysis;
  categorySuggestion: WardrobeCategorySuggestion;
};

export type WardrobeCategorySuggestion = {
  category: WardrobeCategory;
  confidence: number;
  reason: string;
};

const DEFAULT_MAX_DIMENSION = 1_400;
const DEFAULT_BACKGROUND_THRESHOLD = 58;
const DEFAULT_FEATHER_RADIUS = 2;

function assertPixelBuffer(image: PixelBuffer) {
  if (
    !Number.isInteger(image.width) ||
    !Number.isInteger(image.height) ||
    image.width <= 0 ||
    image.height <= 0 ||
    image.data.length !== image.width * image.height * 4
  ) {
    throw new Error("Invalid pixel buffer.");
  }
}

function clampInteger(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function colorDistanceSquared(
  red: number,
  green: number,
  blue: number,
  color: RgbColor,
) {
  const redDelta = red - color.r;
  const greenDelta = green - color.g;
  const blueDelta = blue - color.b;
  return (
    redDelta * redDelta +
    greenDelta * greenDelta +
    blueDelta * blueDelta
  );
}

/**
 * Estimates a plain photo background from the most common quantized colour
 * around the image border. Subject pixels touching one edge therefore do not
 * dominate the estimate when the rest of the border remains visible.
 */
export function estimateBorderBackground(
  image: PixelBuffer,
  requestedBorderWidth?: number,
): RgbColor {
  assertPixelBuffer(image);
  const borderWidth = clampInteger(
    requestedBorderWidth ?? Math.min(24, Math.max(1, Math.round(Math.min(image.width, image.height) * 0.04))),
    1,
    Math.max(1, Math.ceil(Math.min(image.width, image.height) / 2)),
  );
  const sampleStep = Math.max(
    1,
    Math.floor(Math.max(image.width, image.height) / 500),
  );
  const buckets = new Map<
    string,
    { count: number; red: number; green: number; blue: number }
  >();
  const samples: RgbColor[] = [];

  for (let y = 0; y < image.height; y += sampleStep) {
    for (let x = 0; x < image.width; x += sampleStep) {
      const isBorder =
        x < borderWidth ||
        x >= image.width - borderWidth ||
        y < borderWidth ||
        y >= image.height - borderWidth;
      if (!isBorder) continue;

      const offset = (y * image.width + x) * 4;
      if (image.data[offset + 3] < 16) continue;
      const sample = {
        r: image.data[offset],
        g: image.data[offset + 1],
        b: image.data[offset + 2],
      };
      samples.push(sample);
      const key = `${Math.floor(sample.r / 24)}:${Math.floor(
        sample.g / 24,
      )}:${Math.floor(sample.b / 24)}`;
      const bucket = buckets.get(key) ?? {
        count: 0,
        red: 0,
        green: 0,
        blue: 0,
      };
      bucket.count += 1;
      bucket.red += sample.r;
      bucket.green += sample.g;
      bucket.blue += sample.b;
      buckets.set(key, bucket);
    }
  }

  const dominant = [...buckets.values()].sort(
    (left, right) => right.count - left.count,
  )[0];
  if (!dominant) {
    throw new Error("Could not estimate the image background.");
  }

  const initial = {
    r: dominant.red / dominant.count,
    g: dominant.green / dominant.count,
    b: dominant.blue / dominant.count,
  };
  const refinementDistanceSquared = 42 * 42;
  const refined = samples.reduce(
    (total, sample) => {
      if (
        colorDistanceSquared(sample.r, sample.g, sample.b, initial) <=
        refinementDistanceSquared
      ) {
        total.count += 1;
        total.red += sample.r;
        total.green += sample.g;
        total.blue += sample.b;
      }
      return total;
    },
    { count: 0, red: 0, green: 0, blue: 0 },
  );

  const source = refined.count > 0 ? refined : dominant;
  return {
    r: Math.round(source.red / source.count),
    g: Math.round(source.green / source.count),
    b: Math.round(source.blue / source.count),
  };
}

/** Marks only background-like pixels connected to an outside edge. */
export function createEdgeConnectedBackgroundMask(
  image: PixelBuffer,
  backgroundColor: RgbColor,
  threshold = DEFAULT_BACKGROUND_THRESHOLD,
) {
  assertPixelBuffer(image);
  const normalizedThreshold = Math.max(0, Math.min(441, threshold));
  const thresholdSquared = normalizedThreshold * normalizedThreshold;
  const pixelCount = image.width * image.height;
  const mask = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const isBackgroundLike = (pixelIndex: number) => {
    const offset = pixelIndex * 4;
    return (
      image.data[offset + 3] < 16 ||
      colorDistanceSquared(
        image.data[offset],
        image.data[offset + 1],
        image.data[offset + 2],
        backgroundColor,
      ) <= thresholdSquared
    );
  };
  const enqueue = (pixelIndex: number) => {
    if (mask[pixelIndex] || !isBackgroundLike(pixelIndex)) return;
    mask[pixelIndex] = 1;
    queue[tail] = pixelIndex;
    tail += 1;
  };

  for (let x = 0; x < image.width; x += 1) {
    enqueue(x);
    if (image.height > 1) enqueue((image.height - 1) * image.width + x);
  }
  for (let y = 1; y < image.height - 1; y += 1) {
    enqueue(y * image.width);
    if (image.width > 1) enqueue(y * image.width + image.width - 1);
  }

  while (head < tail) {
    const pixelIndex = queue[head];
    head += 1;
    const x = pixelIndex % image.width;
    const y = Math.floor(pixelIndex / image.width);
    if (x > 0) enqueue(pixelIndex - 1);
    if (x + 1 < image.width) enqueue(pixelIndex + 1);
    if (y > 0) enqueue(pixelIndex - image.width);
    if (y + 1 < image.height) enqueue(pixelIndex + image.width);
  }

  return mask;
}

/** Applies a transparent mask and softens foreground pixels near its edge. */
export function featherBackgroundMask(
  image: PixelBuffer,
  backgroundMask: Uint8Array,
  featherRadius = DEFAULT_FEATHER_RADIUS,
): PixelBuffer {
  assertPixelBuffer(image);
  if (backgroundMask.length !== image.width * image.height) {
    throw new Error("Background mask size does not match image.");
  }

  const radius = clampInteger(featherRadius, 0, 12);
  const output = new Uint8ClampedArray(image.data);

  if (radius === 0) {
    for (
      let pixelIndex = 0;
      pixelIndex < backgroundMask.length;
      pixelIndex += 1
    ) {
      if (backgroundMask[pixelIndex]) output[pixelIndex * 4 + 3] = 0;
    }
    return { width: image.width, height: image.height, data: output };
  }

  const distances = new Uint8Array(backgroundMask.length);
  distances.fill(255);
  const queue = new Int32Array(backgroundMask.length);
  let head = 0;
  let tail = 0;

  for (let pixelIndex = 0; pixelIndex < backgroundMask.length; pixelIndex += 1) {
    if (!backgroundMask[pixelIndex]) continue;
    distances[pixelIndex] = 0;
    queue[tail] = pixelIndex;
    tail += 1;
  }

  const visit = (pixelIndex: number, distance: number) => {
    if (distances[pixelIndex] !== 255) return;
    distances[pixelIndex] = distance;
    queue[tail] = pixelIndex;
    tail += 1;
  };

  while (head < tail) {
    const pixelIndex = queue[head];
    head += 1;
    const distance = distances[pixelIndex];
    if (distance >= radius) continue;
    const nextDistance = distance + 1;
    const x = pixelIndex % image.width;
    const y = Math.floor(pixelIndex / image.width);
    if (x > 0) visit(pixelIndex - 1, nextDistance);
    if (x + 1 < image.width) visit(pixelIndex + 1, nextDistance);
    if (y > 0) visit(pixelIndex - image.width, nextDistance);
    if (y + 1 < image.height) visit(pixelIndex + image.width, nextDistance);
  }

  for (let pixelIndex = 0; pixelIndex < backgroundMask.length; pixelIndex += 1) {
    const alphaOffset = pixelIndex * 4 + 3;
    if (backgroundMask[pixelIndex]) {
      output[alphaOffset] = 0;
      continue;
    }
    if (output[alphaOffset] === 0) continue;
    const distance = distances[pixelIndex];
    if (distance <= radius) {
      const opacity = Math.min(1, distance / (radius + 1));
      output[alphaOffset] = Math.round(output[alphaOffset] * opacity);
    }
  }

  return { width: image.width, height: image.height, data: output };
}

export function cropTransparentPixels(
  image: PixelBuffer,
  padding = 0,
  alphaThreshold = 8,
): { image: PixelBuffer; bounds: CropBounds } | null {
  assertPixelBuffer(image);
  let minimumX = image.width;
  let minimumY = image.height;
  let maximumX = -1;
  let maximumY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.data[(y * image.width + x) * 4 + 3] <= alphaThreshold) {
        continue;
      }
      minimumX = Math.min(minimumX, x);
      minimumY = Math.min(minimumY, y);
      maximumX = Math.max(maximumX, x);
      maximumY = Math.max(maximumY, y);
    }
  }

  if (maximumX < minimumX || maximumY < minimumY) return null;
  const normalizedPadding = clampInteger(
    padding,
    0,
    Math.max(image.width, image.height),
  );
  const x = Math.max(0, minimumX - normalizedPadding);
  const y = Math.max(0, minimumY - normalizedPadding);
  const right = Math.min(image.width - 1, maximumX + normalizedPadding);
  const bottom = Math.min(image.height - 1, maximumY + normalizedPadding);
  const width = right - x + 1;
  const height = bottom - y + 1;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let outputY = 0; outputY < height; outputY += 1) {
    const sourceStart = ((y + outputY) * image.width + x) * 4;
    const outputStart = outputY * width * 4;
    data.set(
      image.data.subarray(sourceStart, sourceStart + width * 4),
      outputStart,
    );
  }

  return {
    image: { width, height, data },
    bounds: { x, y, width, height },
  };
}

/** DOM-free background removal core used by the browser pipeline and tests. */
export function removeBackgroundFromPixels(
  image: PixelBuffer,
  options: Omit<WardrobeImageOptions, "maxDimension"> = {},
): BackgroundRemovalResult {
  const backgroundColor = estimateBorderBackground(
    image,
    options.borderWidth,
  );
  const backgroundMask = createEdgeConnectedBackgroundMask(
    image,
    backgroundColor,
    options.backgroundThreshold,
  );
  const feathered = featherBackgroundMask(
    image,
    backgroundMask,
    options.featherRadius,
  );
  const defaultPadding = Math.max(
    4,
    Math.round(Math.min(image.width, image.height) * 0.02),
  );
  const cropped = cropTransparentPixels(
    feathered,
    options.cropPadding ?? defaultPadding,
  );
  if (!cropped) {
    throw new Error(
      "Could not separate the garment from its background. Try a lower removal threshold or a more contrasting background.",
    );
  }

  return {
    image: cropped.image,
    backgroundColor,
    backgroundMask,
    cropBounds: cropped.bounds,
  };
}

/**
 * Uses cutout silhouette only. This is intentionally a suggestion: shape can
 * identify split legs and long garments, but cannot reliably read fabric or
 * construction details that separate a shirt, top, and blazer.
 */
export function suggestWardrobeCategory(
  image: PixelBuffer,
): WardrobeCategorySuggestion {
  assertPixelBuffer(image);
  const occupiedAt = (x: number, y: number) =>
    image.data[(y * image.width + x) * 4 + 3] >= 48;
  const rowWidth = (y: number) => {
    let first = image.width;
    let last = -1;
    for (let x = 0; x < image.width; x += 1) {
      if (!occupiedAt(x, y)) continue;
      first = Math.min(first, x);
      last = Math.max(last, x);
    }
    return last < first ? 0 : last - first + 1;
  };
  const averageWidth = (from: number, to: number) => {
    const widths: number[] = [];
    const start = Math.max(0, Math.floor(image.height * from));
    const end = Math.min(image.height, Math.ceil(image.height * to));
    const step = Math.max(1, Math.floor((end - start) / 24));
    for (let y = start; y < end; y += step) {
      const width = rowWidth(y);
      if (width > 0) widths.push(width);
    }
    return widths.length
      ? widths.reduce((total, width) => total + width, 0) / widths.length
      : 0;
  };

  const aspect = image.height / image.width;
  const upperWidth = averageWidth(0.08, 0.36);
  const middleWidth = averageWidth(0.36, 0.62);
  const lowerWidth = averageWidth(0.66, 0.92);
  let splitLegRows = 0;
  let testedLegRows = 0;
  const legStart = Math.floor(image.height * 0.58);
  const legStep = Math.max(1, Math.floor(image.height / 45));

  for (let y = legStart; y < image.height; y += legStep) {
    testedLegRows += 1;
    const centerFrom = Math.floor(image.width * 0.43);
    const centerTo = Math.ceil(image.width * 0.57);
    let centerOccupied = 0;
    for (let x = centerFrom; x < centerTo; x += 1) {
      if (occupiedAt(x, y)) centerOccupied += 1;
    }
    const leftOccupied = Array.from(
      { length: Math.max(0, centerFrom) },
      (_, x) => occupiedAt(x, y),
    ).some(Boolean);
    const rightOccupied = Array.from(
      { length: Math.max(0, image.width - centerTo) },
      (_, offset) => occupiedAt(centerTo + offset, y),
    ).some(Boolean);
    if (
      leftOccupied &&
      rightOccupied &&
      centerOccupied <= Math.max(1, (centerTo - centerFrom) * 0.18)
    ) {
      splitLegRows += 1;
    }
  }

  const splitScore = testedLegRows ? splitLegRows / testedLegRows : 0;
  if (aspect >= 1.15 && splitScore >= 0.3) {
    return {
      category: "trousers",
      confidence: Math.min(0.9, 0.65 + splitScore * 0.25),
      reason: "long silhouette with two separated lower sections",
    };
  }
  if (aspect >= 1.48) {
    return {
      category: "dress",
      confidence: Math.min(0.82, 0.62 + (aspect - 1.48) * 0.12),
      reason: "single long silhouette without a leg split",
    };
  }
  if (
    aspect >= 0.78 &&
    aspect < 1.48 &&
    lowerWidth > Math.max(upperWidth, middleWidth) * 1.12
  ) {
    return {
      category: "skirt",
      confidence: 0.64,
      reason: "short silhouette that widens toward the hem",
    };
  }
  if (aspect >= 1.12 && middleWidth >= upperWidth * 0.78) {
    return {
      category: "blazer-jacket",
      confidence: 0.46,
      reason: "long upper-body silhouette; confirm jacket versus long shirt",
    };
  }
  if (upperWidth > middleWidth * 1.28) {
    return {
      category: "shirt",
      confidence: 0.43,
      reason: "wide sleeve span; confirm shirt versus sleeved top",
    };
  }
  return {
    category: "top",
    confidence: 0.4,
    reason: "compact upper-body silhouette; manual confirmation recommended",
  };
}

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
};

async function decodeImage(blob: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch {
      // Browser image element fallback handles formats unsupported by ImageBitmap.
    }
  }

  if (
    typeof Image === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    throw new Error("Image decoding is not supported in this browser.");
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.decoding = "async";
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode this image."));
      element.src = objectUrl;
    });
    return {
      source: image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      dispose: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function createCanvas(width: number, height: number) {
  if (typeof document === "undefined") {
    throw new Error("Wardrobe image processing requires a browser.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not encode the garment image.")),
      "image/png",
    );
  });
}

/**
 * Browser entry point. Processes exactly one image and creates a transparent
 * PNG plus a local preview URL. Call URL.revokeObjectURL(previewUrl) when the
 * preview is replaced or unmounted.
 */
export async function processWardrobeImage(
  file: File,
  options: WardrobeImageOptions = {},
): Promise<ProcessedWardrobeImage> {
  if (!file || file.size === 0) throw new Error("Choose a non-empty image.");
  if (!file.type.startsWith("image/") && !isHeicImage(file)) {
    throw new Error("Choose an image file.");
  }

  const normalized = await normalizeHeicToJpeg(file);
  const decoded = await decodeImage(normalized);
  try {
    if (!decoded.width || !decoded.height) {
      throw new Error("Image has invalid dimensions.");
    }
    const maxDimension = clampInteger(
      options.maxDimension ?? DEFAULT_MAX_DIMENSION,
      128,
      4_096,
    );
    const scale = Math.min(
      1,
      maxDimension / Math.max(decoded.width, decoded.height),
    );
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const sourceCanvas = createCanvas(width, height);
    const sourceContext = sourceCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!sourceContext) throw new Error("Canvas is not supported.");
    sourceContext.imageSmoothingEnabled = true;
    sourceContext.imageSmoothingQuality = "high";
    sourceContext.drawImage(decoded.source, 0, 0, width, height);
    const sourceImageData = sourceContext.getImageData(0, 0, width, height);
    const removed = removeBackgroundFromPixels(sourceImageData, options);

    const outputCanvas = createCanvas(
      removed.image.width,
      removed.image.height,
    );
    const outputContext = outputCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!outputContext) throw new Error("Canvas is not supported.");
    const outputImageData = outputContext.createImageData(
      removed.image.width,
      removed.image.height,
    );
    outputImageData.data.set(removed.image.data);
    outputContext.putImageData(outputImageData, 0, 0);

    const colorAnalysis = analyzeDominantColor(outputImageData);
    const categorySuggestion = suggestWardrobeCategory(removed.image);
    const blob = await canvasToPngBlob(outputCanvas);
    if (
      typeof URL === "undefined" ||
      typeof URL.createObjectURL !== "function"
    ) {
      throw new Error("Image previews are not supported in this browser.");
    }

    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
      width: removed.image.width,
      height: removed.image.height,
      originalWidth: decoded.width,
      originalHeight: decoded.height,
      backgroundColor: removed.backgroundColor,
      colorAnalysis,
      categorySuggestion,
    };
  } finally {
    decoded.dispose();
  }
}
