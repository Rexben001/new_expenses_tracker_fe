import { describe, expect, test } from "vitest";
import {
  findFoodPredictions,
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
        expiryDate: "2026-07-26",
        location: "Pantry",
        unit: "packs",
      })
    );
  });

  test("quick-add keeps unknown names with safe defaults", () => {
    expect(quickFoodInput("Plantain", new Date(2026, 6, 19))).toEqual(
      expect.objectContaining({
        name: "Plantain",
        expiryDate: "2026-07-26",
        location: "Pantry",
        unit: "packs",
      })
    );
  });

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
        unit: "servings",
      })
    );
  });
});
