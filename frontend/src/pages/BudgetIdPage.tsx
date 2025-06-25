import { useState, useEffect, useCallback } from "react";
import { FiFilter, FiSearch, FiPlus, FiChevronLeft } from "react-icons/fi";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { deleteExpense, duplicateExpense, getExpense } from "../services/api";
import { AddNewItem } from "../components/NoItem";
import { ExpenseBox } from "../components/ExpenseBox";
import type { Expense } from "../types/expenses";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { useExpenseFilter, useExpenseSearch } from "../hooks/useExpensesSearch";
import { ItemFilterPopup } from "../components/FilterComponent";
import type { BUDGET_STATE } from "../types/locationState";
import { resetFilter } from "../services/utils";
import { FooterNav } from "../components/FooterNav";
import { formatCurrency } from "../services/formatCurrency";
import { calculateRemaining, getTotal } from "../services/item";
import { ProgressBar } from "../components/ProgressBar";

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

  const [total, setTotal] = useState(0);

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
    await fetchBudgetExpenses();
  };

  const duplicateOldExpense = async (id: string, budgetId?: string) => {
    await duplicateExpense(id, budgetId);
    await fetchBudgetExpenses();
  };

  useEffect(() => {
    if (!budget?.title) {
      navigate("/budgets");
    }
  }, [budget, navigate]);

  useEffect(() => {
    const total = getTotal(filteredExpenses);
    setTotal(total);
  }, [filteredExpenses]);

  const remaining = calculateRemaining(budget?.amount ?? 0, expenses);

  if (loading) return <LoadingScreen />;

  const displayTitle = () => {
    const title = budget?.title;

    const hasBudget = title?.includes("budget");

    return hasBudget ? title : `${title} Budget`;
  };

  return (
    <div className="relative min-h-screen bg-white  dark:bg-gray-900 dark:text-white px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/budgets")}
            className="text-gray-600 dark:text-white  hover:text-black"
          >
            <FiChevronLeft className="text-2xl" />
          </button>

          <h1 className="text-xl font-bold"> {displayTitle()}</h1>
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
        {budget && (
          <div className="bg-white dark:bg-gray-900 dark:shadow-amber-50 rounded-2xl shadow p-5 flex justify-between items-start mb-6 cursor-pointer">
            <div className="flex-1">
              <p>Overall Budget Progress</p>
              <ProgressBar
                budget={{
                  ...budget,
                  title: budget.title ?? "",
                  category: budget.category ?? "",
                  amount: budget.amount ?? 0,
                  period: budget.period ?? "",
                  updatedAt: budget.updatedAt ?? "",
                  currency: budget.currency ?? "",
                }}
                remaining={remaining}
                currency={currency!}
              />
            </div>
          </div>
        )}

        {filteredExpenses.length ? (
          <p className="mx-4 bold mb-3">
            Expenses{" "}
            <span className="text-blue-500">({filteredExpenses.length})</span>
          </p>
        ) : null}
      </div>

      {filteredExpenses.length ? (
        filteredExpenses.map(({ id, title, category, amount, updatedAt }) => (
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
              duplicateExpense={duplicateOldExpense}
            />
          </div>
        ))
      ) : (
        <AddNewItem
          url="/expenses/new"
          type="expenses"
          text="No expenses allocated to this budget"
          id={budgetId}
        />
      )}

      <div className="fixed bottom-20 right-0 z-20 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto px-4">
          <Link
            to="/expenses/new"
            className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
            aria-label="Add an expense"
            state={{ id: budgetId }}
          >
            <FiPlus className="text-2xl" />
          </Link>
        </div>
      </div>

      <FooterNav page="budgets" />
    </div>
  );
}
