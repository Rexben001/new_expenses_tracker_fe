import { describe, expect, test } from "vitest";
import type { FoodItem } from "../types/food";
import {
  daysUntilExpiry,
  getFoodStatus,
  getFoodItemIcon,
  isFreshnessFlagged,
  needsRestock,
} from "./foodInventory";

const item: FoodItem = {
  id: "rice",
  name: "Rice",
  category: "food",
  quantity: 2,
  unit: "kg",
  minimumQuantity: 1,
  buy: false,
  opened: false,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

describe("food inventory", () => {
  test("identifies low and manually requested restocks", () => {
    expect(needsRestock({ ...item, quantity: 1 })).toBe(true);
    expect(needsRestock({ ...item, buy: true })).toBe(true);
    expect(getFoodStatus({ ...item, quantity: 0 })).toBe("out");
  });

  test("does not auto-restock soups or cooked food", () => {
    expect(needsRestock({ ...item, category: "cooked", quantity: 0 })).toBe(
      false
    );
    expect(
      needsRestock({ ...item, category: "soup", quantity: 0, buy: true })
    ).toBe(true);
  });

  test("chooses recognizable food icons", () => {
    expect(getFoodItemIcon({ category: "cooked", name: "Cooked rice" })).toBe(
      "🍚"
    );
    expect(getFoodItemIcon({ category: "vegetable", name: "Broccoli" })).toBe(
      "🥦"
    );
  });

  test("classifies expiry against local calendar days", () => {
    const now = new Date(2026, 6, 19, 18);
    expect(daysUntilExpiry("2026-07-22", now)).toBe(3);
    expect(getFoodStatus({ ...item, expiryDate: "2026-07-22" }, now)).toBe(
      "expiring"
    );
    expect(getFoodStatus({ ...item, expiryDate: "2026-07-18" }, now)).toBe(
      "expired"
    );
  });

  test("flags fresh and cooked foods after more than three days", () => {
    const now = new Date(2026, 6, 20, 18);

    expect(
      isFreshnessFlagged(
        { ...item, category: "fruit", boughtDate: "2026-07-17" },
        now
      )
    ).toBe(false);
    expect(
      getFoodStatus(
        { ...item, category: "vegetable", boughtDate: "2026-07-16" },
        now
      )
    ).toBe("stale");
    expect(
      getFoodStatus(
        { ...item, category: "soup", cookedDate: "2026-07-16" },
        now
      )
    ).toBe("stale");
  });
});
