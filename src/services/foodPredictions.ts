import type { FoodCategory, FoodItemInput } from "../types/food";

export type FoodPrediction = {
  name: string;
  aliases?: string[];
  category: FoodCategory;
  shelfLifeDays: number;
  location: string;
  unit: string;
  minimumQuantity: number;
  freezable?: boolean;
  freezeExtensionDays?: number;
  estimatedValue?: number;
  estimatedWeightKg?: number;
};

export const FOOD_LOCATIONS = ["Pantry", "Fridge", "Freezer"] as const;
export const FOOD_UNITS = ["kg", "liters", "packs", "servings"] as const;

export function standardizeFoodLocation(location: string) {
  if (location.toLowerCase().includes("fridge") || location.toLowerCase().includes("drawer")) {
    return "Fridge";
  }
  if (location.toLowerCase().includes("freezer")) return "Freezer";
  return "Pantry";
}

export function standardizeFoodUnit(unit: string) {
  if (unit === "kg") return "kg";
  if (unit === "servings") return "servings";
  if (["bottles", "cartons", "liters"].includes(unit)) return "liters";
  return "packs";
}

export const FOOD_PREDICTIONS: FoodPrediction[] = [
  { name: "Apples", aliases: ["apple"], category: "food", shelfLifeDays: 7, location: "Pantry", unit: "items", minimumQuantity: 2, estimatedValue: 3, estimatedWeightKg: 0.8 },
  { name: "Avocados", aliases: ["avocado"], category: "food", shelfLifeDays: 4, location: "Crisper Drawer", unit: "items", minimumQuantity: 1, estimatedValue: 4, estimatedWeightKg: 0.5 },
  { name: "Bananas", aliases: ["banana"], category: "food", shelfLifeDays: 5, location: "Counter", unit: "items", minimumQuantity: 2, estimatedValue: 2.5, estimatedWeightKg: 1 },
  { name: "Bread", category: "food", shelfLifeDays: 6, location: "Pantry", unit: "loaves", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 3, estimatedWeightKg: 0.5 },
  { name: "Broccoli", category: "food", shelfLifeDays: 5, location: "Crisper Drawer", unit: "heads", minimumQuantity: 1, freezable: true, freezeExtensionDays: 240, estimatedValue: 3, estimatedWeightKg: 0.4 },
  { name: "Butter", category: "ingredient", shelfLifeDays: 30, location: "Fridge Door", unit: "packs", minimumQuantity: 1, freezable: true, freezeExtensionDays: 270, estimatedValue: 4, estimatedWeightKg: 0.25 },
  { name: "Carrots", aliases: ["carrot"], category: "food", shelfLifeDays: 21, location: "Crisper Drawer", unit: "bags", minimumQuantity: 1, freezable: true, freezeExtensionDays: 300, estimatedValue: 2, estimatedWeightKg: 1 },
  { name: "Cheese", category: "food", shelfLifeDays: 14, location: "Top Shelf Fridge", unit: "packs", minimumQuantity: 1, freezable: true, freezeExtensionDays: 180, estimatedValue: 5, estimatedWeightKg: 0.3 },
  { name: "Chicken Breast", aliases: ["chicken"], category: "food", shelfLifeDays: 2, location: "Bottom Shelf Fridge", unit: "packs", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 8, estimatedWeightKg: 0.6 },
  { name: "Cream", category: "ingredient", shelfLifeDays: 5, location: "Top Shelf Fridge", unit: "cartons", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 3, estimatedWeightKg: 0.25 },
  { name: "Eggs", aliases: ["egg"], category: "food", shelfLifeDays: 21, location: "Top Shelf Fridge", unit: "items", minimumQuantity: 4, estimatedValue: 4, estimatedWeightKg: 0.6 },
  { name: "Fish", aliases: ["salmon", "cod"], category: "food", shelfLifeDays: 2, location: "Bottom Shelf Fridge", unit: "packs", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 10, estimatedWeightKg: 0.5 },
  { name: "Garlic", category: "ingredient", shelfLifeDays: 30, location: "Pantry", unit: "bulbs", minimumQuantity: 1, estimatedValue: 1.5, estimatedWeightKg: 0.15 },
  { name: "Ginger", category: "ingredient", shelfLifeDays: 14, location: "Crisper Drawer", unit: "pieces", minimumQuantity: 1, freezable: true, freezeExtensionDays: 150, estimatedValue: 2, estimatedWeightKg: 0.2 },
  { name: "Ground Beef", aliases: ["mince", "minced beef"], category: "food", shelfLifeDays: 2, location: "Bottom Shelf Fridge", unit: "packs", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 7, estimatedWeightKg: 0.5 },
  { name: "Lettuce", category: "food", shelfLifeDays: 5, location: "Crisper Drawer", unit: "heads", minimumQuantity: 1, estimatedValue: 2, estimatedWeightKg: 0.4 },
  { name: "Milk", category: "drink", shelfLifeDays: 7, location: "Fridge Door", unit: "cartons", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 2, estimatedWeightKg: 1 },
  { name: "Mushrooms", aliases: ["mushroom"], category: "food", shelfLifeDays: 5, location: "Crisper Drawer", unit: "packs", minimumQuantity: 1, freezable: true, freezeExtensionDays: 240, estimatedValue: 3, estimatedWeightKg: 0.3 },
  { name: "Onions", aliases: ["onion"], category: "ingredient", shelfLifeDays: 30, location: "Pantry", unit: "items", minimumQuantity: 2, estimatedValue: 2, estimatedWeightKg: 0.7 },
  { name: "Orange Juice", aliases: ["juice"], category: "drink", shelfLifeDays: 7, location: "Fridge Door", unit: "bottles", minimumQuantity: 1, estimatedValue: 3, estimatedWeightKg: 1 },
  { name: "Potatoes", aliases: ["potato"], category: "food", shelfLifeDays: 21, location: "Pantry", unit: "bags", minimumQuantity: 1, estimatedValue: 3, estimatedWeightKg: 1.5 },
  { name: "Rice", category: "ingredient", shelfLifeDays: 365, location: "Pantry", unit: "kg", minimumQuantity: 1, estimatedValue: 3, estimatedWeightKg: 1 },
  { name: "Spinach", category: "food", shelfLifeDays: 4, location: "Crisper Drawer", unit: "bags", minimumQuantity: 1, freezable: true, freezeExtensionDays: 180, estimatedValue: 3, estimatedWeightKg: 0.25 },
  { name: "Tomatoes", aliases: ["tomato"], category: "food", shelfLifeDays: 6, location: "Counter", unit: "items", minimumQuantity: 2, freezable: true, freezeExtensionDays: 180, estimatedValue: 3, estimatedWeightKg: 0.6 },
  { name: "Yogurt", aliases: ["yoghurt"], category: "food", shelfLifeDays: 10, location: "Top Shelf Fridge", unit: "pots", minimumQuantity: 2, freezable: true, freezeExtensionDays: 60, estimatedValue: 3, estimatedWeightKg: 0.5 },
  { name: "Chicken Soup", category: "soup", shelfLifeDays: 3, location: "Fridge", unit: "servings", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 7, estimatedWeightKg: 1 },
  { name: "Tomato Soup", category: "soup", shelfLifeDays: 4, location: "Fridge", unit: "servings", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 5, estimatedWeightKg: 1 },
  { name: "Vegetable Soup", category: "soup", shelfLifeDays: 4, location: "Fridge", unit: "servings", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 5, estimatedWeightKg: 1 },
  { name: "Cooked Rice", aliases: ["leftover rice"], category: "cooked", shelfLifeDays: 4, location: "Fridge", unit: "servings", minimumQuantity: 1, freezable: true, freezeExtensionDays: 30, estimatedValue: 3, estimatedWeightKg: 0.5 },
  { name: "Cooked Pasta", aliases: ["leftover pasta"], category: "cooked", shelfLifeDays: 4, location: "Fridge", unit: "servings", minimumQuantity: 1, freezable: true, freezeExtensionDays: 60, estimatedValue: 4, estimatedWeightKg: 0.6 },
  { name: "Curry", category: "cooked", shelfLifeDays: 4, location: "Fridge", unit: "servings", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 7, estimatedWeightKg: 0.8 },
  { name: "Stew", category: "cooked", shelfLifeDays: 4, location: "Fridge", unit: "servings", minimumQuantity: 1, freezable: true, freezeExtensionDays: 90, estimatedValue: 7, estimatedWeightKg: 1 },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function findFoodPredictions(query: string, limit = 5) {
  const value = normalize(query);
  if (!value) return [];

  return FOOD_PREDICTIONS
    .map((prediction) => {
      const terms = [prediction.name, ...(prediction.aliases ?? [])].map(normalize);
      const exact = terms.some((term) => term === value);
      const prefix = terms.some((term) => term.startsWith(value));
      const contains = terms.some((term) => term.includes(value));
      return { prediction, rank: exact ? 0 : prefix ? 1 : contains ? 2 : 3 };
    })
    .filter(({ rank }) => rank < 3)
    .sort((a, b) => a.rank - b.rank || a.prediction.name.localeCompare(b.prediction.name))
    .slice(0, limit)
    .map(({ prediction }) => prediction);
}

export function toDateInputAfterDays(days: number, now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function predictionToFoodInput(
  prediction: FoodPrediction,
  now = new Date()
): FoodItemInput {
  return {
    name: prediction.name,
    category: prediction.category,
    quantity: 1,
    unit: standardizeFoodUnit(prediction.unit),
    minimumQuantity: prediction.minimumQuantity,
    expiryDate: toDateInputAfterDays(prediction.shelfLifeDays, now),
    cookedDate:
      prediction.category === "soup" || prediction.category === "cooked"
        ? toDateInputAfterDays(0, now)
        : undefined,
    location: standardizeFoodLocation(prediction.location),
    notes: "",
    buy: false,
    opened: false,
    freezable: prediction.freezable ?? false,
    freezeExtensionDays: prediction.freezeExtensionDays,
    estimatedValue: prediction.estimatedValue,
    estimatedWeightKg: prediction.estimatedWeightKg,
  };
}

export function quickFoodInput(query: string, now = new Date()) {
  const prediction = findFoodPredictions(query, 1)[0];
  if (prediction) return predictionToFoodInput(prediction, now);

  return {
    name: query.trim(),
    category: "food" as const,
    quantity: 1,
    unit: "packs",
    minimumQuantity: 1,
    expiryDate: toDateInputAfterDays(7, now),
    cookedDate: undefined,
    location: "Pantry",
    notes: "",
    buy: false,
    opened: false,
    freezable: false,
  };
}
