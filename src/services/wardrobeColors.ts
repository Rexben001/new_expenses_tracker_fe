import type {
  WardrobeColorFamily,
  WardrobeColorTone,
} from "../types/wardrobe";

export type RgbColor = { r: number; g: number; b: number };

export type WardrobeColorAnalysis = {
  colorFamily: WardrobeColorFamily;
  colorHex: string;
  colorTone: WardrobeColorTone;
  rgb: RgbColor;
};

const clampByte = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)));

export function rgbToHex({ r, g, b }: RgbColor) {
  return `#${[r, g, b]
    .map((value) => clampByte(value).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function hexToRgb(value: string): RgbColor {
  const normalized = value.trim().replace(/^#/, "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    throw new Error("Color must use #RRGGBB format.");
  }

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

export function rgbToHsl({ r, g, b }: RgbColor) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) return { hue: 0, saturation: 0, lightness };

  const saturation =
    lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);
  let hue: number;

  if (max === red) {
    hue = ((green - blue) / delta + (green < blue ? 6 : 0)) * 60;
  } else if (max === green) {
    hue = ((blue - red) / delta + 2) * 60;
  } else {
    hue = ((red - green) / delta + 4) * 60;
  }

  return { hue, saturation, lightness };
}

function channelLuminance(channel: number) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance({ r, g, b }: RgbColor) {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function getColorTone(rgb: RgbColor): WardrobeColorTone {
  return getRelativeLuminance(rgb) >= 0.36 ? "light" : "dark";
}

export function getColorFamily(rgb: RgbColor): WardrobeColorFamily {
  const { hue, saturation, lightness } = rgbToHsl(rgb);

  if (lightness <= 0.15) return "black";
  if (lightness >= 0.9 && Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b) <= 20) {
    return "white";
  }
  if (saturation <= 0.12) return "gray";
  if (hue >= 32 && hue < 62 && saturation <= 0.65 && lightness >= 0.56) {
    return "beige";
  }
  if (hue >= 12 && hue < 48 && lightness <= 0.5) return "brown";
  if (hue < 15 || hue >= 345) return "red";
  if (hue < 45) return "orange";
  if (hue < 70) return "yellow";
  if (hue < 165) return "green";
  if (hue < 255) return "blue";
  if (hue < 300) return "purple";
  return "pink";
}

export function analyzeRgb(rgb: RgbColor): WardrobeColorAnalysis {
  const normalized = {
    r: clampByte(rgb.r),
    g: clampByte(rgb.g),
    b: clampByte(rgb.b),
  };
  return {
    rgb: normalized,
    colorHex: rgbToHex(normalized),
    colorFamily: getColorFamily(normalized),
    colorTone: getColorTone(normalized),
  };
}

type ColorBucket = RgbColor & { count: number };

export function analyzeDominantColor(
  imageData: ImageData,
): WardrobeColorAnalysis {
  const buckets = new Map<string, ColorBucket>();
  const { data } = imageData;
  const pixelCount = imageData.width * imageData.height;
  const sampleStride =
    pixelCount > 800_000 ? 8 : pixelCount > 400_000 ? 4 : pixelCount > 120_000 ? 2 : 1;

  for (let index = 0; index < data.length; index += sampleStride * 4) {
    if (data[index + 3] < 128) continue;
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const key = `${Math.round(red / 24)}:${Math.round(green / 24)}:${Math.round(
      blue / 24,
    )}`;
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += red;
    bucket.g += green;
    bucket.b += blue;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  const dominant = [...buckets.values()].sort((left, right) => {
    const leftAverage = {
      r: left.r / left.count,
      g: left.g / left.count,
      b: left.b / left.count,
    };
    const rightAverage = {
      r: right.r / right.count,
      g: right.g / right.count,
      b: right.b / right.count,
    };
    const leftSaturation = rgbToHsl(leftAverage).saturation;
    const rightSaturation = rgbToHsl(rightAverage).saturation;
    const leftScore = left.count * (0.85 + leftSaturation * 0.15);
    const rightScore = right.count * (0.85 + rightSaturation * 0.15);
    return rightScore - leftScore;
  })[0];

  if (!dominant) return analyzeRgb({ r: 128, g: 128, b: 128 });

  return analyzeRgb({
    r: dominant.r / dominant.count,
    g: dominant.g / dominant.count,
    b: dominant.b / dominant.count,
  });
}
