import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { FoodConsumptionPeriod, FoodStats } from "../types/food";

const PIE_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#64748b",
];

const emptyPeriod: FoodConsumptionPeriod = {
  records: 0,
  totalQuantity: 0,
  quantitiesByUnit: {},
};

function quantityLabel(period: FoodConsumptionPeriod) {
  const values = Object.entries(period.quantitiesByUnit);
  if (!values.length) return "No food logged";
  return values
    .map(([unit, quantity]) => `${quantity} ${unit}`)
    .join(" · ");
}

export function FoodConsumptionDashboard({ stats }: { stats?: FoodStats }) {
  const consumption = stats?.consumption;
  const periods = [
    { label: "Today", value: consumption?.day ?? emptyPeriod },
    { label: "This week", value: consumption?.week ?? emptyPeriod },
    { label: "This month", value: consumption?.month ?? emptyPeriod },
  ];
  const pieData = consumption?.byCategory ?? [];

  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div>
        <h2 className="font-bold">Food consumed</h2>
        <p className="text-xs text-gray-500">
          Based on items marked Finished
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {periods.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30"
          >
            <p className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">
              {label}
            </p>
            <p className="mt-1 text-xl font-bold">{value.records}</p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-gray-500 dark:text-gray-400">
              {quantityLabel(value)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
        <h3 className="text-sm font-semibold">This month by category</h3>
        {pieData.length ? (
          <div className="h-64 w-full" aria-label="Food consumed by category pie chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="45%"
                  innerRadius={42}
                  outerRadius={76}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            Mark food Finished to build chart.
          </p>
        )}
      </div>
    </section>
  );
}
