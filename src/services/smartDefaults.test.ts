import { describe, expect, test } from "vitest";
import {
  applyUntouchedDefaults,
  buildWardrobeName,
  findExactNamedItem,
  inferHowToMetadata,
  inferShoppingDefaults,
  nextCalendarStartTime,
} from "./smartDefaults";

describe("smart defaults", () => {
  test("matches history names without punctuation or case", () => {
    const item = findExactNamedItem("  BOL.COM ", [{ name: "Bol com", value: 3 }], (entry) => entry.name);
    expect(item?.value).toBe(3);
  });

  test("does not replace touched fields", () => {
    expect(applyUntouchedDefaults(
      { category: "Custom", amount: 10 },
      { category: "Food", amount: 20 },
      new Set<"category" | "amount">(["category"]),
    )).toEqual({ category: "Custom", amount: 20 });
  });

  test("uses shopping history before keyword rules", () => {
    expect(inferShoppingDefaults("Shampoo", [
      { name: "shampoo", quantity: 2, unit: "bottles", category: "Other" },
    ])).toEqual({ quantity: 2, unit: "bottles", category: "Other" });
    expect(inferShoppingDefaults("phone charger", [])?.category).toBe("Electronics");
  });

  test("infers How-To metadata and wardrobe names", () => {
    expect(inferHowToMetadata("How to pay the electricity bill")?.category).toBe("Payments");
    expect(buildWardrobeName({
      category: "trousers",
      colorFamily: "blue",
      colorTone: "dark",
    })).toBe("Dark blue trousers");
  });

  test("finds the next free half-hour calendar slot", () => {
    const entries = [{
      id: "entry-1",
      date: "2026-09-04",
      status: "booked" as const,
      clients: [{
        name: "Client",
        startTime: "09:00",
        hairStyle: { style: "knotless", size: "medium" as const, length: "bra" },
      }],
      updatedAt: "2026-09-03",
    }];
    expect(nextCalendarStartTime("2026-09-04", entries, new Date("2026-09-03T10:00:00")))
      .toBe("09:30");
  });
});
