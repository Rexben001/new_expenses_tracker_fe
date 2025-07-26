import { Link, useLocation } from "react-router-dom";
import { FooterNav } from "../components/FooterNav";
import { deleteExpense, duplicateExpense } from "../services/api";
import { ExpenseBox } from "../components/ExpenseBox";
import { FiFilter, FiSearch, FiPlus } from "react-icons/fi";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { AddNewItem } from "../components/NoItem";
import { useEffect, useState } from "react";
import { useExpenseFilter, useExpenseSearch } from "../hooks/useExpensesSearch";
import { ItemFilterPopup } from "../components/FilterComponent";
import { resetFilter } from "../services/utils";
import { getTotal } from "../services/item";
import { formatCurrency } from "../services/formatCurrency";

export function ExpensesPage() {
  const { loading, fetchExpenses, currency, user } = useItemContext();

  const location = useLocation();

  const [query, setQuery] = useState("");

  const [showPopup, setShowPopup] = useState(false);

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [total, setTotal] = useState(0);

  const _filterExpenses = useExpenseFilter(month, year, user.budgetStartDay);

  const filteredExpenses = useExpenseSearch(query, _filterExpenses);

  const removeExpense = async (id: string, budgetId?: string) => {
    await deleteExpense(id, budgetId);
    await fetchExpenses();
  };

  useEffect(() => {
    const period = user?.timePeriod ?? "Yearly";
    const isMonthly = period === "Monthly";

    if (isMonthly) {
      setMonth((new Date().getMonth() + 1).toString());
      setYear(new Date().getFullYear().toString());
    } else {
      setYear(new Date().getFullYear().toString());
    }
  }, [user?.timePeriod]);

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

        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search expenses by name or by category"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-10 py-2 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
        </div>

        {showPopup && (
          <ItemFilterPopup
            month={month}
            setMonth={setMonth}
            year={year}
            setYear={setYear}
            resetFilter={() => {
              resetFilter({ setMonth, setYear, setShowPopup });
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

      {filteredExpenses?.length ? (
        filteredExpenses.map(
          ({ id, title, category, amount, updatedAt, budgetId }) => (
            <ExpenseBox
              key={id}
              id={id}
              title={title}
              category={category}
              amount={amount}
              updatedAt={updatedAt}
              currency={currency!}
              budgetId={budgetId}
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
