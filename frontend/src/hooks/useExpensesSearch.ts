import Fuse from "fuse.js";
import { useMemo } from "react";
import { useItemContext } from "./useItemContext";
import type { Expense } from "../types/expenses";

export function useExpenseSearch(query: string, otherExpenses?: Expense[]) {
  const { expenses } = useItemContext();

  const _expenses = otherExpenses || expenses;

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
