import { parseISO, getDate, getMonth, getYear, subMonths } from "date-fns";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { getDefaultBudgetMonthYear } from "./formatDate";

export function filterByDate(
  items: (Expense | Budget)[],
  months: string[], // e.g. ["7","8"]
  year: string, // e.g. "2025"
  budgetStartDay: number = 1,
  options?: { includeUpcoming?: boolean } // optional toggle
) {
  // Default month/year when not provided
  const selected = months?.length
    ? months
    : [getDefaultBudgetMonthYear(budgetStartDay).month];
  const selectedYear = year || getDefaultBudgetMonthYear(budgetStartDay).year;
  const selectedYearNum = Number(selectedYear);

  // Normalize selected months to numbers 1..12
  const monthSet = new Set(selected.map((m) => Number(m)));

  const includeUpcoming = options?.includeUpcoming ?? true;

  const results = items.filter((item) => {
    // Skip upcoming if requested
    if (!includeUpcoming && item?.upcoming) return false;

    if (!item.updatedAt) return false;
    const raw = parseISO(item.updatedAt);

    // Shift back a month if the day is BEFORE the budget start day
    const shifted = getDate(raw) < budgetStartDay ? subMonths(raw, 1) : raw;

    const shiftedMonth = getMonth(shifted) + 1; // 1..12
    const shiftedYear = getYear(shifted);

    return shiftedYear === selectedYearNum && monthSet.has(shiftedMonth);
  });

  // If needed, dedupe by id
  return Array.from(new Map(results.map((it) => [it.id, it])).values());
}
