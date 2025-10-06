import { Link, useLocation } from "react-router-dom";
import { FiFilter, FiPlus } from "react-icons/fi";
import { useItemContext } from "../hooks/useItemContext";
import { AddNewItem } from "../components/NoItem";
import { useEffect, useMemo, useState } from "react";
import { useBudgetFilter, useBudgetSearch } from "../hooks/useBudgetsSearch";
import { BudgetBox } from "../components/BudgetBox";
import { ItemFilterPopup } from "../components/FilterComponent";
import { getTotal } from "../services/item";
import { formatCurrency } from "../services/formatCurrency";
import { SearchBox } from "../components/SearchBox";
import { getDefaultBudgetMonthYear } from "../services/formatDate";
import { CollapsibleUpcoming } from "../components/CollapsibleUpcoming";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";
import { useAuth } from "../context/AuthContext";
import { deleteBudget, updateBudget } from "../services/api";
import SwipeShell from "../components/SwipeShell";

type TabKey = "ALL" | "FAV" | "UPCOMING";

export function BudgetPage() {
  const location = useLocation();

  const auth = useAuth();

  const { fetchBudgets, currency, user, setBudgets } = useItemContext();

  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [months, setMonths] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [tab, setTab] = useState<TabKey>("ALL");

  const defaults = useMemo(() => {
    if (user?.budgetStartDay == null) return null;
    return getDefaultBudgetMonthYear(user.budgetStartDay);
  }, [user?.budgetStartDay]);

  useEffect(() => {
    if (!defaults) return;
    setMonths((prev) => (prev.length ? prev : [defaults.month]));
    setYear((prev) => (prev ? prev : defaults.year));
  }, [defaults]);

  const _filterBudgets = useBudgetFilter(
    months,
    year,
    user?.budgetStartDay ?? 1
  );

  const filteredBudgets = useBudgetSearch(query, _filterBudgets);

  const upcomingBudgets = filteredBudgets.filter((b) => b.upcoming);
  const activeBudgets = filteredBudgets.filter((b) => !b.upcoming);
  const favBudgets = filteredBudgets.filter((e) => e?.favorite);

  useEffect(() => {
    const total = getTotal(filteredBudgets);
    setTotal(total);
  }, [filteredBudgets]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchBudgets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    window.history.replaceState({}, document.title);
  }, []);

  const resetFilter = () => {
    setMonths([]);
    setYear("");
    setShowPopup(false);
  };

  const removeBudget = async (id: string) => {
    const _budgets = filteredBudgets.filter((e) => e.id !== id);
    setBudgets(_budgets);
    try {
      await deleteBudget(id);
      await fetchBudgets();
    } catch {
      await fetchBudgets();
    }
  };

  const updateFavorites = async (id: string, favorite: boolean) => {
    const budgets = filteredBudgets.map((e) => {
      if (e.id === id) {
        return { ...e, favorite };
      }
      return e;
    });
    setBudgets(budgets);

    try {
      await updateBudget(id, {
        favorite,
      });
      await fetchBudgets();
    } catch {
      await fetchBudgets();
    }
  };

  if (!auth?.ready) return null;

  // Count per tab
  const counts = {
    ALL: filteredBudgets.length,
    FAV: favBudgets.length,
    UPCOMING: upcomingBudgets.length,
  };

  // Title per tab
  const titleMap: Record<TabKey, string> = {
    ALL: "All Budgets",
    FAV: "Favorites",
    UPCOMING: "Upcoming",
  };

  return (
    <SwipeShell toLeft="/settings" toRight="/expenses" refresh={fetchBudgets}>
      <HeaderComponent>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">
            {titleMap[tab]}{" "}
            <span className="text-blue-500">({counts[tab]})</span>
          </h1>
          <button
            className="text-gray-500 dark:text-white hover:text-gray-800"
            onClick={() => setShowPopup(!showPopup)}
          >
            <FiFilter className="text-xl" />
          </button>
        </div>

        <div className="mb-3">
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-white/70 dark:bg-gray-800/70 backdrop-blur">
            {(
              [
                { key: "ALL", label: "All" },
                { key: "FAV", label: "Favourites" },
                { key: "UPCOMING", label: "Upcoming" },
              ] as { key: TabKey; label: string }[]
            ).map(({ key, label }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition
                    ${
                      active
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {!showPopup && (
          <SearchBox query={query} setQuery={setQuery} title="budgets" />
        )}

        {showPopup && (
          <ItemFilterPopup
            months={months}
            setMonths={setMonths}
            year={year}
            setYear={setYear}
            resetFilter={resetFilter}
          />
        )}

        <p className="my-1.5 text-blue-500">
          Total Budgets:{"  "}
          <span className="font-bold text-black dark:text-white">
            {formatCurrency(total, currency)}
          </span>
        </p>
      </HeaderComponent>
      <div
        className={`relative min-h-screen dark:text-white px-4 pt-6 max-w-md mx-auto ${
          showPopup ? "mt-63" : "mt-44"
        }`}
      >
        <div className="mx-1 pt-2">
          {tab === "ALL" && (
            <>
              <CollapsibleUpcoming
                upcomingItems={upcomingBudgets}
                currency={currency!}
                compType="Budget"
                removeBudget={removeBudget}
              />

              {filteredBudgets.length ? (
                activeBudgets.map((budget) => (
                  <BudgetBox
                    key={budget.id}
                    budget={budget}
                    currency={currency}
                    showExpense={true}
                    removeBudget={removeBudget}
                    updateFavorites={updateFavorites}
                  />
                ))
              ) : (
                <AddNewItem
                  url="/budgets/new"
                  type="budgets"
                  text="You don't have any budgets"
                />
              )}
            </>
          )}

          {tab === "FAV" && (
            <>
              {favBudgets.length ? (
                favBudgets.map((budget) => (
                  <BudgetBox
                    key={budget.id}
                    budget={budget}
                    currency={currency}
                    showExpense={true}
                    removeBudget={removeBudget}
                    updateFavorites={updateFavorites}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-200">
                  You have no favorites yet. Tap the ⭐ on an expense to pin it
                  here.
                </div>
              )}
            </>
          )}

          {tab === "UPCOMING" && (
            <>
              {upcomingBudgets.length ? (
                <CollapsibleUpcoming
                  upcomingItems={upcomingBudgets}
                  currency={currency!}
                  compType="Expense"
                  show={true}
                  removeBudget={removeBudget}
                />
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 p-3 text-sm">
                  No upcoming expenses in the selected period.
                </div>
              )}
            </>
          )}

          <div className="fixed bottom-24 inset-x-0 z-50">
            <div className="max-w-md mx-auto px-4 flex justify-end">
              <Link
                to="/budgets/new"
                className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
                aria-label="Add an expense"
              >
                <FiPlus className="text-2xl" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <FooterNav />
    </SwipeShell>
  );
}
