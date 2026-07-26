import { describe, expect, test } from "vitest";
import {
  findFoodPredictions,
  hasDefaultFoodExpiry,
  predictionToFoodInput,
  quickFoodInput,
} from "./foodPredictions";

describe("food predictions", () => {
  test("predicts apples from a short prefix", () => {
    expect(findFoodPredictions("ap")[0]?.name).toBe("Apples");
  });

  test("fills shelf life and storage defaults", () => {
    const apple = findFoodPredictions("apple")[0];
    const input = predictionToFoodInput(apple, new Date(2026, 6, 19));

    expect(input).toEqual(
      expect.objectContaining({
        name: "Apples",
        boughtDate: "2026-07-19",
        category: "fruit",
        expiryDate: "2026-07-26",
        location: "Pantry",
        unit: "packs",
      })
    );
  });

  test("quick-add keeps unknown food without a default expiry", () => {
    expect(quickFoodInput("Plantain", new Date(2026, 6, 19))).toEqual(
      expect.objectContaining({
        name: "Plantain",
        expiryDate: undefined,
        location: "Pantry",
        preparationState: "raw",
        unit: "packs",
      })
    );
  });

  test.each(["food", "ingredient"] as const)(
    "does not autofill expiry for %s predictions",
    (category) => {
      const prediction = findFoodPredictions(category === "food" ? "bread" : "rice")[0];
      expect(prediction.category).toBe(category);
      expect(predictionToFoodInput(prediction, new Date(2026, 6, 19)).expiryDate).toBeUndefined();
    }
  );

  test.each(["food", "spice", "ingredient", "other"])(
    "%s has no default expiry",
    (category) => {
      expect(hasDefaultFoodExpiry(category)).toBe(false);
    }
  );

  test("standardizes fridge locations and liquid units", () => {
    const milk = quickFoodInput("milk", new Date(2026, 6, 19));
    expect(milk).toEqual(
      expect.objectContaining({ location: "Fridge", unit: "liters" })
    );
  });

  test("autofills servings and cooked date for soups", () => {
    const soup = quickFoodInput("tomato soup", new Date(2026, 6, 19));
    expect(soup).toEqual(
      expect.objectContaining({
        category: "soup",
        cookedDate: "2026-07-19",
        expiryDate: "2026-07-23",
        location: "Fridge",
        preparationState: "cooked",
        unit: "servings",
      })
    );
  });

  test("autofills purchase dates for vegetables", () => {
    const broccoli = quickFoodInput("broccoli", new Date(2026, 6, 20));
    expect(broccoli).toEqual(
      expect.objectContaining({
        boughtDate: "2026-07-20",
        category: "vegetable",
      })
    );
  });
});
