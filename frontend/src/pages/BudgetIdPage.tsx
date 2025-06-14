import { useState, useEffect, useCallback } from "react";
import { FiFilter, FiSearch, FiPlus, FiChevronLeft } from "react-icons/fi";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { deleteExpense, getExpense } from "../services/api";
import { AddNewItem } from "../components/NoItem";
import { ExpenseBox } from "../components/ExpenseBox";
import type { Expense } from "../types/expenses";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { useExpenseFilter, useExpenseSearch } from "../hooks/useExpensesSearch";
import { BudgetBox } from "../components/BudgetBox";
import { ItemFilterPopup } from "../components/FilterComponent";
import type { BUDGET_STATE } from "../types/locationState";

export function BudgetIdPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [query, setQuery] = useState("");

  const [showPopup, setShowPopup] = useState(false);

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const _filterExpenses = useExpenseFilter(month, year, expenses);

  const filteredExpenses = useExpenseSearch(query, _filterExpenses);

  const { setLoading, loading, budgets, currency } = useItemContext();

  const navigate = useNavigate();

  const { budgetId } = useParams();

  const location = useLocation();

  const state = location.state as BUDGET_STATE;

  const budget = state.title
    ? {
        ...state,
        id: budgetId ?? "",
      }
    : budgets.find((budget) => budget.id === budgetId);

  const fetchBudgetExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const expenses = await getExpense("", budgetId);

      setExpenses(expenses);
    } catch (error) {
      console.log({ error });
      setExpenses([]);
    }
    setLoading(false);
  }, [budgetId, setLoading]);

  useEffect(() => {
    fetchBudgetExpenses();
  }, [fetchBudgetExpenses]);

  const removeExpense = async (id: string, budgetId?: string) => {
    await deleteExpense(id, budgetId);
    setLoading(true);
    fetchBudgetExpenses();
    setLoading(false);
  };

  if (loading) return <LoadingScreen />;

  const resetFilter = () => {
    setMonth("");
    setYear("");
    setShowPopup(false);
  };

  return (
    <div className="min-h-screen bg-white  dark:bg-gray-900 dark:text-white px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 dark:text-white  hover:text-black"
        >
          <FiChevronLeft className="text-2xl" />
        </button>

        <h1 className="text-xl font-bold"> Budget</h1>
        <button
          className="text-gray-500 hover:text-gray-800"
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

      {budget && <BudgetBox budget={budget} currency={currency} />}

      {filteredExpenses.length ? (
        <p className="mx-4 bold mb-3">
          Expenses{" "}
          <span className="text-blue-500">({filteredExpenses.length})</span>
        </p>
      ) : null}

      {filteredExpenses.length ? (
        filteredExpenses.map(
          ({ id, title, category, amount, updatedAt }) => (
            <div key={id} className="mx-5">
              <ExpenseBox
                key={id}
                id={id}
                title={title}
                category={category}
                amount={amount || 0}
                updatedAt={updatedAt || ""}
                currency={currency!}
                removeExpense={removeExpense}
                budgetId={budgetId}
              />
            </div>
          )
        )
      ) : (
        <AddNewItem
          url="/expenses/new"
          type="expenses"
          text="No expenses allocated to this budget"
          id={budgetId}
        />
      )}

      <Link
        to="/expenses/new"
        className="fixed bottom-20 right-6 bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700"
        aria-label="Add an expense"
        state={{ id: budgetId }}
      >
        <FiPlus className="text-2xl" />
      </Link>
    </div>
  );
}
