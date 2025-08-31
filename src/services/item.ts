import { parseISO, isSameYear, isWithinInterval, addMonths } from "date-fns";
import type { Expense } from "../types/expenses";
import type { Budget } from "../types/budgets";

export function getMonthlyTotal<T extends (Expense | Budget)[]>(
  items: T,
  budgetStartDay: number = 1
): number {
  const now = new Date();

  // Determine the start of the current budget period
  let start: Date;
  if (now.getDate() >= budgetStartDay) {
    // If today is ON or AFTER the budget start day, start this month
    start = new Date(
      now.getFullYear(),
      now.getMonth(),
      budgetStartDay,
      0,
      0,
      0
    );
  } else {
    // Otherwise, start last month
    start = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      budgetStartDay,
      0,
      0,
      0
    );
  }

  // End is one month after the start
  const end = addMonths(start, 1);

  return items.reduce((sum, item) => {
    if (item.upcoming) return sum; // ⬅️ Skip upcoming
    const date = parseISO(item.updatedAt);
    const isInPeriod = isWithinInterval(date, { start, end });
    return isInPeriod ? sum + item.amount : sum;
  }, 0);
}

export function getYearlyTotally<T extends (Expense | Budget)[]>(
  items: T
): number {
  const now = new Date();
  return items.reduce((sum, item) => {
    if (item.upcoming) return sum; // ⬅️ Skip upcoming
    const date = parseISO(item.updatedAt);
    return isSameYear(date, now) ? sum + item.amount : sum;
  }, 0);
}

export function getTotal<T extends (Expense | Budget)[]>(
  items: T,
  removeUpcoming = true
): number {
  return items.reduce((sum, item) => {
    if (removeUpcoming && item.upcoming) return sum; // ⬅️ Skip upcoming
    return sum + item.amount;
  }, 0);
}

export const calculateRemaining = (amount: number, expenses: Expense[]) => {
  const budgetAmount = amount;

  const totalExpenses = expenses.reduce((sum, expense) => {
    if (expense.upcoming) return sum; // ⬅️ Skip upcoming
    return sum + expense.amount;
  }, 0);

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
