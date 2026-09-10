import { describe, expect, it } from "vitest";
import type { ShoppingItem } from "../types/shopping";
import { filterShoppingItems } from "./shoppingSearch";

const items = [
  {
    id: "1",
    name: "Crème soap",
    category: "Personal care",
    notes: "Sensitive skin",
    quantity: 2,
    unit: "packs",
    source: "custom",
  },
  {
    id: "2",
    name: "Rice",
    category: "Household",
    notes: "",
    quantity: 1,
    unit: "kg",
    source: "foodTracker",
    purchasedAt: "2026-09-10T10:00:00.000Z",
  },
] as ShoppingItem[];

describe("shopping search", () => {
  it("searches names without case or accent sensitivity", () => {
    expect(filterShoppingItems(items, "CREME")).toEqual([items[0]]);
  });

  it("matches multiple terms across category, notes, unit, and history date", () => {
    expect(filterShoppingItems(items, "personal sensitive")).toEqual([items[0]]);
    expect(filterShoppingItems(items, "rice kg")).toEqual([items[1]]);
    expect(filterShoppingItems(items, "2026-09-10")).toEqual([items[1]]);
  });

  it("returns the original list for a blank query", () => {
    expect(filterShoppingItems(items, "   ")).toBe(items);
  });
});
