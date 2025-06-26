import Fuse from "fuse.js";
import { useMemo } from "react";
import { useItemContext } from "./useItemContext";
import { filterByDate } from "../services/filterData";
import type { Budget } from "../types/budgets";

export function useBudgetSearch(query: string, budgets: Budget[]) {
  const fuse = useMemo(() => {
    return new Fuse(budgets, {
      keys: ["title", "category"], // searchable fields
      threshold: 0.3, // lower = stricter matching
    });
  }, [budgets]);

  const results = useMemo(() => {
    if (!query.trim()) return budgets;
    return fuse.search(query).map((r) => r.item);
  }, [query, budgets, fuse]);

  return results;
}

export function useBudgetFilter(month: string, year: string) {
  const { budgets } = useItemContext();

  const results = useMemo(() => {
    return filterByDate(budgets, month, year);
  }, [budgets, month, year]);

  return results as Budget[];
}
