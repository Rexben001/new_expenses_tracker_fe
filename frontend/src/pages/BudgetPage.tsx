import { Link, useLocation } from "react-router-dom";
import { FiFilter, FiSearch, FiPlus } from "react-icons/fi";
import { FooterNav } from "../components/FooterNav";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { AddNewItem } from "../components/NoItem";
import { useEffect, useState } from "react";
import { useBudgetFilter, useBudgetSearch } from "../hooks/useBudgetsSearch";
import { BudgetBox } from "../components/BudgetBox";
import { ItemFilterPopup } from "../components/FilterComponent";

export function BudgetPage() {
  const location = useLocation();

  const { loading, fetchBudgets, currency } = useItemContext();

  const [query, setQuery] = useState("");

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [showPopup, setShowPopup] = useState(false);

  const _filterBudgets = useBudgetFilter(month, year);

  const filteredBudgets = useBudgetSearch(query, _filterBudgets);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchBudgets();
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
    <div className="relative min-h-screen bg-white  dark:bg-gray-900 dark:text-white px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">
          All Budgets{" "}
          <span className="text-blue-500">({filteredBudgets.length})</span>
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
          placeholder="Search budgets by name or by category"
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

      {filteredBudgets.length ? (
        filteredBudgets.map((budget) => (
          <BudgetBox
            key={budget.id}
            budget={budget}
            currency={currency}
            showExpense={true}
          />
        ))
      ) : (
        <AddNewItem
          url="/budgets/new"
          type="budgets"
          text="You don't have any budgets"
        />
      )}

      <Link
        to="/budgets/new"
        className="absolute bottom-20 right-6 bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
        aria-label="Add an expense"
      >
        <FiPlus className="text-2xl" />
      </Link>

      <FooterNav page="budgets" />
    </div>
  );
}
