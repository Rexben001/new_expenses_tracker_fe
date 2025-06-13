import Fuse from "fuse.js";
import { useMemo } from "react";
import { useItemContext } from "./useItemContext";

export function useBudgetSearch(query: string) {
  const { budgets } = useItemContext();

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
