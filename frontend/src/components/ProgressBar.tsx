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
      <div className="w-full bg-gray-200 h-2 rounded-full mt-3 mb-3">
        <div className={progressBarClass} style={{ width: `${totalWidth}%` }} />
      </div>

      <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
        <div>
          <p>Spent</p>
          <p className="font-bold text-black dark:text-white">
            {formatCurrency(spent, currency)}
          </p>
        </div>
        <div className="text-right">
          <p>Remaining</p>
          <p className="font-bold text-black dark:text-white">
            {formatCurrency(budget.amount! - spent, currency)}
          </p>
        </div>
      </div>
    </>
  );
};
