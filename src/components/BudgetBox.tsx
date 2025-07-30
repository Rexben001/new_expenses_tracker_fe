import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../services/formatCurrency";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { useEffect, useRef, useState } from "react";
import { deleteBudget, duplicateBudget, getExpenses } from "../services/api";
import { formatRelativeDate } from "../services/formatDate";
import { useItemContext } from "../hooks/useItemContext";
import { ProgressBar } from "./ProgressBar";
import { calculateRemaining } from "../services/item";
import { HiDotsVertical } from "react-icons/hi";
import { CategoryComponent } from "./Category";

export const BudgetBox = ({
  budget,
  currency,
  showExpense,
}: {
  budget: Budget;
  currency?: string;
  showExpense?: boolean;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const { fetchBudgets } = useItemContext();

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

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

  const { id, title, category, period, updatedAt, amount } = budget;

  const remaining = calculateRemaining(budget.amount, expenses);

  return (
    <div
      key={budget.id}
      ref={menuRef}
      className="bg-white dark:bg-gray-900 dark:shadow-amber-50 rounded-2xl shadow p-5 flex justify-between items-start mb-6 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setShowMenu(false);
      }}
    >
      {/* Left Content */}

      <div className="flex-1">
        <div className="flex justify-between">
          <div>
            <p className="font-bold text-lg mb-1">{budget?.title}</p>
            {<CategoryComponent category={budget?.category ?? ""} />}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatRelativeDate(budget?.updatedAt)}
            </p>
          </div>
          {showMenu && (
            <div className="absolute right-3.5 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md z-10">
              <ul className="text-sm text-gray-700 dark:text-white">
                <li>
                  <button
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
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
                    Edit
                  </button>
                </li>
                <li>
                  <button
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deleteBudget(budget.id);
                      await fetchBudgets();
                      setShowMenu(false);
                    }}
                  >
                    Delete
                  </button>
                </li>
                <li>
                  <button
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      await duplicateBudget(budget.id);
                      await fetchBudgets();
                    }}
                  >
                    Copy All
                  </button>
                </li>
                <li>
                  <button
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      await duplicateBudget(budget.id, true);
                      await fetchBudgets();
                    }}
                  >
                    Copy Budget Only
                  </button>
                </li>
              </ul>
            </div>
          )}

          <div className="flex flex-col items-end ml-4">
            <div className="text-right">
              <div
                className="flex justify-end"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(true);
                }}
              >
                <HiDotsVertical className="h-5 w-5 text-gray-600 dark:text-white" />
              </div>
            </div>

            <p className="text-xl font-bold text-black dark:text-white">
              {formatCurrency(amount, currency)}
            </p>
          </div>
        </div>

        {showDetails && (
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
