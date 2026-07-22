import { useCallback, useEffect, useState } from "react";
import { FiAward, FiChevronLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { FoodConsumptionDashboard } from "../components/FoodConsumptionDashboard";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import { useItemContext } from "../hooks/useItemContext";
import { getErrorMessage, getFoodStats } from "../services/api";
import { formatCurrency } from "../services/formatCurrency";
import type { FoodStats } from "../types/food";

export function FoodDashboardPage() {
  const { currency, getSubAccountId } = useItemContext();
  const [stats, setStats] = useState<FoodStats>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const subId = await getSubAccountId();
      setStats((await getFoodStats(subId)) as FoodStats);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load food dashboard."));
    } finally {
      setLoading(false);
    }
  }, [getSubAccountId]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <SwipeShell toRight="/food" refresh={loadStats}>
      <HeaderComponent title="Food Dashboard">
        <div className="flex items-center gap-3 pb-2">
          <Link
            to="/food"
            aria-label="Back to food tracker"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <FiChevronLeft />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Food dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Consumption and savings
            </p>
          </div>
        </div>
      </HeaderComponent>

      <main className="mx-auto min-h-screen max-w-md space-y-4 px-4 pb-32 pt-[calc(var(--app-header-height,6rem)+1.5rem)] dark:text-white">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {loading && !stats ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            Loading dashboard…
          </div>
        ) : (
          <>
            <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-4 text-white shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">
                    This month
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    You saved {formatCurrency(stats?.estimatedSavings, currency ?? "EUR")}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-100">
                    {stats?.finishedCount ?? 0} food items finished instead of thrown away
                  </p>
                </div>
                <FiAward className="h-7 w-7 text-emerald-100" />
              </div>
              {(stats?.wastedCount ?? 0) > 0 && (
                <p className="mt-3 border-t border-white/20 pt-2 text-xs text-emerald-100">
                  {stats?.wastedCount} food items logged as thrown away
                </p>
              )}
            </section>

            <FoodConsumptionDashboard stats={stats} />
          </>
        )}
      </main>

      <FooterNav />
    </SwipeShell>
  );
}
