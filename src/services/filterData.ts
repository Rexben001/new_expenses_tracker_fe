import { parseISO, getDate, getMonth, getYear, subMonths, getDaysInMonth, setDate } from "date-fns";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { getDefaultBudgetMonthYear } from "./formatDate";

export function filterByDate(
  items: (Expense | Budget)[],
  months: string[], // e.g. ["7","8"]
  year: string, // e.g. "2025"
  budgetStartDay: number = 1,
  options?: { includeUpcoming?: boolean }
) {
  const { month: defMonth, year: defYear } =
    getDefaultBudgetMonthYear(budgetStartDay);

  const selectedMonths = (months?.length ? months : [defMonth]).map((m) =>
    Number(m)
  );
  const selectedYearNum = Number(year || defYear);
  const monthSet = new Set(selectedMonths);

  const includeUpcoming = options?.includeUpcoming ?? true;

  return Array.from(
    new Map(
      items
        .filter((item) => {
          if (!includeUpcoming && item?.upcoming) return false;
          if (!item?.updatedAt) return false;

          const d = parseISO(item.updatedAt);
          if (isNaN(d as any)) return false;

          const day = getDate(d);

          // Decide which month the period starts in (same or previous)
          const base = day >= budgetStartDay ? d : subMonths(d, 1);

          // Clamp the start day to that month's max days (handles 28/29/30/31)
          const maxDay = getDaysInMonth(base);
          const anchor = setDate(base, Math.min(budgetStartDay, maxDay));

          const anchorMonth = getMonth(anchor) + 1; // 1..12
          const anchorYear = getYear(anchor);

          return anchorYear === selectedYearNum && monthSet.has(anchorMonth);
        })
        // de‑dupe by id if needed
        .map((it) => [it.id, it] as const)
    ).values()
  );
}
