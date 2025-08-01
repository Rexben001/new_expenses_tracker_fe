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
import { useCallback, useMemo, useState } from "react";

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
  const defaultMonth = String(new Date().getMonth() + 1);
  const defaultYear = String(new Date().getFullYear());
  const { user } = useItemContext();

  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  // Pie: use selected month
  const filteredExpensesPie = useExpenseFilter(
    chartType === "pie" && month ? [month] : [],
    year,
    user.budgetStartDay
  );

  // Bar: always 1–12 months
  const filteredExpensesBar = useExpenseFilter(
    Array.from({ length: 12 }, (_, i) => String(i + 1)),
    year,
    user.budgetStartDay
  );

  // Pie data
  const { pieData, total } = useMemo(() => {
    const grouped = filteredExpensesPie.reduce((acc, exp) => {
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
    const monthlyTotals: { month: string; total: number }[] = Array.from(
      { length: 12 },
      (_, i) => ({
        month: new Date(2025, i).toLocaleString("default", { month: "short" }),
        total: 0,
      })
    );

    filteredExpensesBar.forEach((exp) => {
      if (!exp.updatedAt) return;

      const [yyyy, mm, dd] = exp.updatedAt.split("-").map(Number);
      const d = new Date(yyyy, mm - 1, dd); // JS months are 0-based

      if (String(d.getFullYear()) === year) {
        const expMonth = d.getMonth(); // 0-based
        monthlyTotals[expMonth].total += exp.amount;
      }
    });

    return monthlyTotals;
  }, [filteredExpensesBar, year]);

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
          fontSize={12}
          opacity={percent > 0.05 ? 1 : 0.4} // faint if small
        >
          {`${(percent * 100).toFixed(1)}%`}
        </text>
      );
    },
    []
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Expenses Overview</h2>

      {/* Chart Type Toggle */}
      <div className="flex gap-4 mb-4">
        <label>
          <input
            type="radio"
            value="pie"
            checked={chartType === "pie"}
            onChange={() => setChartType("pie")}
            className="mr-2"
          />
          Pie Chart
        </label>
        <label>
          <input
            type="radio"
            value="bar"
            checked={chartType === "bar"}
            onChange={() => setChartType("bar")}
            className="mr-2"
          />
          Bar Chart
        </label>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={chartType === "bar"} // disable when bar chart is active
          className="border rounded p-2 bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
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
          className="border rounded p-2 bg-white dark:bg-gray-800 dark:text-white"
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
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
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
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <p className="mt-4 text-center text-gray-700 dark:text-gray-300 font-semibold">
              Total: €{total.toFixed(2)}
            </p>
          </>
        ) : (
          <p className="text-gray-500 text-center">
            No expenses found for the selected period.
          </p>
        )
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
            <Bar dataKey="total" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
