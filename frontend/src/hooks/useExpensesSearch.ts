import Fuse from "fuse.js";
import { useMemo } from "react";
import { useItemContext } from "./useItemContext";

export function useExpenseSearch(query: string) {
  const { expenses } = useItemContext();

  const fuse = useMemo(() => {
    return new Fuse(expenses, {
      keys: ["title", "category"], // searchable fields
      threshold: 0.3, // lower = stricter matching
    });
  }, [expenses]);

  const results = useMemo(() => {
    if (!query.trim()) return expenses;
    return fuse.search(query).map((r) => r.item);
  }, [query, expenses, fuse]);

  return results;
}
