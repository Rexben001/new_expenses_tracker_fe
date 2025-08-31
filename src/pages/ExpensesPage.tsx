import { Link, useLocation } from "react-router-dom";
import { FooterNav } from "../components/FooterNav";
import { deleteExpense, duplicateExpense } from "../services/api";
import { ExpenseBox } from "../components/ExpenseBox";
import { FiFilter, FiPlus } from "react-icons/fi";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { AddNewItem } from "../components/NoItem";
import { useEffect, useState } from "react";
import { useExpenseFilter, useExpenseSearch } from "../hooks/useExpensesSearch";
import { ItemFilterPopup } from "../components/FilterComponent";
import { resetFilter } from "../services/utils";
import { getTotal } from "../services/item";
import { formatCurrency } from "../services/formatCurrency";
import { SearchBox } from "../components/SearchBox";
import { getDefaultBudgetMonthYear } from "../services/formatDate";
import { CollapsibleUpcoming } from "../components/CollapsibleUpcoming";

export function ExpensesPage() {
  const { loading, fetchExpenses, currency, user } = useItemContext();

  const { month: defaultMonth, year: defaultYear } = getDefaultBudgetMonthYear(
    user?.budgetStartDay ?? 1
  );

  const location = useLocation();

  const [query, setQuery] = useState("");

  const [showPopup, setShowPopup] = useState(false);

  const [months, setMonths] = useState<string[]>([defaultMonth]);
  const [year, setYear] = useState(defaultYear);

  const [total, setTotal] = useState(0);

  const _filterExpenses = useExpenseFilter(months, year, user.budgetStartDay);

  const filteredExpenses = useExpenseSearch(query, _filterExpenses);

  const upcomingExpenses = filteredExpenses.filter((b) => b.upcoming);
  const activeExpenses = filteredExpenses.filter((b) => !b.upcoming);

  const removeExpense = async (id: string, budgetId?: string) => {
    await deleteExpense(id, budgetId);
    await fetchExpenses();
  };

  useEffect(() => {
    if (location.state?.refresh) {
      fetchExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    window.history.replaceState({}, document.title);
  }, []);

  useEffect(() => {
    const total = getTotal(filteredExpenses);
    setTotal(total);
  }, [filteredExpenses]);

  const duplicateOldExpense = async (id: string, budgetId?: string) => {
    await duplicateExpense(id, budgetId);
    await fetchExpenses();
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900 dark:text-white px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
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

        <SearchBox query={query} setQuery={setQuery} />

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
      </div>

      <CollapsibleUpcoming
        upcomingItems={upcomingExpenses}
        currency={currency!}
        compType="Expense"
        removeExpense={removeExpense}
        duplicateExpense={duplicateOldExpense}
      />

      {filteredExpenses?.length ? (
        activeExpenses.map(
          ({ id, title, category, amount, updatedAt, budgetId, upcoming }) => (
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

      <div className="fixed bottom-24 inset-x-0 z-50">
        <div className="max-w-md mx-auto px-4 flex justify-end">
          <Link
            to="/expenses/new"
            className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
            aria-label="Add an expense"
          >
            <FiPlus className="text-2xl" />
          </Link>
        </div>
      </div>

      <FooterNav page="expenses" />
    </div>
  );
}
