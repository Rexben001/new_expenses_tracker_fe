import type { FoodItem } from "../types/food";

export type FoodStatus = "available" | "low" | "out" | "expiring" | "expired";

export function daysUntilExpiry(date: string, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(`${date}T00:00:00`);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}

export function getFoodStatus(item: FoodItem, now = new Date()): FoodStatus {
  if (item.expiryDate) {
    const days = daysUntilExpiry(item.expiryDate, now);
    if (days < 0) return "expired";
    if (days <= 7) return "expiring";
  }
  if (item.quantity <= 0) return "out";
  if (item.quantity <= item.minimumQuantity) return "low";
  return "available";
}

export function needsRestock(item: FoodItem) {
  return item.buy || item.quantity <= item.minimumQuantity;
}
