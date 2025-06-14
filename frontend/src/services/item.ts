import { parseISO, isSameMonth } from "date-fns";
import type { Expense } from "../types/expenses";
import type { Budget } from "../types/budgets";

export function getMonthlyTotal<T extends (Expense | Budget)[]>(
  items: T
): number {
  const now = new Date();
  return items.reduce((sum, item) => {
    const date = parseISO(item.updatedAt); // Assuming ISO string
    return isSameMonth(date, now) ? sum + item.amount : sum;
  }, 0);
}

export const CATEGORY_OPTIONS = [
  "Food",
  "Transport",
  "Shopping",
  "Health",
  "Entertainment",
  "Utilities",
  "Holiday",
  "Miscellaneous",
  "Others",
];
