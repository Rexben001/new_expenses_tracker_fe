import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";

export const filterByDate = (
  items: Expense[] | Budget[],
  month: string,
  year: string
) => {
  return items.filter((item) => {
    const date = new Date(item.updatedAt); // Ensure your data has a `date` field
    const matchesMonth = month ? date.getMonth() + 1 === Number(month) : true;
    const matchesYear = year ? date.getFullYear() === Number(year) : true;
    return matchesMonth && matchesYear;
  });
};

