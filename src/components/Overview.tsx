import { FiMaximize2 } from "react-icons/fi";
import { formatCurrency } from "../services/formatCurrency";
import { useMemo } from "react";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function OverviewBoard({
  month,
  setMonth,
  year,
  setYear,
  setOpenStats,
  totalBudget,
  currency,
  totalExpenses,
  remaining,
  progressBarClass,
  totalWidth,
}: {
  month: string;
  setMonth: (month: string) => void;
  year: string;
  setYear: (year: string) => void;
  setOpenStats: (open: boolean) => void;
  totalBudget: number;
  currency: string;
  totalExpenses: number;
  remaining: number;
  progressBarClass: string;
  totalWidth: number;
}) {
  const now = new Date();
  const computedMinYear = now.getFullYear() - 5;
  const computedMaxYear = now.getFullYear() + 5;

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = computedMaxYear; y >= computedMinYear; y--) years.push(y);
    return years;
  }, [computedMaxYear, computedMinYear]);

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-950 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpenStats(true)}
          className="min-w-0 text-left"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Expense overview
          </p>
          <p className="mt-0.5 text-xl font-bold leading-tight">
            {formatCurrency(totalExpenses || 0, currency, false)}
          </p>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <label className="sr-only" htmlFor="budget-month">
            Select month
          </label>
          <div className="relative">
            <select
              id="budget-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-6 appearance-none text-[11px] font-medium px-2 rounded-md
                            bg-gray-100 text-gray-700 shadow-sm
                            dark:bg-gray-800 dark:text-gray-200
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 pr-4"
              aria-label="Select month"
            >
              {MONTHS.map((m, idx) => (
                <option
                  key={m}
                  value={idx + 1}
                  className="text-black dark:text-white"
                >
                  {m}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] opacity-80">
              v
            </span>
          </div>

          <label className="sr-only" htmlFor="budget-year">
            Select year
          </label>
          <div className="relative">
            <select
              id="budget-year"
              value={year}
              onChange={(e) =>
                // onChangePeriod({ month, year: Number(e.target.value) })
                setYear(e.target.value)
              }
              className="h-6 appearance-none text-[11px] font-medium px-2 rounded-md
                            bg-gray-100 text-gray-700 shadow-sm
                            dark:bg-gray-800 dark:text-gray-200
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 pr-4"
              aria-label="Select year"
            >
              {yearOptions.map((y) => (
                <option
                  key={y}
                  value={y}
                  className="text-black dark:text-white"
                >
                  {y}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] opacity-80">
              v
            </span>
          </div>
        </div>
      </div>

      <button
        className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        onClick={() => setOpenStats(true)}
        aria-label="Expand amounts"
        type="button"
      >
        <FiMaximize2 />
      </button>

      <button
        type="button"
        onClick={() => setOpenStats(true)}
        className="mt-2 grid grid-cols-2 gap-2 pr-7 text-left text-xs"
      >
        <span className="rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-800">
          <span className="block text-gray-500 dark:text-gray-400">Budget</span>
          <span className="mt-0.5 block font-semibold">
            {formatCurrency(totalBudget || 0, currency, false)}
          </span>
        </span>
        <span className="rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-800">
          <span className="block text-gray-500 dark:text-gray-400">Left</span>
          <span className="mt-0.5 block font-semibold">
            {formatCurrency(remaining || 0, currency, false)}
          </span>
        </span>
      </button>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={progressBarClass} style={{ width: `${totalWidth}%` }} />
      </div>
    </div>
  );
}
