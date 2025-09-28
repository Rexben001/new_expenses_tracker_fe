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
    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-indigo-200 dark:to-indigo-300 dark:text-blue-800 text-white px-2 py-3 rounded-xl shadow">
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
                          bg-white/25 text-white shadow-sm backdrop-blur
                          dark:bg-blue-600/90 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-0 pr-4"
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
            ▼
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
                          bg-white/25 text-white shadow-sm backdrop-blur
                          dark:bg-blue-600/90 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-0 pr-4"
            aria-label="Select year"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y} className="text-black dark:text-white">
                {y}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] opacity-80">
            ▼
          </span>
        </div>
      </div>

      {/* optional enlarge icon */}
      <button
        className="absolute bottom-2 right-2 text-white/80 hover:text-white dark:text-blue-900/70 dark:hover:text-blue-900"
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
          className="flex items-center gap-2 flex-1 text-left"
        >
          <FiPieChart className="text-lg opacity-80 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs opacity-80">Budget</p>
            <span className="font-bold text-[13px] sm:text-sm leading-tight block">
              {formatCurrency(totalBudget || 0, currency, false)}
            </span>
          </div>
        </button>

        {/* Expenses */}
        <button
          type="button"
          onClick={() => setOpenStats(true)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <FiTrendingDown className="text-lg opacity-80 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs opacity-80">Expenses</p>
            <span className="font-bold text-[13px] sm:text-sm leading-tight block">
              {formatCurrency(totalExpenses || 0, currency, false)}
            </span>
          </div>
        </button>

        {/* Remaining */}
        <button
          type="button"
          onClick={() => setOpenStats(true)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <FiTrendingUp className="text-lg opacity-80 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs opacity-80">Remaining</p>
            <span className="font-bold text-[13px] sm:text-sm leading-tight block">
              {formatCurrency(remaining || 0, currency, false)}
            </span>
          </div>
        </button>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-full bg-white/30 dark:bg-gray-300 rounded-full h-1 mt-3">
        <div className={progressBarClass} style={{ width: `${totalWidth}%` }} />
      </div>
    </div>
  );
}
