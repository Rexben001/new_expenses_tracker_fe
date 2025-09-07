import { Link, useLocation } from "react-router-dom";
import { FiFilter, FiPlus } from "react-icons/fi";
import { FooterNav } from "../components/FooterNav";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
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

export function BudgetPage() {
  const location = useLocation();

  const { loading, fetchBudgets, currency, user } = useItemContext();

  const [query, setQuery] = useState("");

  const [total, setTotal] = useState(0);

  const [months, setMonths] = useState<string[]>([]);
  const [year, setYear] = useState("");

  const [showPopup, setShowPopup] = useState(false);

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

  const _filterBudgets = useBudgetFilter(
    months,
    year,
    user?.budgetStartDay ?? 1
  );

  const filteredBudgets = useBudgetSearch(query, _filterBudgets);

  const upcomingBudgets = filteredBudgets.filter((b) => b.upcoming);
  const activeBudgets = filteredBudgets.filter((b) => !b.upcoming);

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

  if (loading || !ready) return <LoadingScreen />;

  const resetFilter = () => {
    setMonths([]);
    setYear("");
    setShowPopup(false);
  };

  return (
    <div className="relative min-h-screen bg-white  dark:bg-gray-900 dark:text-white px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
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

        <SearchBox query={query} setQuery={setQuery} />

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
      </div>

      <CollapsibleUpcoming
        upcomingItems={upcomingBudgets}
        currency={currency!}
        compType="Budget"
      />

      {filteredBudgets.length ? (
        activeBudgets.map((budget) => (
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

      <FooterNav page="budgets" />
    </div>
  );
}
