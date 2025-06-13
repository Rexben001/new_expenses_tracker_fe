import { useState, useEffect, useCallback } from "react";
import { FiFilter, FiSearch, FiPlus, FiChevronLeft } from "react-icons/fi";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { deleteExpense, getExpense } from "../services/api";
import { formatCurrency } from "../services/formatCurrency";
import { formatRelativeDate } from "../services/formatDate";
import { AddNewItem } from "../components/NoItem";
import { ExpenseBox } from "../components/ExpenseBox";
import type { Expense } from "../types/expenses";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { useExpenseSearch } from "../hooks/useExpensesSearch";

export function BudgetIdPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [query, setQuery] = useState("");

  const filteredExpenses = useExpenseSearch(query, expenses);

  const { setLoading, loading } = useItemContext();

  const navigate = useNavigate();

  const { budgetId } = useParams();

  const location = useLocation();

  const state = location.state as {
    category?: string;
    amount?: number;
    title?: string;
    period?: string;
    updatedAt?: string;
    currency?: string;
  };

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

  const calculateRemaining = () => {
    const budgetAmount = state?.amount;

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return budgetAmount! - totalExpenses;
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-black"
        >
          <FiChevronLeft className="text-2xl" />
        </button>

        <h1 className="text-xl font-bold"> Budget</h1>
        <button className="text-gray-500 hover:text-gray-800">
          <FiFilter className="text-xl" />
        </button>
      </div>

      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search expenses"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-10 py-2 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
      </div>

      <div
        key={budgetId}
        className="bg-white rounded-xl p-4 shadow flex justify-between items-start mb-4"
      >
        <div>
          <p className="font-semibold text-base">{state?.title}</p>
          <p className="text-sm text-gray-500">{state?.category}</p>
          <p className="text-xs text-gray-400 mt-1">{state?.period}</p>
          <p className="text-xs text-gray-400 mt-1">
            {formatRelativeDate(state?.updatedAt)}
          </p>
          <p>Amount remaining: {formatCurrency(calculateRemaining())}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-800">
            {formatCurrency(state?.amount, state?.currency || "EUR")}
          </p>
        </div>
      </div>

      {filteredExpenses.length ? <p className="mx-4">Expenses</p> : null}

      {filteredExpenses.length ? (
        filteredExpenses.map(
          ({ id, title, category, amount, updatedAt, currency }) => (
            <div className="mx-5">
              <ExpenseBox
                key={id}
                id={id}
                title={title}
                category={category}
                amount={amount || 0}
                updatedAt={updatedAt || ""}
                currency={currency}
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
        aria-label="Add Expense"
        state={{ id: budgetId }}
      >
        <FiPlus className="text-2xl" />
      </Link>
    </div>
  );
}
