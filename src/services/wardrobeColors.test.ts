import { describe, expect, it } from "vitest";
import {
  analyzeDominantColor,
  analyzeRgb,
  getColorFamily,
  getColorTone,
  hexToRgb,
  rgbToHex,
} from "./wardrobeColors";

describe("wardrobe color analysis", () => {
  it("round-trips hexadecimal colors", () => {
    expect(rgbToHex(hexToRgb("#2f80ed"))).toBe("#2f80ed");
    expect(rgbToHex(hexToRgb("fff"))).toBe("#ffffff");
  });

  it("groups common clothing colors", () => {
    expect(getColorFamily({ r: 8, g: 8, b: 10 })).toBe("black");
    expect(getColorFamily({ r: 248, g: 247, b: 244 })).toBe("white");
    expect(getColorFamily({ r: 30, g: 90, b: 190 })).toBe("blue");
    expect(getColorFamily({ r: 224, g: 190, b: 145 })).toBe("beige");
    expect(getColorFamily({ r: 104, g: 61, b: 27 })).toBe("brown");
  });

  it("uses relative luminance for light and dark groups", () => {
    expect(getColorTone({ r: 245, g: 215, b: 80 })).toBe("light");
    expect(getColorTone({ r: 28, g: 45, b: 92 })).toBe("dark");
  });

  it("finds dominant visible color and ignores transparent pixels", () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,
      255, 0, 0, 255,
      0, 0, 255, 0,
      255, 0, 0, 255,
    ]);
    const result = analyzeDominantColor({ data, width: 2, height: 2 } as ImageData);

    expect(result.colorFamily).toBe("red");
    expect(result.colorTone).toBe("dark");
  });

  it("normalizes analyzed RGB values", () => {
    expect(analyzeRgb({ r: 300, g: -5, b: 127.6 })).toMatchObject({
      colorHex: "#ff0080",
      rgb: { r: 255, g: 0, b: 128 },
    });
  });
});

