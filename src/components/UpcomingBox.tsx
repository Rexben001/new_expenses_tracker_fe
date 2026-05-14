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
    <div className="stacked-card stacked-card--upcoming mb-3">
      <div className="stacked-card__panel flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 bg-white/80 accent-sky-600 dark:border-white/20 dark:bg-slate-900/30 dark:accent-sky-400"
          checked={selected}
          onChange={() => onSelect?.(id, budgetId!)}
          hidden={!selectMode}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="stacked-card__title truncate font-medium">{title}</p>
          {updatedAt && (
            <p className="stacked-card__muted mt-0.5 text-[11px]">
              {formatRelativeDate(updatedAt)}
            </p>
          )}
        </div>

        <div className="ml-4 flex items-center gap-3">
          <p className="stacked-card__amount text-sm font-semibold">
            {formatCurrency(amount, currency)}
          </p>

          <div
            onClick={updateItem}
            title="Activate expense"
            className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-slate-300/80 p-0.5 transition hover:bg-sky-400/70 dark:bg-slate-600 dark:hover:bg-sky-500/60"
          >
            <div className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
