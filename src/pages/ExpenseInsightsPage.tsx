import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBarChart2,
  FiCheckCircle,
  FiInfo,
  FiRefreshCw,
  FiTrendingUp,
  FiZap,
} from "react-icons/fi";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import { useItemContext } from "../hooks/useItemContext";
import {
  getExpenseInsights,
  type ExpenseInsight,
  type ExpenseInsightsResponse,
} from "../services/api";
import { formatCurrency } from "../services/formatCurrency";

const severityStyles = {
  info: {
    icon: FiInfo,
    className:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
  },
  success: {
    icon: FiCheckCircle,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  warning: {
    icon: FiAlertTriangle,
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  danger: {
    icon: FiAlertTriangle,
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  },
};

export function ExpenseInsightsPage() {
  const { getSubAccountId, currency } = useItemContext();
  const [data, setData] = useState<ExpenseInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsights = async () => {
    setLoading(true);
    setError("");
    try {
      const subId = await getSubAccountId();
      setData(await getExpenseInsights(subId));
    } catch {
      setError("Could not load expense insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayCurrency = data?.currency ?? currency ?? "EUR";
  const topCategories = useMemo(() => data?.categories ?? [], [data]);

  return (
    <SwipeShell toRight="/expenses" refresh={loadInsights}>
      <HeaderComponent>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              aria-label="Back to dashboard"
            >
              <FiArrowLeft />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                AI Insights
              </p>
              <h1 className="text-lg font-bold">Expense insights</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={loadInsights}
            disabled={loading}
            className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            aria-label="Refresh insights"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </HeaderComponent>

      <main className="min-h-screen max-w-md mx-auto px-4 pt-24 pb-24 dark:text-white">
        {loading && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Analysing your expenses...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {data && !loading && (
          <div className="space-y-3">
            <section className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {data.period.current}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    {formatCurrency(data.totals.currentMonth, displayCurrency)}
                  </h2>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                  <FiBarChart2 />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Metric
                  label="Budget left"
                  value={formatCurrency(
                    data.totals.remainingBudget,
                    displayCurrency
                  )}
                />
                <Metric
                  label="Vs last month"
                  value={
                    data.totals.changePercent === null
                      ? "New"
                      : `${data.totals.changePercent}%`
                  }
                />
              </div>
            </section>

            {topCategories.length > 0 && (
              <section className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-3 flex items-center gap-2">
                  <FiTrendingUp className="text-blue-600" />
                  <h2 className="font-semibold">Top categories</h2>
                </div>
                <div className="space-y-3">
                  {topCategories.map((category) => (
                    <div key={category.category}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{category.category}</span>
                        <span className="font-medium">
                          {formatCurrency(category.amount, displayCurrency)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.min(category.percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FiZap className="text-blue-600" />
                <h2 className="font-semibold">Suggestions</h2>
              </div>
              {data.insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  currency={displayCurrency}
                />
              ))}
            </section>
          </div>
        )}
      </main>
      <FooterNav />
    </SwipeShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-gray-50 p-2.5 dark:bg-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function InsightCard({
  insight,
  currency,
}: {
  insight: ExpenseInsight;
  currency: string;
}) {
  const style = severityStyles[insight.severity];
  const Icon = style.icon;

  return (
    <article className={`rounded-lg border p-3 ${style.className}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold">{insight.title}</h3>
            {typeof insight.value === "number" && (
              <span className="shrink-0 text-sm font-semibold">
                {formatCurrency(insight.value, currency)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-5 opacity-90">{insight.message}</p>
        </div>
      </div>
    </article>
  );
}
