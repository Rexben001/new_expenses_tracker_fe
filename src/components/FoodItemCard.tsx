import { useSwipeable } from "react-swipeable";
import {
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiTrash2,
} from "react-icons/fi";
import {
  getFoodPreparationState,
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
  const preparationState = getFoodPreparationState(item);
  const quantityStep = item.unit === "kg" || item.unit === "liters" ? 0.5 : 1;
  const updateQuantity = (amount: number) => {
    const quantity = Math.max(
      0,
      Math.round((item.quantity + amount) * 100) / 100
    );
    onPatch(item, { quantity });
  };
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
      className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      style={{ touchAction: "pan-y" }}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-label={`Edit ${item.name}`}
        >
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-100 text-lg dark:bg-gray-800"
            aria-hidden="true"
          >
            {getFoodItemIcon(item)}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1">
              <span className="truncate text-sm font-semibold">{item.name}</span>
              {statusLabel && (
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none ${statusStyles[status]}`}
                >
                  {statusLabel}
                </span>
              )}
              {item.hidden && (
                <span className="shrink-0 rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                  Hidden
                </span>
              )}
            </span>
            <span className="block text-[9px] leading-none text-gray-500">
              <span
                className={
                  preparationState === "cooked"
                    ? "font-semibold text-orange-600 dark:text-orange-300"
                    : "font-semibold text-emerald-600 dark:text-emerald-300"
                }
              >
                {preparationState === "cooked" ? "Cooked" : "Raw"}
              </span>
              {item.opened ? " · Opened" : ""}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          <button
            disabled={pending || item.quantity <= 0}
            type="button"
            onClick={() => updateQuantity(-quantityStep)}
            className="grid h-7 w-7 place-items-center rounded-md bg-white text-xs text-gray-600 shadow-sm disabled:opacity-40 dark:bg-gray-900 dark:text-gray-300"
            aria-label={`Reduce ${item.name} by ${quantityStep} ${item.unit}`}
          >
            <FiMinus />
          </button>
          <span className="min-w-9 px-1 text-center">
            <span className="block text-xs font-bold leading-none">{item.quantity}</span>
            <span className="mt-0.5 block max-w-12 truncate text-[8px] leading-none text-gray-500">
              {item.unit}
            </span>
          </span>
          <button
            disabled={pending}
            type="button"
            onClick={() => updateQuantity(quantityStep)}
            className="grid h-7 w-7 place-items-center rounded-md bg-emerald-600 text-xs text-white shadow-sm disabled:opacity-40"
            aria-label={`Increase ${item.name} by ${quantityStep} ${item.unit}`}
          >
            <FiPlus />
          </button>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            disabled={pending}
            type="button"
            title={item.hidden ? "Unhide" : "Hide"}
            onClick={() => onPatch(item, { hidden: !item.hidden })}
            className="grid h-7 w-7 place-items-center rounded-md text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label={`${item.hidden ? "Unhide" : "Hide"} ${item.name}`}
          >
            {item.hidden ? <FiEye /> : <FiEyeOff />}
          </button>
          <button
            disabled={pending}
            type="button"
            title="Finished"
            onClick={() => onOutcome(item, "finished")}
            className="grid h-7 w-7 place-items-center rounded-md text-sm text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
            aria-label={`Mark ${item.name} finished`}
          >
            <FiCheckCircle />
          </button>
          <button
            disabled={pending}
            type="button"
            title={item.buy ? "Remove from shopping list" : "Add to shopping list"}
            onClick={() => onPatch(item, { buy: !item.buy })}
            className={`grid h-7 w-7 place-items-center rounded-md text-sm disabled:opacity-50 ${item.buy ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200" : "text-gray-500 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"}`}
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
            className="grid h-7 w-7 place-items-center rounded-md text-sm text-red-500 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/30"
            aria-label={`Mark ${item.name} thrown away`}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </article>
  );
}
