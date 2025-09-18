import { useLocation } from "react-router-dom";
import { deleteExpense, duplicateExpense } from "../services/api";
import { ExpenseBox } from "../components/ExpenseBox";
import { FiFilter } from "react-icons/fi";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
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

export function ExpensesPage() {
  const { loading, fetchExpenses, currency, user } = useItemContext();
  const location = useLocation();

  const [query, setQuery] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [months, setMonths] = useState<string[]>([]);
  const [year, setYear] = useState<string>("");
  const [total, setTotal] = useState(0);

  const defaults = useMemo(() => {
    if (user?.budgetStartDay == null) return null;
    return getDefaultBudgetMonthYear(user.budgetStartDay);
  }, [user?.budgetStartDay]);

  useEffect(() => {
    if (!defaults) return;
    setMonths((prev) => (prev.length ? prev : [defaults.month]));
    setYear((prev) => (prev ? prev : defaults.year));
  }, [defaults]);

  const ready = !loading && user?.budgetStartDay != null;

  const _filterExpenses = useExpenseFilter(
    months,
    year,
    user?.budgetStartDay ?? 1
  );

  const filteredExpenses = useExpenseSearch(query, _filterExpenses);

  const upcomingExpenses = filteredExpenses.filter((b) => b.upcoming);
  const activeExpenses = filteredExpenses.filter((b) => !b.upcoming);

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
    await deleteExpense(id, budgetId);
    await fetchExpenses();
  };

  const duplicateOldExpense = async (id: string, budgetId?: string) => {
    await duplicateExpense(id, budgetId);
    await fetchExpenses();
  };

  if (loading || !ready) return <LoadingScreen />;

  return (
    <>
      <HeaderComponent>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">
            All Expenses{" "}
            <span className="text-blue-500">({filteredExpenses.length})</span>
          </h1>
          <button
            className="text-gray-500 dark:text-white hover:text-gray-800"
            onClick={() => setShowPopup(!showPopup)}
          >
            <FiFilter className="text-xl" />
          </button>
        </div>

        <SearchBox query={query} setQuery={setQuery} title="expenses" />

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
        <p className="my-1.5 text-blue-500">
          Total Expenses:{"  "}
          <span className="font-bold text-black dark:text-white">
            {formatCurrency(total, currency)}
          </span>
        </p>
      </HeaderComponent>
      <div className="relative min-h-screen dark:text-white px-4 pt-6 max-w-md mx-auto mt-32">
        <div className="mx-1 pt-2">
          <CollapsibleUpcoming
            upcomingItems={upcomingExpenses}
            currency={currency!}
            compType="Expense"
            removeExpense={removeExpense}
            duplicateExpense={duplicateOldExpense}
          />

          {filteredExpenses?.length ? (
            activeExpenses.map(
              ({
                id,
                title,
                category,
                amount,
                updatedAt,
                budgetId,
                upcoming,
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
                  removeExpense={removeExpense}
                  duplicateExpense={duplicateOldExpense}
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
          <FloatingActionButton />
        </div>
      </div>
      <FooterNav />
    </>
  );
}
