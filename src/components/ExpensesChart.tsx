import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useExpenseFilter } from "../hooks/useExpensesSearch";
import { useItemContext } from "../hooks/useItemContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDate, getMonth, getYear, parseISO, subMonths } from "date-fns";
import { getDefaultBudgetMonthYear } from "../services/formatDate";
import { useBudgetFilter } from "../hooks/useBudgetsSearch";

const COLOR_CODES: Record<string, string> = {
  Food: "#FCA5A5", // red-300
  Transport: "#93C5FD", // blue-300
  Entertainment: "#6EE7B7", // green-300
  Utilities: "#FCD34D", // yellow-300
  Health: "#C4B5FD", // purple-300
  Shopping: "#F9A8D4", // pink-300
  Insurance: "#D1D5DB", // gray-300
  Miscellaneous: "#FDBA74", // orange-300
  Toiletries: "#5EEAD4", // teal-300
  Holiday: "#A5B4FC", // indigo-300
  Other: "#E5E7EB", // gray-200
  
};

export function ExpenseChart() {
  const { budgetStartDay } = useItemContext();

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  const defaults = useMemo(() => {
    if (budgetStartDay == null) return null;
    return getDefaultBudgetMonthYear(budgetStartDay);
  }, [budgetStartDay]);

  useEffect(() => {
    if (!defaults) return;
    setMonth((prev) => (prev.length ? prev : defaults.month));
    setYear((prev) => (prev ? prev : defaults.year));
  }, [defaults]);

  // Pie: use selected month
  const filteredExpensesPie = useExpenseFilter(
    chartType === "pie" && month ? [month] : [],
    year,
    budgetStartDay
  );

  // Bar: always 1–12 months
  const filteredExpensesBar = useExpenseFilter(
    Array.from({ length: 12 }, (_, i) => String(i + 1)),
    year,
    budgetStartDay
  );

  const filteredBudgetBar = useBudgetFilter(
    Array.from({ length: 12 }, (_, i) => String(i + 1)),
    year,
    budgetStartDay
  );

  // Pie data// Pie data
  const { pieData, total } = useMemo(() => {
    const grouped = (filteredExpensesPie || [])
      .filter((exp) => !exp.upcoming) // 🚫 filter here
      .reduce((acc, exp) => {
        if (!acc[exp.category]) {
          acc[exp.category] = { name: exp.category, value: 0 };
        }
        acc[exp.category].value += exp.amount;
        return acc;
      }, {} as Record<string, { name: string; value: number }>);

    const pieData = Object.values(grouped);
    const total = pieData.reduce((sum, d) => sum + d.value, 0);
    return { pieData, total };
  }, [filteredExpensesPie]);

  // Bar data
  const barData = useMemo(() => {
    const monthlyTotals: {
      month: string;
      expensesTotal: number;
      budgetsTotal: number;
    }[] = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(Number(year), i).toLocaleString("default", {
        month: "short",
      }),
      expensesTotal: 0,
      budgetsTotal: 0,
    }));

    filteredBudgetBar
      .filter((b) => !b.upcoming)
      .forEach((b) => {
        if (!b.updatedAt) return;
        const d = parseISO(b.updatedAt);
        let monthIndex = getMonth(d); // JS: 0 = Jan
        let yearOfBudget = getYear(d);

        if (getDate(d) < budgetStartDay!) {
          const shiftedDate = subMonths(d, 1);
          monthIndex = getMonth(shiftedDate);
          yearOfBudget = getYear(shiftedDate);
        }
        if (yearOfBudget === Number(year)) {
          const targetIndex = monthIndex === 11 ? 0 : monthIndex + 1;
          monthlyTotals[targetIndex].budgetsTotal += b.amount;
        }
      });

    filteredExpensesBar
      .filter((exp) => !exp.upcoming)
      .forEach((exp) => {
        if (!exp.updatedAt) return;

        const d = parseISO(exp.updatedAt);

        let monthIndex = getMonth(d); // JS: 0 = Jan
        let yearOfExpense = getYear(d);

        if (getDate(d) < budgetStartDay!) {
          const shiftedDate = subMonths(d, 1);
          monthIndex = getMonth(shiftedDate);
          yearOfExpense = getYear(shiftedDate);
        }

        if (yearOfExpense === Number(year)) {
          const targetIndex = monthIndex === 11 ? 0 : monthIndex + 1;
          monthlyTotals[targetIndex].expensesTotal += exp.amount;
        }
      });

    return monthlyTotals;
  }, [filteredExpensesBar, filteredBudgetBar, budgetStartDay, year]);

  // Pie labels
  const renderLabel = useCallback(
    ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) / 2;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          opacity={percent > 0.05 ? 1 : 0.4} // faint if small
        >
          {`${(percent * 100).toFixed(1)}%`}
        </text>
      );
    },
    []
  );

  return (
    <section className="mx-1 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-950 dark:text-gray-50">
            Spending breakdown
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {chartType === "pie" ? "By category" : "Budget vs expenses"}
          </p>
        </div>

        <div className="inline-flex rounded-md bg-gray-100 p-0.5 text-xs dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setChartType("pie")}
            className={`rounded px-2 py-1 ${
              chartType === "pie"
                ? "bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-300"
                : "text-gray-500 dark:text-gray-300"
            }`}
          >
            Pie
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={`rounded px-2 py-1 ${
              chartType === "bar"
                ? "bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-300"
                : "text-gray-500 dark:text-gray-300"
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={chartType === "bar"} // disable when bar chart is active
          className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">All Years</option>
          {Array.from({ length: 3 }, (_, i) => {
            const yr = new Date().getFullYear() - 1 + i;
            return (
              <option key={yr} value={yr}>
                {yr}
              </option>
            );
          })}
        </select>
      </div>

      {/* Chart */}
      {chartType === "pie" ? (
        pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={82}
                  paddingAngle={2}
                  dataKey="value"
                  label={renderLabel}
                  labelLine={false}
                  isAnimationActive={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLOR_CODES[entry.name] || "#9CA3AF"} // fallback gray
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `€${value.toFixed(2)} (${(
                      ((value as number) / total) *
                      100
                    ).toFixed(1)}%)`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total: €{total.toFixed(2)}
            </p>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            No expenses found for the selected period.
          </p>
        )
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={10} tickLine={false} />
            <YAxis width={36} fontSize={10} tickLine={false} />
            <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
            <Legend verticalAlign="top" height={28} iconSize={8} />

            {/* Expenses Bar */}
            <Bar
              dataKey="expensesTotal"
              name="Expenses"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
            />

            {/* Budgets Bar */}
            <Bar
              dataKey="budgetsTotal"
              name="Budgets"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
