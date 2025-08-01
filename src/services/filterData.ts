import { parseISO, isWithinInterval, addMonths } from "date-fns";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";

export const filterByDate = (
  items: Expense[] | Budget[],
  months: string[],
  year: string,
  budgetStartDay: number = 1
) => {
  const selectedYear = year ? Number(year) : new Date().getFullYear();
  if (!months?.length) return items;

  const results = months.flatMap((monthStr) => {
    const selectedMonth = Number(monthStr);
    if (!selectedMonth || selectedMonth < 1 || selectedMonth > 12) return [];

    let start: Date;
    if (budgetStartDay === 1) {
      // Normal calendar month
      start = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    } else {
      // Budget period for "August" actually starts on July 26
      start = new Date(
        selectedYear,
        selectedMonth - 2,
        budgetStartDay,
        0,
        0,
        0,
        0
      );
    }

    const end = addMonths(start, 1);

    return items.filter((item) => {
      const date = parseISO(item.updatedAt);
      return isWithinInterval(date, { start, end });
    });
  });

  return Array.from(new Map(results.map((item) => [item.id, item])).values());
};
