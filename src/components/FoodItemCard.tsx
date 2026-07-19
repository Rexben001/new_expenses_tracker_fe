import { useSwipeable } from "react-swipeable";
import { FiCheckCircle, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import {
  getFoodItemIcon,
  getFoodStatus,
  type FoodStatus,
} from "../services/foodInventory";
import type { FoodItem, FoodLifecycleStatus } from "../types/food";

const statusStyles: Partial<Record<FoodStatus, string>> = {
  expired: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
  expiring:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200",
  low: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  out: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
  stale: "bg-red-600 text-white dark:bg-red-700",
};

const statusLabels: Partial<Record<FoodStatus, string>> = {
  expired: "Expired",
  expiring: "Expiring",
  low: "Low",
  out: "Out",
  stale: "Use now",
};

export function FoodItemCard({
  item,
  pending,
  onEdit,
  onPatch,
  onOutcome,
}: {
  item: FoodItem;
  pending: boolean;
  onEdit(item: FoodItem): void;
  onPatch(item: FoodItem, values: Partial<FoodItem>): void;
  onOutcome(
    item: FoodItem,
    outcome: Exclude<FoodLifecycleStatus, "active">
  ): void;
}) {
  const status = getFoodStatus(item);
  const statusLabel = statusLabels[status];
  const swipeHandlers = useSwipeable({
    delta: 80,
    preventScrollOnSwipe: false,
    trackMouse: false,
    onSwipedLeft: () => onOutcome(item, "finished"),
    onSwipedRight: () => onOutcome(item, "wasted"),
  });

  return (
    <article
      {...swipeHandlers}
      className="rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      style={{ touchAction: "pan-y" }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`Edit ${item.name}`}
        >
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gray-100 text-2xl dark:bg-gray-800"
            aria-hidden="true"
          >
            {getFoodItemIcon(item)}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="truncate font-semibold">{item.name}</span>
              {statusLabel && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyles[status]}`}
                >
                  {statusLabel}
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-xs capitalize text-gray-500">
              {item.category}
              {item.opened ? " · Opened" : ""}
            </span>
          </span>
        </button>

        <span className="shrink-0 rounded-xl bg-gray-100 px-3 py-2 text-center dark:bg-gray-800">
          <span className="block text-lg font-bold leading-none">{item.quantity}</span>
          <span className="mt-1 block max-w-16 truncate text-[10px] text-gray-500">
            {item.unit}
          </span>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <button
          disabled={pending}
          type="button"
          title="Finished"
          onClick={() => onOutcome(item, "finished")}
          className="grid h-10 place-items-center rounded-xl text-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
          aria-label={`Mark ${item.name} finished`}
        >
          <FiCheckCircle />
        </button>
        <button
          disabled={pending}
          type="button"
          title={item.buy ? "Remove from shopping list" : "Add to shopping list"}
          onClick={() => onPatch(item, { buy: !item.buy })}
          className={`grid h-10 place-items-center rounded-xl text-lg disabled:opacity-50 ${item.buy ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200" : "text-gray-500 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"}`}
          aria-label={
            item.buy
              ? `Remove ${item.name} from shopping list`
              : `Add ${item.name} to shopping list`
          }
        >
          <FiShoppingCart />
        </button>
        <button
          disabled={pending}
          type="button"
          title="Thrown away"
          onClick={() => onOutcome(item, "wasted")}
          className="grid h-10 place-items-center rounded-xl text-lg text-red-500 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/30"
          aria-label={`Mark ${item.name} thrown away`}
        >
          <FiTrash2 />
        </button>
      </div>
    </article>
  );
}
