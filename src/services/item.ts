import {
  parseISO,
  isSameMonth,
  isSameYear,
  isWithinInterval,
  subDays,
} from "date-fns";
import type { Expense } from "../types/expenses";
import type { Budget } from "../types/budgets";

export function getMonthlyTotal<T extends (Expense | Budget)[]>(
  items: T,
  budgetStartDay: number = 1
): number {
  const now = new Date();
  return items.reduce((sum, item) => {
    const date = parseISO(item.updatedAt);
    const isInPeriod =
      budgetStartDay === 1
        ? isSameMonth(date, now)
        : isWithinInterval(date, {
            start: subDays(now, 30),
            end: now,
          });

    return isInPeriod ? sum + item.amount : sum;
  }, 0);
}

export function getYearlyTotally<T extends (Expense | Budget)[]>(
  items: T
): number {
  const now = new Date();
  return items.reduce((sum, item) => {
    const date = parseISO(item.updatedAt); // Assuming ISO string
    return isSameYear(date, now) ? sum + item.amount : sum;
  }, 0);
}

export function getTotal<T extends (Expense | Budget)[]>(items: T) {
  return items.reduce((sum, item) => {
    return sum + item.amount;
  }, 0);
}

export const calculateRemaining = (amount: number, expenses: Expense[]) => {
  const budgetAmount = amount;

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return budgetAmount - totalExpenses;
};

export const CATEGORY_OPTIONS = [
  "Food",
  "Transport",
  "Shopping",
  "Health",
  "Insurance",
  "Entertainment",
  "Utilities",
  "Toiletries",
  "Holiday",
  "Miscellaneous",
  "Others",
];
