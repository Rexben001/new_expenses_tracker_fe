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
      className="stacked-card stacked-card--budget mb-6 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setShowMenu(false);
      }}
    >
      <div className="stacked-card__panel flex items-start gap-3 p-5">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-slate-900/40 accent-cyan-300"
          checked={selected}
          onChange={() => onSelect?.(budget.id)}
          hidden={!selectMode}
        />

        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="stacked-card__title mb-1 truncate font-bold text-lg">
                  {budget?.title}
                </p>
                <FiRefreshCcw
                  className={`h-4 w-4 ${
                    isRecurring ? "text-cyan-300" : "stacked-card__icon opacity-35"
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
                  className={`rounded-full p-0.5 text-amber-300 transition ${
                    favorite ? "opacity-100" : "opacity-35 hover:opacity-65"
                  }`}
                >
                  <FiStar
                    className="h-4 w-4"
                    fill={favorite ? "currentColor" : "none"}
                  />
                </button>
              </div>
              <CategoryComponent
                category={budget?.category ?? ""}
                isUpcoming={budget.upcoming}
              />

              <p className="stacked-card__muted mt-2 text-sm">
                {formatRelativeDate(budget?.updatedAt)}
              </p>
            </div>
            {showMenu && (
              <div className="absolute right-4 top-14 z-100 w-36 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <ul className="text-sm text-gray-700 dark:text-white">
                  <li>
                    <button
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
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
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
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
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
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
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        const subId = await getSubAccountId();
                        await duplicateBudget(budget.id, false, subId);

                        await fetchBudgets(subId);
                      }}
                    >
                      Copy All
                    </button>
                  </li>
                  <li>
                    <button
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        const subId = await getSubAccountId();
                        await duplicateBudget(budget.id, true, subId);
                        await fetchBudgets();
                      }}
                    >
                      Copy Budget Only
                    </button>
                  </li>
                </ul>
              </div>
            )}

            <div className="ml-4 flex flex-col items-end">
              <div className="text-right">
                <div
                  className="flex justify-end"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(true);
                  }}
                >
                  <HiDotsVertical className="stacked-card__icon h-5 w-5" />
                </div>
              </div>

              <p className={`text-lg font-bold ${textColorClass}`}>
                {formatCurrency(amount, currency)}
              </p>
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 border-t border-white/10 pt-4">
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
            </div>
          )}

          {showDetails && showExpense && (
            <div
              className="stacked-card__link mt-4 flex items-center justify-end text-sm font-bold hover:underline"
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
              <p className="mr-1">View expenses</p>
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
            </div>
          )}

          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowDetails((prev) => !prev)}
              className="stacked-card__link flex items-center text-sm hover:underline"
            >
              {showDetails ? "See less" : "See more"}
              <svg
                className={`ml-1 h-4 w-4 transition-transform duration-200 ${
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
    </div>
  );
};

// TODO: Add an icon for recurring items
