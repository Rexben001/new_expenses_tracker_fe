import { Link, useLocation } from "react-router-dom";
import { FooterNav } from "../components/FooterNav";
import { deleteExpense } from "../services/api";
import { ExpenseBox } from "../components/ExpenseBox";
import { FiFilter, FiSearch, FiPlus } from "react-icons/fi";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { AddNewItem } from "../components/NoItem";
import { useEffect, useState } from "react";
import { useExpenseFilter, useExpenseSearch } from "../hooks/useExpensesSearch";
import { ItemFilterPopup } from "../components/FilterComponent";

export function ExpensesPage() {
  const { loading, fetchExpenses, currency } = useItemContext();

  const location = useLocation();

  const [query, setQuery] = useState("");

  const [showPopup, setShowPopup] = useState(false);

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const _filterExpenses = useExpenseFilter(month, year);

  const filteredExpenses = useExpenseSearch(query, _filterExpenses);

  const removeExpense = async (id: string) => {
    await deleteExpense(id);
    fetchExpenses();
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

  if (loading) return <LoadingScreen />;

  const resetFilter = () => {
    setMonth("");
    setYear("");
    setShowPopup(false);
  };
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 dark:text-white px-4 pt-6 pb-24 max-w-md mx-auto">
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
          resetFilter={resetFilter}
        />
      )}

      {filteredExpenses?.length ? (
        filteredExpenses.map(({ id, title, category, amount, updatedAt }) => (
          <ExpenseBox
            key={id}
            id={id}
            title={title}
            category={category}
            amount={amount}
            updatedAt={updatedAt}
            currency={currency!}
            removeExpense={removeExpense}
          />
        ))
      ) : (
        <AddNewItem
          url="/expenses/new"
          type="expenses"
          text="You don't have any expenses"
        />
      )}

      <Link
        to="/expenses/new"
        className="fixed bottom-20 right-6 bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700"
        aria-label="Add an expense"
      >
        <FiPlus className="text-2xl" />
      </Link>

      <FooterNav page="expenses" />
    </div>
  );
}
