import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../services/formatCurrency";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { useCallback, useEffect, useRef, useState } from "react";
import { duplicateBudget, getExpenses, updateBudget } from "../services/api";
import { formatRelativeDate } from "../services/formatDate";
import { useItemContext } from "../hooks/useItemContext";
import { calculateRemaining } from "../services/item";
import { HiDotsVertical } from "react-icons/hi";
import { CategoryComponent } from "./Category";
import { UpcomingBox } from "./UpcomingBox";
import {
  FiCalendar,
  FiChevronDown,
  FiCopy,
  FiEdit2,
  FiRefreshCcw,
  FiStar,
  FiTrash2,
} from "react-icons/fi";

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

  const percent = budget.amount ? (spent / budget.amount) * 100 : 0;
  const clampedPercent = Math.max(0, Math.min(percent, 100));

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
    <article
      key={budget.id}
      ref={menuRef}
      className="relative mb-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900"
      onClick={(e) => {
        e.stopPropagation();
        setShowMenu(false);
      }}
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 bg-white accent-blue-600 dark:border-gray-700 dark:bg-gray-900"
          checked={selected}
          onChange={() => onSelect?.(budget.id)}
          hidden={!selectMode}
        />

        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-gray-950 dark:text-gray-50">
                  {budget?.title}
                </p>
                {isRecurring && (
                  <FiRefreshCcw className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                )}
                <button
                  type="button"
                  aria-label={favorite ? "Unfavorite" : "Favorite"}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof updateFavorites === "function")
                      updateFavorites(id, !favorite)!;
                  }}
                  className={`rounded-full p-0.5 text-amber-400 transition ${
                    favorite ? "opacity-100" : "opacity-40 hover:opacity-75"
                  }`}
                >
                  <FiStar
                    className="h-4 w-4"
                    fill={favorite ? "currentColor" : "none"}
                />
                </button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <CategoryComponent
                  category={budget?.category ?? ""}
                  isUpcoming={budget.upcoming}
                />
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <FiCalendar className="h-3 w-3" />
                  {formatRelativeDate(budget?.updatedAt)}
                </span>
              </div>
            </div>
            {showMenu && (
              <div className="absolute right-3 top-10 z-100 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <ul className="text-sm text-gray-700 dark:text-white">
                  <li>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
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
                      <FiEdit2 className="h-4 w-4" />
                      Edit
                    </button>
                  </li>
                  <li>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await removeBudget(budget.id);
                        setShowMenu(false);
                      }}
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </li>

                  <li>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        if (typeof updateFavorites === "function")
                          updateFavorites(id, !favorite)!;
                        setShowMenu(false);
                      }}
                    >
                      <FiStar className="h-4 w-4" />
                      {favorite ? "Unfavorite" : "Favorite"}
                    </button>
                  </li>
                  <li>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        const subId = await getSubAccountId();
                        await duplicateBudget(budget.id, false, subId);

                        await fetchBudgets(subId);
                      }}
                    >
                      <FiCopy className="h-4 w-4" />
                      Copy All
                    </button>
                  </li>
                  <li>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        const subId = await getSubAccountId();
                        await duplicateBudget(budget.id, true, subId);
                        await fetchBudgets();
                      }}
                    >
                      <FiCopy className="h-4 w-4" />
                      Copy Budget Only
                    </button>
                  </li>
                </ul>
              </div>
            )}

            <div className="shrink-0 text-right">
              <button
                type="button"
                className="ml-auto grid h-7 w-7 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((open) => !open);
                }}
              >
                <HiDotsVertical className="h-4 w-4" />
              </button>

              <p className={`mt-1 text-base font-bold ${textColorClass}`}>
                {formatCurrency(amount, currency)}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-full rounded-full ${
                  percent > 95
                    ? "bg-red-500"
                    : percent > 60
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${clampedPercent}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{Math.round(percent)}% used</span>
              <span>{formatCurrency(remaining, currency)} left</span>
            </div>
          </div>

          {showDetails && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
              <div className="rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">Spent</p>
                <p className="font-semibold text-gray-950 dark:text-gray-50">
                  {formatCurrency(spent, currency)}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">Remaining</p>
                <p className="font-semibold text-gray-950 dark:text-gray-50">
                  {formatCurrency(remaining, currency)}
                </p>
              </div>
            </div>
          )}

          {showDetails && showExpense && (
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-end text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300"
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
              <span className="mr-1">View expenses</span>
              <svg
                className="h-4 w-4"
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
            </button>
          )}

          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300"
            >
              {showDetails ? "See less" : "See more"}
              <FiChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  showDetails ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

// TODO: Add an icon for recurring items
