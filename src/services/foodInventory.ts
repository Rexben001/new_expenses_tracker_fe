import type { FoodItem } from "../types/food";

export type FoodStatus =
  | "available"
  | "low"
  | "out"
  | "expiring"
  | "expired"
  | "stale";

export function daysUntilExpiry(date: string, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(`${date}T00:00:00`);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}

export function daysSinceDate(date: string, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return undefined;
  return Math.floor((today.getTime() - value.getTime()) / 86_400_000);
}

export function isFreshnessFlagged(item: FoodItem, now = new Date()) {
  const referenceDate =
    item.category === "fruit" || item.category === "vegetable"
      ? item.boughtDate
      : item.category === "soup" || item.category === "cooked"
        ? item.cookedDate
        : undefined;
  if (!referenceDate) return false;
  return (daysSinceDate(referenceDate, now) ?? 0) > 3;
}

export function getFoodStatus(item: FoodItem, now = new Date()): FoodStatus {
  if (item.expiryDate) {
    const days = daysUntilExpiry(item.expiryDate, now);
    if (days < 0) return "expired";
  }
  if (isFreshnessFlagged(item, now)) return "stale";
  if (item.expiryDate && daysUntilExpiry(item.expiryDate, now) <= 7) {
    return "expiring";
  }
  if (item.quantity <= 0) return "out";
  if (item.quantity <= item.minimumQuantity) return "low";
  return "available";
}

export function needsRestock(item: FoodItem) {
  if (item.category === "soup" || item.category === "cooked") {
    return item.buy;
  }
  return item.buy || item.quantity <= item.minimumQuantity;
}

export function getFoodItemIcon(item: Pick<FoodItem, "category" | "name">) {
  const name = item.name.toLowerCase();
  const namedIcons: Array<[string[], string]> = [
    [["rice"], "🍚"],
    [["soup", "stew"], "🍲"],
    [["pasta", "spaghetti"], "🍝"],
    [["curry"], "🍛"],
    [["apple"], "🍎"],
    [["banana"], "🍌"],
    [["orange"], "🍊"],
    [["grape"], "🍇"],
    [["strawberr"], "🍓"],
    [["avocado"], "🥑"],
    [["broccoli"], "🥦"],
    [["carrot"], "🥕"],
    [["potato"], "🥔"],
    [["tomato"], "🍅"],
    [["pepper"], "🌶️"],
    [["lettuce", "spinach", "salad"], "🥬"],
    [["mushroom"], "🍄"],
    [["onion", "garlic"], "🧅"],
    [["bread"], "🍞"],
    [["milk"], "🥛"],
    [["cheese"], "🧀"],
    [["egg"], "🥚"],
    [["chicken"], "🍗"],
    [["fish", "salmon", "cod"], "🐟"],
  ];
  const match = namedIcons.find(([terms]) =>
    terms.some((term) => name.includes(term))
  );
  if (match) return match[1];

  return {
    cooked: "🍽️",
    drink: "🥤",
    food: "🍽️",
    fruit: "🍎",
    ingredient: "🥣",
    other: "📦",
    soup: "🍲",
    spice: "🧂",
    vegetable: "🥦",
  }[item.category];
}
