import { useLocation } from "react-router-dom";
import {
  deleteExpense,
  duplicateExpense,
  updateExpense,
} from "../services/api";
import { ExpenseBox } from "../components/ExpenseBox";
import { FiFilter } from "react-icons/fi";
import { useItemContext } from "../hooks/useItemContext";
import { AddNewItem } from "../components/NoItem";
import { useEffect, useMemo, useState } from "react";
import { useExpenseFilter, useExpenseSearch } from "../hooks/useExpensesSearch";
import { ItemFilterPopup } from "../components/FilterComponent";
import { resetFilter } from "../services/utils";
import { getTotal } from "../services/item";
import { formatCurrency } from "../services/formatCurrency";
import { SearchBox } from "../components/SearchBox";
import { getDefaultBudgetMonthYear } from "../services/formatDate";
import { CollapsibleUpcoming } from "../components/CollapsibleUpcoming";
import FloatingActionButton from "../components/FloatingActionButton";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";
import { useAuth } from "../context/AuthContext";
import { hasIdToken } from "../services/amplify";
import SwipeShell from "../components/SwipeShell";

type TabKey = "ALL" | "FAV" | "UPCOMING";

export function ExpensesPage() {
  const { fetchExpenses, currency, user, setExpenses } = useItemContext();
  const location = useLocation();

  const [query, setQuery] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [months, setMonths] = useState<string[]>([]);
  const [year, setYear] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState<TabKey>("ALL");

  const auth = useAuth();

  const defaults = useMemo(() => {
    if (user?.budgetStartDay == null) return null;
    return getDefaultBudgetMonthYear(user.budgetStartDay);
  }, [user.budgetStartDay]);

  useEffect(() => {
    if (!defaults) return;
    // Always reset on start-day changes
    setMonths([defaults.month]);
    setYear(defaults.year);
  }, [defaults, defaults?.month, defaults?.year]);

  useEffect(() => {
    (async () => {
      auth?.setAuthed(await hasIdToken());
      auth?.setReady(true);
    })();
  }, [auth]);

  const _filterExpenses = useExpenseFilter(
    months,
    year,
    user?.budgetStartDay ?? 1
  );

  const filteredExpenses = useExpenseSearch(query, _filterExpenses);

  const upcomingExpenses = filteredExpenses.filter((e) => e.upcoming);
  const activeExpenses = filteredExpenses.filter((e) => !e.upcoming);
  const favExpenses = filteredExpenses.filter((e) => e?.favorite);

  useEffect(() => {
    if (location.state?.refresh) fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    window.history.replaceState({}, document.title);
  }, []);

  useEffect(() => {
    setTotal(getTotal(filteredExpenses));
  }, [filteredExpenses]);

  const removeExpense = async (id: string, budgetId?: string) => {
    // optimistic prune
    const expenses = filteredExpenses.filter((e) => e.id !== id);
    setExpenses(expenses);
    try {
      await deleteExpense(id, budgetId);
      await fetchExpenses();
    } catch {
      await fetchExpenses();
    }
  };

  const duplicateOldExpense = async (id: string, budgetId?: string) => {
    await duplicateExpense(id, budgetId);
    await fetchExpenses();
  };

  const updateFavorites = async (
    expenseId: string,
    id: string,
    favorite: boolean
  ) => {
    const expenses = filteredExpenses.map((e) => {
      if (e.id === id) {
        return { ...e, favorite };
      }
      return e;
    });
    setExpenses(expenses);
    try {
      await updateExpense(
        expenseId,
        {
          favorite,
        },
        id
      );
      await fetchExpenses();
    } catch {
      await fetchExpenses();
    }
  };

  if (!auth?.ready) return null;

  // Count per tab
  const counts = {
    ALL: filteredExpenses.length,
    FAV: favExpenses.length,
    UPCOMING: upcomingExpenses.length,
  };

  // Title per tab
  const titleMap: Record<TabKey, string> = {
    ALL: "All Expenses",
    FAV: "Favorites",
    UPCOMING: "Upcoming",
  };

  return (
    <SwipeShell toLeft="/budgets" toRight="/" refresh={fetchExpenses}>
      <HeaderComponent>
        <div className="flex items-center justify-between mb-3">
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

        {/* Tabs */}
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
          <SearchBox query={query} setQuery={setQuery} title="expenses" />
        )}

        {showPopup && (
          <ItemFilterPopup
            months={months}
            setMonths={setMonths}
            year={year}
            setYear={setYear}
            resetFilter={() => {
              resetFilter({ setMonths, setYear, setShowPopup });
            }}
          />
        )}

        {/* Total always reflects filtered set, not tab */}
        <p className="my-1.5 text-blue-500">
          Total Expenses:{" "}
          <span className="font-bold text-black dark:text-white">
            {formatCurrency(total, currency)}
          </span>
        </p>
      </HeaderComponent>
      <div
        className={`relative min-h-screen dark:text-white px-4 pt-6 max-w-md mx-auto ${
          showPopup ? "mt-48" : "mt-30"
        }`}
      >
        <div className="mx-1 pt-2">
          {/* Content per tab */}
          {tab === "ALL" && (
            <>
              {/* Keep your collapsible upcoming + active list */}
              <CollapsibleUpcoming
                upcomingItems={upcomingExpenses}
                currency={currency!}
                compType="Expense"
                removeExpense={removeExpense}
                duplicateExpense={duplicateOldExpense}
              />
              {activeExpenses.length ? (
                activeExpenses.map(
                  ({
                    id,
                    title,
                    category,
                    amount,
                    updatedAt,
                    budgetId,
                    upcoming,
                    favorite,
                  }) => (
                    <ExpenseBox
                      key={id}
                      id={id}
                      title={title}
                      category={category}
                      amount={amount}
                      updatedAt={updatedAt}
                      currency={currency!}
                      budgetId={budgetId}
                      upcoming={upcoming}
                      favorite={favorite}
                      removeExpense={removeExpense}
                      duplicateExpense={duplicateOldExpense}
                      updateFavorites={updateFavorites}
                    />
                  )
                )
              ) : (
                <AddNewItem
                  url="/expenses/new"
                  type="expenses"
                  text="You don't have any expenses"
                />
              )}
            </>
          )}

          {tab === "FAV" && (
            <>
              {favExpenses.length ? (
                favExpenses.map(
                  ({
                    id,
                    title,
                    category,
                    amount,
                    updatedAt,
                    budgetId,
                    upcoming,
                    favorite,
                  }) => (
                    <ExpenseBox
                      key={id}
                      id={id}
                      title={title}
                      category={category}
                      amount={amount}
                      updatedAt={updatedAt}
                      currency={currency!}
                      budgetId={budgetId}
                      upcoming={upcoming}
                      favorite={favorite}
                      removeExpense={removeExpense}
                      duplicateExpense={duplicateOldExpense}
                      updateFavorites={updateFavorites}
                    />
                  )
                )
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
              {upcomingExpenses.length ? (
                <CollapsibleUpcoming
                  upcomingItems={upcomingExpenses}
                  currency={currency!}
                  compType="Expense"
                  show={true}
                  removeExpense={removeExpense}
                  duplicateExpense={duplicateOldExpense}
                />
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 p-3 text-sm">
                  No upcoming expenses in the selected period.
                </div>
              )}
            </>
          )}

          <FloatingActionButton />
        </div>
      </div>
      <FooterNav />
    </SwipeShell>
  );
}
