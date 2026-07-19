import { useSwipeable } from "react-swipeable";
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiShoppingCart,
  FiTrash2,
} from "react-icons/fi";
import {
  daysUntilExpiry,
  getFoodStatus,
  needsRestock,
  type FoodStatus,
} from "../services/foodInventory";
import type { FoodItem, FoodLifecycleStatus } from "../types/food";

const statusStyles: Record<FoodStatus, string> = {
  available:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  low: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  out: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
  expiring:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200",
  expired: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
};

function expiryLabel(item: FoodItem) {
  if (!item.expiryDate) return "No expiry date";
  const days = daysUntilExpiry(item.expiryDate);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days}d`;
}

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
  onOutcome(item: FoodItem, outcome: Exclude<FoodLifecycleStatus, "active">): void;
}) {
  const status = getFoodStatus(item);
  const swipeHandlers = useSwipeable({
    delta: 80,
    preventScrollOnSwipe: false,
    trackMouse: false,
    onSwipedLeft: () => onOutcome(item, "finished"),
    onSwipedRight: () => onOutcome(item, "wasted"),
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-gray-200 to-emerald-500 dark:via-gray-800">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 text-xs font-bold text-white">
        <span className="flex items-center gap-1"><FiTrash2 /> Wasted</span>
        <span className="flex items-center gap-1">Finished <FiCheck /></span>
      </div>
      <article
        {...swipeHandlers}
        className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        style={{ touchAction: "pan-y" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">{item.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusStyles[status]}`}>
                {status}
              </span>
              {item.opened && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-200">
                  Opened
                </span>
              )}
            </div>
            <p className="mt-1 text-xs capitalize text-gray-500">{item.category}</p>
          </div>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={`Edit ${item.name}`}
          >
            <FiEdit2 />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-bold">
              {item.quantity}{" "}
              <span className="text-sm font-normal text-gray-500">{item.unit}</span>
            </p>
            <p className={`text-xs ${status === "expired" || status === "expiring" ? "font-medium text-orange-600" : "text-gray-500"}`}>
              {expiryLabel(item)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pending}
              type="button"
              onClick={() => onPatch(item, { quantity: Math.max(0, item.quantity - 1) })}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 text-xl shadow-sm disabled:opacity-50 dark:bg-gray-800"
              aria-label={`Decrease ${item.name}`}
            >
              <FiChevronDown />
            </button>
            <button
              disabled={pending}
              type="button"
              onClick={() => onPatch(item, { quantity: item.quantity + 1 })}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-xl text-white shadow-sm disabled:opacity-50"
              aria-label={`Increase ${item.name}`}
            >
              <FiChevronUp />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            disabled={pending}
            type="button"
            onClick={() => onPatch(item, { quantity: item.quantity === 0.5 ? 1 : 0.5 })}
            className={`rounded-xl border py-2 text-sm font-semibold disabled:opacity-50 ${item.quantity === 0.5 ? "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200" : "border-gray-200 dark:border-gray-700"}`}
          >
            Half
          </button>
          <button
            disabled={pending}
            type="button"
            onClick={() => onPatch(item, { opened: !item.opened })}
            className={`rounded-xl border py-2 text-sm font-semibold disabled:opacity-50 ${item.opened ? "border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200" : "border-gray-200 dark:border-gray-700"}`}
          >
            {item.opened ? "Opened" : "Mark opened"}
          </button>
        </div>

        <button
          disabled={pending}
          type="button"
          onClick={() => onPatch(item, { buy: !item.buy })}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-sm font-medium disabled:opacity-50 ${needsRestock(item) ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"}`}
        >
          {item.buy ? <FiCheck /> : <FiShoppingCart />}
          {item.buy ? "On shopping list" : "Add to shopping list"}
        </button>

        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-gray-100 pt-2 text-xs dark:border-gray-800">
          <button
            disabled={pending}
            type="button"
            onClick={() => onOutcome(item, "finished")}
            className="rounded-lg py-2 font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
          >
            🎉 Finished
          </button>
          <button
            disabled={pending}
            type="button"
            onClick={() => onOutcome(item, "wasted")}
            className="rounded-lg py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            🗑️ Thrown away
          </button>
        </div>
        <p className="mt-1 text-center text-[10px] text-gray-400">
          Swipe left: finished · Swipe right: thrown away
        </p>
      </article>
    </div>
  );
}
