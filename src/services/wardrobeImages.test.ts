import { describe, expect, test } from "vitest";
import {
  createEdgeConnectedBackgroundMask,
  cropTransparentPixels,
  estimateBorderBackground,
  featherBackgroundMask,
  removeBackgroundFromPixels,
  suggestWardrobeCategory,
  type PixelBuffer,
} from "./wardrobeImages";

type Pixel = [number, number, number, number?];

function pixelBuffer(rows: Pixel[][]): PixelBuffer {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  if (!width || rows.some((row) => row.length !== width)) {
    throw new Error("Test pixels must form a non-empty rectangle.");
  }
  const data = new Uint8ClampedArray(width * height * 4);
  rows.flat().forEach(([red, green, blue, alpha = 255], index) => {
    data[index * 4] = red;
    data[index * 4 + 1] = green;
    data[index * 4 + 2] = blue;
    data[index * 4 + 3] = alpha;
  });
  return { width, height, data };
}

const white: Pixel = [248, 249, 247];
const softWhite: Pixel = [242, 245, 243];
const red: Pixel = [190, 25, 35];

describe("wardrobe background-removal pixel core", () => {
  test("estimates the dominant border colour without using centre pixels", () => {
    const image = pixelBuffer([
      [white, white, softWhite, white, white],
      [softWhite, red, red, red, white],
      [white, red, [10, 10, 10], red, softWhite],
      [white, red, red, red, white],
      [softWhite, white, white, softWhite, white],
    ]);

    const background = estimateBorderBackground(image, 1);

    expect(background.r).toBeGreaterThanOrEqual(242);
    expect(background.g).toBeGreaterThanOrEqual(245);
    expect(background.b).toBeGreaterThanOrEqual(243);
  });

  test("flood fill removes only background pixels connected to an edge", () => {
    const image = pixelBuffer([
      [white, white, white, white, white],
      [white, red, red, red, white],
      [white, red, white, red, white],
      [white, red, red, red, white],
      [white, white, white, white, white],
    ]);

    const mask = createEdgeConnectedBackgroundMask(
      image,
      { r: 248, g: 249, b: 247 },
      20,
    );

    expect(mask[0]).toBe(1);
    expect(mask[2 * image.width + 2]).toBe(0);
    expect(mask[2 * image.width + 1]).toBe(0);
  });

  test("background threshold controls which connected colours are removed", () => {
    const gray: Pixel = [210, 210, 210];
    const image = pixelBuffer([
      [white, gray, white],
      [white, red, white],
      [white, white, white],
    ]);
    const background = { r: 248, g: 249, b: 247 };

    const strictMask = createEdgeConnectedBackgroundMask(image, background, 25);
    const looseMask = createEdgeConnectedBackgroundMask(image, background, 70);

    expect(strictMask[1]).toBe(0);
    expect(looseMask[1]).toBe(1);
  });

  test("feathers foreground alpha while leaving its interior opaque", () => {
    const rows = Array.from({ length: 7 }, (_, y) =>
      Array.from({ length: 7 }, (_, x) =>
        x === 0 || x === 6 || y === 0 || y === 6 ? white : red,
      ),
    );
    const image = pixelBuffer(rows);
    const mask = createEdgeConnectedBackgroundMask(
      image,
      { r: 248, g: 249, b: 247 },
      20,
    );

    const feathered = featherBackgroundMask(image, mask, 2);
    const alphaAt = (x: number, y: number) =>
      feathered.data[(y * feathered.width + x) * 4 + 3];

    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(1, 3)).toBeGreaterThan(0);
    expect(alphaAt(1, 3)).toBeLessThan(255);
    expect(alphaAt(3, 3)).toBe(255);
  });

  test("crops alpha bounds with clamped padding", () => {
    const transparent: Pixel = [0, 0, 0, 0];
    const image = pixelBuffer([
      [transparent, transparent, transparent, transparent, transparent],
      [transparent, transparent, red, red, transparent],
      [transparent, transparent, red, red, transparent],
      [transparent, transparent, red, red, transparent],
      [transparent, transparent, transparent, transparent, transparent],
    ]);

    const cropped = cropTransparentPixels(image, 1);

    expect(cropped?.bounds).toEqual({ x: 1, y: 0, width: 4, height: 5 });
    expect(cropped?.image.data[(1 * 4 + 1) * 4 + 3]).toBe(255);
  });

  test("composes estimation, masking, feathering, and cropping", () => {
    const image = pixelBuffer([
      [white, white, white, white, white, white, white],
      [white, white, white, white, white, white, white],
      [white, white, red, red, red, white, white],
      [white, white, red, red, red, white, white],
      [white, white, red, red, red, white, white],
      [white, white, white, white, white, white, white],
      [white, white, white, white, white, white, white],
    ]);

    const result = removeBackgroundFromPixels(image, {
      backgroundThreshold: 20,
      borderWidth: 1,
      cropPadding: 1,
      featherRadius: 0,
    });

    expect(result.image.width).toBe(5);
    expect(result.image.height).toBe(5);
    expect(result.cropBounds).toEqual({ x: 1, y: 1, width: 5, height: 5 });
    expect(result.image.data[(2 * 5 + 2) * 4 + 3]).toBe(255);
  });

  test("suggests trousers from separated lower legs", () => {
    const transparent: Pixel = [0, 0, 0, 0];
    const fabric: Pixel = [30, 50, 90, 255];
    const rows = Array.from({ length: 12 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        if (y < 6) return x >= 2 && x <= 5 ? fabric : transparent;
        return x === 2 || x === 3 || x === 5 || x === 6
          ? fabric
          : transparent;
      }),
    );

    expect(suggestWardrobeCategory(pixelBuffer(rows)).category).toBe(
      "trousers",
    );
  });

  test("suggests dress for one tall continuous silhouette", () => {
    const transparent: Pixel = [0, 0, 0, 0];
    const fabric: Pixel = [160, 30, 40, 255];
    const rows = Array.from({ length: 16 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        const halfWidth = y < 5 ? 2 : 3;
        return Math.abs(x - 3.5) <= halfWidth ? fabric : transparent;
      }),
    );

    expect(suggestWardrobeCategory(pixelBuffer(rows)).category).toBe("dress");
  });
});
