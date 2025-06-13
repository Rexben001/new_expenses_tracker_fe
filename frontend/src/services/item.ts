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

export function sortItemByRecent<T extends Expense[] | Budget[]>(item: T): Array<T[number]> {
  return [...item].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
