import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../services/formatCurrency";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { useCallback, useEffect, useRef, useState } from "react";
import { duplicateBudget, getExpenses, updateBudget } from "../services/api";
import { formatRelativeDate } from "../services/formatDate";
import { useItemContext } from "../hooks/useItemContext";
import { ProgressBar } from "./ProgressBar";
import { calculateRemaining } from "../services/item";
import { HiDotsVertical } from "react-icons/hi";
import { CategoryComponent } from "./Category";
import { UpcomingBox } from "./UpcomingBox";
import { FiStar, FiRefreshCcw } from "react-icons/fi";

export const BudgetBox = ({
  budget,
  currency,
  showExpense,
  removeBudget,
  updateFavorites,
  selectMode,
  selected,
  onSelect,
}: {
  budget: Budget;
  currency?: string;
  showExpense?: boolean;
  removeBudget: (id: string) => Promise<void>;
  updateFavorites?: (id: string, favorite: boolean) => Promise<void>;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const { fetchBudgets, getSubAccountId } = useItemContext();

  const [showDetails, setShowDetails] = useState(false);

  const [remaining, setRemaining] = useState(0);

  const [spent, setSpent] = useState(0);

  useEffect(() => {
    const rem = calculateRemaining(budget.amount, expenses);
    setRemaining(rem);
    setSpent(budget.amount! - rem);
  }, [budget, expenses]);

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

  const fetchExpenses = useCallback(async () => {
    try {
      const subId = await getSubAccountId();
      const expenses = await getExpenses(budget.id, subId);

      setExpenses(expenses);
    } catch (error) {
      console.log({ error });
    }
  }, [budget.id, getSubAccountId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const navigate = useNavigate();

  const {
    id,
    title,
    category,
    isRecurring,
    updatedAt,
    amount,
    upcoming,
    favorite,
  } = budget;

  const bgColor = upcoming
    ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-700 cursor-not-allowed"
    : "bg-white dark:bg-gray-900 dark:shadow-amber-50 text-black dark:text-white";

  const textColor = upcoming
    ? "text-gray-250 dark:text-gray-500"
    : "text-black dark:text-white";

  const updateItem = async () => {
    const subId = await getSubAccountId();
    await updateBudget(
      id,
      {
        amount,
        id,
        upcoming: false,
        title,
        category,
        updatedAt,
        currency,
      },
      subId
    );
    window.location.reload();
  };

  const percent = (spent / budget.amount!) * 100;

  const textColorClass =
    percent > 95
      ? "text-red-500"
      : percent > 60
      ? "text-yellow-500"
      : "text-green-500";

  if (upcoming) {
    return (
      <UpcomingBox
        amount={amount}
        title={title}
        updatedAt={updatedAt}
        updateItem={updateItem}
        currency={currency}
        selectMode={selectMode}
        selected={selected}
        onSelect={onSelect}
        id={id}
        budgetId={undefined}
      />
    );
  }

  return (
    <div
      key={budget.id}
      ref={menuRef}
      className={`rounded-2xl shadow p-5 flex justify-between items-start mb-6 cursor-pointer 
    ${bgColor}`}
      onClick={(e) => {
        e.stopPropagation();
        setShowMenu(false);
      }}
    >
      <input
        type="checkbox"
        className="mt-1 mr-3 w-4 h-4 cursor-pointer"
        checked={selected}
        onChange={() => onSelect?.(budget.id)}
        hidden={!selectMode}
      />

      <div className="flex-1">
        <div className="flex justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className={`font-bold text-lg mb-1 ${textColor}`}>
                {budget?.title}
              </p>
              <FiRefreshCcw
                className={`w-4 h-4 ${
                  isRecurring
                    ? "text-blue-500"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              />
              <button
                type="button"
                aria-label={favorite ? "Unfavorite" : "Favorite"}
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof updateFavorites === "function")
                    updateFavorites(id, !favorite)!;
                }}
                className={`transition p-0.5 rounded-full text-yellow-400 ${
                  favorite ? "opacity-100" : "opacity-30 hover:opacity-60"
                }`}
              >
                <FiStar
                  className="w-4 h-4"
                  fill={favorite ? "currentColor" : "none"}
                />
              </button>
            </div>
            {
              <CategoryComponent
                category={budget?.category ?? ""}
                isUpcoming={budget.upcoming}
              />
            }

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatRelativeDate(budget?.updatedAt)}
            </p>
          </div>
          {showMenu && (
            <div className="absolute right-3.5 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md z-100">
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
                          upcoming,
                          isRecurring,
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
                      await removeBudget(budget.id);
                      setShowMenu(false);
                    }}
                  >
                    Delete
                  </button>
                </li>

                <li>
                  <button
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={() => {
                      if (typeof updateFavorites === "function")
                        updateFavorites(id, !favorite)!;
                      setShowMenu(false);
                    }}
                  >
                    {favorite ? " Remove from Favorites" : " Add to Favorites"}
                  </button>
                </li>
                <li>
                  <button
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      const subId = await getSubAccountId();
                      await duplicateBudget(budget.id, false, subId);

                      await fetchBudgets(subId);

                      // window.location.reload();
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
                      const subId = await getSubAccountId();
                      await duplicateBudget(budget.id, true, subId);
                      await fetchBudgets();
                      // window.location.reload();
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
                <HiDotsVertical className={`h-5 w-5 ${textColor}`} />
              </div>
            </div>

            <p className={`text-lg font-bold ${textColorClass}`}>
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
              isRecurring: budget.isRecurring ?? false,
              updatedAt: budget.updatedAt ?? "",
              currency: budget.currency ?? "",
            }}
            remaining={remaining}
            currency={currency!}
          />
        )}

        {showDetails && showExpense && (
          <div
            className={`mt-4 flex justify-end items-center text-sm ${textColor} hover:underline font-bold`}
            onClick={() => {
              navigate(`/budgets/${id}`, {
                state: {
                  title,
                  category,
                  isRecurring: isRecurring?.toString(),
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

// TODO: Add an icon for recurring items
