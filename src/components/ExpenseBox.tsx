import { useNavigate } from "react-router-dom";
import { formatRelativeDate } from "../services/formatDate";
import { formatCurrency } from "../services/formatCurrency";
import { HiDotsVertical } from "react-icons/hi";
import { useEffect, useRef, useState } from "react";
import { CategoryComponent } from "./Category";
import { UpcomingBox } from "./UpcomingBox";
import { updateExpense } from "../services/api";
import { FiCalendar, FiCopy, FiEdit2, FiRefreshCcw, FiStar, FiTrash2 } from "react-icons/fi";
import { tokenStore } from "../services/tokenStore";

export interface IExpenseBox {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  currency: string;
  amount: number;
  budgetId?: string;
  upcoming?: boolean;
  favorite?: boolean;
  isRecurring?: boolean;
  removeExpense: (id: string, budgetId?: string) => Promise<void>;
  duplicateExpense: (id: string, budgetId?: string) => Promise<void>;
  updateFavorites?: (
    id: string,
    budgetId: string,
    favorite: boolean
  ) => Promise<void>;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string, budgetId: string) => void;
}

export const ExpenseBox = ({
  id,
  title,
  category,
  updatedAt,
  amount,
  currency,
  budgetId,
  upcoming,
  removeExpense,
  favorite,
  duplicateExpense,
  updateFavorites,
  isRecurring,
  selectMode,
  selected,
  onSelect,
}: IExpenseBox) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const updateItem = async () => {
    const subId = (await tokenStore.get("subAccountId")) || undefined;
    await updateExpense(
      id,
      {
        amount,
        id,
        upcoming: false,
        title,
        category,
        updatedAt: new Date().toISOString(),
        currency,
        budgetId,
      },
      budgetId,
      subId
    );
    window.location.reload();
  };

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
        budgetId={budgetId}
      />
    );
  }

  return (
    <article
      key={id}
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
          onChange={() => onSelect?.(id, budgetId!)}
          hidden={!selectMode}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-gray-950 dark:text-gray-50">
              {title}
            </p>
            {isRecurring && <FiRefreshCcw className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
            <button
              type="button"
              aria-label={favorite ? "Unfavorite" : "Favorite"}
              onClick={(e) => {
                e.stopPropagation();
                if (typeof updateFavorites === "function")
                  updateFavorites(id, budgetId!, !favorite);
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
            <CategoryComponent category={category} isUpcoming={upcoming} />
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <FiCalendar className="h-3 w-3" />
              {formatRelativeDate(updatedAt)}
            </span>
          </div>
        </div>
        {showMenu && (
          <div className="absolute right-3 top-10 z-100 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <ul className="text-sm text-gray-700 dark:text-white">
              <li>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    navigate(`/expenses/${id}/edit`, {
                      state: {
                        title,
                        category,
                        updatedAt,
                        amount,
                        currency,
                        upcoming,
                        id: budgetId,
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
                  onClick={() => {
                    removeExpense(id, budgetId);
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
                    duplicateExpense(id, budgetId);
                    setShowMenu(false);
                  }}
                >
                  <FiCopy className="h-4 w-4" />
                  Duplicate
                </button>
              </li>
              <li>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    if (typeof updateFavorites === "function")
                      updateFavorites(id, budgetId!, !favorite);
                    setShowMenu(false);
                  }}
                >
                  <FiStar className="h-4 w-4" />
                  {favorite ? "Unfavorite" : "Favorite"}
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
          <p className="mt-1 text-base font-bold text-gray-950 dark:text-gray-50">
            {formatCurrency(amount, currency)}
          </p>
        </div>
      </div>
    </article>
  );
};
