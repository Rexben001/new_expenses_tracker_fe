import { useMemo, useState } from "react";
import { FiSend } from "react-icons/fi";
import {
  findFoodPredictions,
  standardizeFoodLocation,
  quickFoodInput,
} from "../services/foodPredictions";
import type { FoodItemInput } from "../types/food";

export function FoodQuickAdd({
  disabled,
  onAdd,
}: {
  disabled?: boolean;
  onAdd(input: FoodItemInput): Promise<boolean>;
}) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const predictions = useMemo(() => findFoodPredictions(query, 3), [query]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim() || pending) return;
    setPending(true);
    const added = await onAdd(quickFoodInput(query));
    if (added) setQuery("");
    setPending(false);
  };

  return (
    <div
      className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-[160] mx-auto w-full max-w-md px-3"
      aria-label="Quick add food"
    >
      {query.trim() && predictions.length > 0 && (
        <div className="mb-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {predictions.map((prediction) => (
            <button
              key={prediction.name}
              type="button"
              onClick={() => setQuery(prediction.name)}
              className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-2.5 text-left text-sm last:border-0 hover:bg-emerald-50 dark:border-gray-800 dark:hover:bg-emerald-950/30"
            >
              <span className="font-medium">{prediction.name}</span>
              <span className="text-xs text-gray-500">
                {standardizeFoodLocation(prediction.location)} · {prediction.shelfLifeDays}d
              </span>
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Quick add food..."
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base outline-none"
          aria-label="Quick add food item"
        />
        <button
          disabled={disabled || pending || !query.trim()}
          type="submit"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white disabled:opacity-50"
          aria-label="Add food item"
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}
