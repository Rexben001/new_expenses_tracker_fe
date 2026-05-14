import Fuse from "fuse.js";
import { useMemo } from "react";
import type { Task } from "../types/tasks";

export function useTaskSearch(query: string, tasks: Task[]) {
  const fuse = useMemo(() => {
    return new Fuse(tasks, {
      keys: ["title", "description", "group", "tags"],
      threshold: 0.3,
    });
  }, [tasks]);

  const results = useMemo(() => {
    if (!query.trim()) return tasks;
    return fuse.search(query).map((r) => r.item);
  }, [query, tasks, fuse]);

  return results;
}
