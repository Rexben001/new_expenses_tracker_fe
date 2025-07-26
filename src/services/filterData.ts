import { parseISO, isWithinInterval } from "date-fns";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";

export const filterByDate = (
  items: Expense[] | Budget[],
  month: string,
  year: string,
  budgetStartDay: number = 1
) => {
  const selectedMonth = Number(month);
  const selectedYear = Number(year);

  if (!selectedMonth || !selectedYear) return items;

  const start = new Date(
    selectedYear,
    selectedMonth - 1,
    budgetStartDay,
    0,
    0,
    0,
    0
  );
  const end = new Date(selectedYear, selectedMonth, budgetStartDay, 0, 0, 0, 0);

  return items.filter((item) => {
    const date = parseISO(item.updatedAt);
    return isWithinInterval(date, { start, end });
  });
};
