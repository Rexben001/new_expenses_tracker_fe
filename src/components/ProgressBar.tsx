import { formatCurrency } from "../services/formatCurrency";
import type { Budget } from "../types/budgets";

export const ProgressBar = ({
  budget,
  remaining,
  currency,
}: {
  budget: Budget;
  remaining: number;
  currency: string;
}) => {
  const spent = budget.amount! - remaining;

  const percent = (spent / budget.amount!) * 100;

  const totalWidth = percent > 100 ? 100 : percent;

  const progressBarClass =
    percent > 90
      ? "bg-red-500 h-2 rounded-full"
      : "bg-blue-500 h-2 rounded-full";

  return (
    <>
      <div className="stacked-card__progress-track mt-3 mb-4 h-2 w-full overflow-hidden rounded-full">
        <div className={progressBarClass} style={{ width: `${totalWidth}%` }} />
      </div>

      <div className="flex justify-between text-sm">
        <div>
          <p className="stacked-card__stat-label">Spent</p>
          <p className="stacked-card__stat-value font-bold">
            {formatCurrency(spent, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="stacked-card__stat-label">Remaining</p>
          <p className="stacked-card__stat-value font-bold">
            {formatCurrency(budget.amount! - spent, currency)}
          </p>
        </div>
      </div>
    </>
  );
};
