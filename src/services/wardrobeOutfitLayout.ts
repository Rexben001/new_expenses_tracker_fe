export type GarmentTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type OutfitLayoutSettings = {
  garmentTransforms: Record<string, GarmentTransform>;
};

export const DEFAULT_GARMENT_TRANSFORM: GarmentTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};

export const DEFAULT_OUTFIT_LAYOUT: OutfitLayoutSettings = {
  garmentTransforms: {},
};

const STORAGE_KEY = "closet-match-outfit-layout-v1";
const LEGACY_STORAGE_KEY = "closet-match-mannequin-v1";

function numberBetween(value: unknown, minimum: number, maximum: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeGarmentTransform(value: unknown): GarmentTransform {
  const transform = value && typeof value === "object"
    ? (value as Partial<GarmentTransform>)
    : {};
  return {
    x: numberBetween(transform.x, -25, 25, 0),
    y: numberBetween(transform.y, -25, 25, 0),
    scale: numberBetween(transform.scale, 0.7, 1.4, 1),
    rotation: numberBetween(transform.rotation, -12, 12, 0),
  };
}

export function normalizeOutfitLayout(value: unknown): OutfitLayoutSettings {
  const settings = value && typeof value === "object"
    ? (value as Partial<OutfitLayoutSettings>)
    : {};
  const sourceTransforms = settings.garmentTransforms && typeof settings.garmentTransforms === "object"
    ? settings.garmentTransforms
    : {};
  const garmentTransforms = Object.fromEntries(
    Object.entries(sourceTransforms)
      .filter(([itemId]) => itemId.trim().length > 0)
      .map(([itemId, transform]) => [itemId, normalizeGarmentTransform(transform)]),
  );

  return { garmentTransforms };
}

export function loadOutfitLayout(): OutfitLayoutSettings {
  if (typeof window === "undefined") return DEFAULT_OUTFIT_LAYOUT;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
      ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored
      ? normalizeOutfitLayout(JSON.parse(stored) as unknown)
      : DEFAULT_OUTFIT_LAYOUT;
  } catch {
    return DEFAULT_OUTFIT_LAYOUT;
  }
}

export function saveOutfitLayout(settings: OutfitLayoutSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Layout still works for this session when storage is unavailable.
  }
}
