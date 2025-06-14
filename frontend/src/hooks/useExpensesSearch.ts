import Fuse from "fuse.js";
import { useMemo } from "react";
import { useItemContext } from "./useItemContext";
import type { Expense } from "../types/expenses";
import { filterByDate } from "../services/filterData";

export function useExpenseSearch(query: string, otherExpenses: Expense[]) {
  const _expenses = otherExpenses;

  const fuse = useMemo(() => {
    return new Fuse(_expenses, {
      keys: ["title", "category"], // searchable fields
      threshold: 0.3, // lower = stricter matching
    });
  }, [_expenses]);

  const results = useMemo(() => {
    if (!query.trim()) return _expenses;
    return fuse.search(query).map((r) => r.item);
  }, [query, _expenses, fuse]);

  return results;
}

export function useExpenseFilter(
  month: string,
  year: string,
  otherExpenses?: Expense[]
) {
  const { expenses } = useItemContext();

  const _expenses = otherExpenses ?? expenses;

  const results = useMemo(() => {
    return filterByDate(_expenses, month, year);
  }, [_expenses, month, year]);

  return results as Expense[];
}
