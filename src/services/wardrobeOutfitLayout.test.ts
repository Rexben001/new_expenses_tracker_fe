import { describe, expect, test } from "vitest";
import {
  DEFAULT_OUTFIT_LAYOUT,
  normalizeGarmentTransform,
  normalizeOutfitLayout,
} from "./wardrobeOutfitLayout";

describe("wardrobe outfit layout", () => {
  test("falls back when stored layout is invalid", () => {
    expect(normalizeOutfitLayout({ garmentTransforms: null }))
      .toEqual(DEFAULT_OUTFIT_LAYOUT);
  });

  test("clamps unsafe garment placement values", () => {
    expect(normalizeGarmentTransform({
      x: 100,
      y: -100,
      scale: 9,
      rotation: -40,
    })).toEqual({ x: 25, y: -25, scale: 1.4, rotation: -12 });
  });

  test("preserves valid transforms from current or legacy settings", () => {
    expect(normalizeOutfitLayout({
      skinTone: "deep",
      garmentTransforms: {
        jacket: { x: 3, y: -2, scale: 1.1, rotation: 2 },
      },
    })).toEqual({
      garmentTransforms: {
        jacket: { x: 3, y: -2, scale: 1.1, rotation: 2 },
      },
    });
  });
});
