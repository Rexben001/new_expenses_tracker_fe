import { formatCurrency } from "../services/formatCurrency";
import { formatRelativeDate } from "../services/formatDate";

export const UpcomingBox = ({
  id,
  budgetId,
  amount,
  title,
  updatedAt,
  updateItem,
  currency = "EUR",
  selectMode,
  selected,
  onSelect,
}: {
  id: string;
  budgetId?: string;
  amount: number;
  title: string;
  updatedAt?: string;
  updateItem: () => void;
  currency?: string;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: ((id: string, budgetId: string) => void) | ((id: string) => void);
}) => {
  return (
    <div className="rounded-xl px-4 py-2 mb-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 text-sm flex items-center justify-between shadow-sm">
      <input
        type="checkbox"
        className="mt-1 mr-3 w-4 h-4 cursor-pointer"
        checked={selected}
        onChange={() => onSelect?.(id, budgetId!)}
        hidden={!selectMode}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <p className="truncate font-medium">{title}</p>
        {updatedAt && (
          <p className="text-[11px] text-gray-400 mt-0.5">
            {formatRelativeDate(updatedAt)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        <p className="font-semibold text-sm text-gray-500 dark:text-gray-400">
          {formatCurrency(amount, currency)}
        </p>

        {/* Toggle */}
        <div
          onClick={updateItem}
          title="Activate expense"
          className="w-10 h-5 flex items-center bg-gray-300 dark:bg-gray-700 rounded-full p-0.5 cursor-pointer relative hover:bg-blue-400 dark:hover:bg-blue-600 transition"
        >
          <div className="w-4 h-4 bg-white rounded-full shadow transition-transform transform translate-x-0" />
        </div>
      </div>
    </div>
  );
};
