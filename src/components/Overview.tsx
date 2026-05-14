import {
  FiMaximize2,
  FiPieChart,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";
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
    <div className="relative rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-950 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50">
      {/* Month/Year Selects */}
      <div className="absolute top-1.5 right-2 flex items-center gap-1">
        <label className="sr-only" htmlFor="budget-month">
          Select month
        </label>
        <div className="relative">
          <select
            id="budget-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="appearance-none text-[11px] font-medium px-2 py-1 rounded-full
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
            className="appearance-none text-[11px] font-medium px-2 py-1 rounded-full
                          bg-gray-100 text-gray-700 shadow-sm
                          dark:bg-gray-800 dark:text-gray-200
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 pr-4"
            aria-label="Select year"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y} className="text-black dark:text-white">
                {y}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] opacity-80">
            v
          </span>
        </div>
      </div>

      {/* optional enlarge icon */}
      <button
        className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        onClick={() => setOpenStats(true)}
        aria-label="Expand amounts"
        type="button"
      >
        <FiMaximize2 />
      </button>

      {/* Stat Row */}
      <div className="flex justify-between items-center text-sm gap-2 pt-5">
        {/* Budget */}
        <button
          type="button"
          onClick={() => setOpenStats(true)}
          className="flex items-center gap-2 flex-1 rounded-lg p-1 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <FiPieChart className="text-lg text-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
            <span className="font-bold text-[13px] sm:text-sm leading-tight block">
              {formatCurrency(totalBudget || 0, currency, false)}
            </span>
          </div>
        </button>

        {/* Expenses */}
        <button
          type="button"
          onClick={() => setOpenStats(true)}
          className="flex items-center gap-2 flex-1 rounded-lg p-1 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <FiTrendingDown className="text-lg text-red-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Expenses</p>
            <span className="font-bold text-[13px] sm:text-sm leading-tight block">
              {formatCurrency(totalExpenses || 0, currency, false)}
            </span>
          </div>
        </button>

        {/* Remaining */}
        <button
          type="button"
          onClick={() => setOpenStats(true)}
          className="flex items-center gap-2 flex-1 rounded-lg p-1 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <FiTrendingUp className="text-lg text-emerald-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
            <span className="font-bold text-[13px] sm:text-sm leading-tight block">
              {formatCurrency(remaining || 0, currency, false)}
            </span>
          </div>
        </button>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-3">
        <div className={progressBarClass} style={{ width: `${totalWidth}%` }} />
      </div>
    </div>
  );
}
