import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../services/formatCurrency";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { useEffect, useState } from "react";
import { deleteBudget, getExpenses } from "../services/api";
import { formatRelativeDate } from "../services/formatDate";
import { useItemContext } from "../hooks/useItemContext";
import { FiEdit2, FiTrash } from "react-icons/fi";

export const BudgetBox = ({
  budget,
  currency,
  showExpense,
}: {
  budget:
    | Budget
    | {
        category?: string;
        amount?: number;
        title?: string;
        period?: string;
        updatedAt?: string;
        currency?: string;
        id: string;
      };
  currency?: string;
  showExpense?: boolean;
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const { fetchBudgets } = useItemContext();

  const [showDetails, setShowDetails] = useState(false);

  const fetchExpenses = async () => {
    try {
      const expenses = await getExpenses(budget.id);
      setExpenses(expenses);
    } catch (error) {
      console.log({ error });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const navigate = useNavigate();
  const calculateRemaining = () => {
    const budgetAmount = budget?.amount;

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return budgetAmount! - totalExpenses;
  };

  const remaining = calculateRemaining();

  const spent = budget.amount! - remaining;

  const { id, title, category, period, updatedAt, amount } = budget;

  const percent = (spent / amount!) * 100;

  const totalWidth = percent > 100 ? 100 : percent;

  const progressBarClass =
    percent > 90
      ? "bg-red-500 h-2 rounded-full"
      : "bg-blue-500 h-2 rounded-full";

  return (
    <div
      key={budget.id}
      className="bg-white dark:bg-gray-900 dark:shadow-amber-50 rounded-2xl shadow p-5 flex justify-between items-start mb-6 cursor-pointer"
    >
      {/* Left Content */}
      <div className="flex-1">
        <div className="flex justify-between">
          <div>
            <p className="font-bold text-lg mb-1">{budget?.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {budget?.category}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatRelativeDate(budget?.updatedAt)}
            </p>
          </div>
          <div className="flex flex-col items-end ml-4">
            <div className="flex gap-3 mb-4">
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={async (e) => {
                  e.stopPropagation();
                  navigate(`/budgets/${id}/edit`, {
                    state: {
                      category,
                      amount,
                      title,
                      updatedAt,
                      currency,
                      id,
                    },
                  });
                }}
              >
                <FiEdit2 />
              </button>

              <button
                className="text-red-500 hover:text-red-700"
                onClick={async (e) => {
                  e.stopPropagation();
                  await deleteBudget(budget.id);
                  await fetchBudgets();
                }}
              >
                <FiTrash />
              </button>
            </div>

            <p className="text-xl font-bold text-black dark:text-white">
              {formatCurrency(amount, currency)}
            </p>
          </div>
        </div>

        {showDetails && (
          <>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-3 mb-3">
              <div
                className={progressBarClass}
                style={{ width: `${totalWidth}%` }}
              />
            </div>

            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <div>
                <p>Spent</p>
                <p className="font-bold text-black dark:text-white">
                  {formatCurrency(spent, currency)}
                </p>
              </div>
              <div className="text-right">
                <p>Remaining</p>
                <p className="font-bold text-black dark:text-white">
                  {formatCurrency(amount! - spent, currency)}
                </p>
              </div>
            </div>
          </>
        )}

        {showDetails && showExpense && (
          <div
            className="mt-4 flex justify-end items-center text-sm text-black dark:text-white hover:underline font-bold"
            onClick={() => {
              navigate(`/budgets/${id}`, {
                state: {
                  title,
                  category,
                  period,
                  updatedAt,
                  amount,
                  currency,
                },
              });
            }}
          >
            <p className="mr-1 text-blue-500">View expenses</p>
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        )}

        <div className="mt-2 flex justify-center">
          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className="flex items-center text-sm text-blue-400 hover:underline"
          >
            {showDetails ? "See less" : "See more"}
            <svg
              className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                showDetails ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
