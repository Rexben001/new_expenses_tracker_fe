import { describe, expect, it } from "vitest";
import type {
  WardrobeCategory,
  WardrobeColorFamily,
  WardrobeColorTone,
  WardrobeItem,
} from "../types/wardrobe";
import {
  buildOutfitCandidates,
  categoriesCanReplace,
  generateWardrobeWeek,
  regenerateWardrobeDay,
  scoreColorPair,
} from "./wardrobeMatching";

function item(
  id: string,
  category: WardrobeCategory,
  colorFamily: WardrobeColorFamily,
  colorHex: string,
  colorTone: WardrobeColorTone,
): WardrobeItem {
  return {
    id,
    category,
    colorFamily,
    colorHex,
    colorTone,
    name: id,
    imageKey: `${id}.png`,
    imageUrl: `https://example.com/${id}.png`,
    favorite: false,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  };
}

const wardrobe = [
  item("white-shirt", "shirt", "white", "#f7f5ef", "light"),
  item("blue-top", "top", "blue", "#224f9f", "dark"),
  item("black-trousers", "trousers", "black", "#151515", "dark"),
  item("beige-skirt", "skirt", "beige", "#dec49f", "light"),
  item("navy-jacket", "blazer-jacket", "blue", "#172c55", "dark"),
  item("red-dress", "dress", "red", "#aa2530", "dark"),
];

describe("wardrobe matching", () => {
  it("rewards neutral pairs and light-dark contrast", () => {
    const score = scoreColorPair(wardrobe[0], wardrobe[2]);
    expect(score).toBeGreaterThan(3.5);
  });

  it("keeps dresses alone and builds upper/lower outfits", () => {
    const candidates = buildOutfitCandidates(wardrobe);
    const dressCandidate = candidates.find((candidate) =>
      candidate.itemIds.includes("red-dress"),
    );

    expect(dressCandidate?.itemIds).toEqual(["red-dress"]);
    expect(
      candidates.some(
        (candidate) =>
          candidate.itemIds.includes("white-shirt") &&
          candidate.itemIds.includes("black-trousers"),
      ),
    ).toBe(true);
  });

  it("generates seven dated outfits and reduces consecutive reuse", () => {
    const plan = generateWardrobeWeek({
      items: wardrobe,
      weekStart: "2026-09-07",
    });

    expect(plan.days).toHaveLength(7);
    expect(plan.days[0].date).toBe("2026-09-07");
    expect(plan.days[6].date).toBe("2026-09-13");
    expect(plan.days.every((day) => day.itemIds.length > 0)).toBe(true);
    expect(plan.days[0].itemIds).not.toEqual(plan.days[1].itemIds);
  });

  it("preserves a day containing locked items during regeneration", () => {
    const currentPlan = generateWardrobeWeek({
      items: wardrobe,
      weekStart: "2026-09-07",
    });
    currentPlan.days[2] = {
      ...currentPlan.days[2],
      itemIds: ["red-dress"],
      lockedItemIds: ["red-dress"],
      favorite: true,
    };

    const regenerated = generateWardrobeWeek({
      currentPlan,
      items: wardrobe.slice().reverse(),
      weekStart: "2026-09-07",
    });

    expect(regenerated.days[2]).toMatchObject({
      itemIds: ["red-dress"],
      lockedItemIds: ["red-dress"],
      favorite: true,
    });
  });

  it("keeps a locked piece while allowing its outfit to be remixed", () => {
    const currentPlan = generateWardrobeWeek({
      items: wardrobe,
      weekStart: "2026-09-07",
    });
    currentPlan.days[0] = {
      ...currentPlan.days[0],
      itemIds: ["white-shirt", "black-trousers"],
      lockedItemIds: ["white-shirt"],
    };

    const regenerated = generateWardrobeWeek({
      currentPlan,
      items: wardrobe,
      weekStart: "2026-09-07",
    });

    expect(regenerated.days[0].itemIds).toContain("white-shirt");
  });

  it("regenerates one day without changing its neighbors", () => {
    const plan = generateWardrobeWeek({
      items: wardrobe,
      weekStart: "2026-09-07",
    });
    const next = regenerateWardrobeDay({
      date: plan.days[3].date,
      items: wardrobe,
      plan,
    });

    expect(next.days[0]).toEqual(plan.days[0]);
    expect(next.days[6]).toEqual(plan.days[6]);
    expect(next.generation).toBe(plan.generation + 1);
  });

  it("allows tops and shirts to replace each other only", () => {
    expect(categoriesCanReplace("top", "shirt")).toBe(true);
    expect(categoriesCanReplace("trousers", "skirt")).toBe(true);
    expect(categoriesCanReplace("shirt", "trousers")).toBe(false);
    expect(categoriesCanReplace("skirt", "skirt")).toBe(true);
  });
});
