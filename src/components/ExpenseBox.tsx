import { useNavigate } from "react-router-dom";
import { formatRelativeDate } from "../services/formatDate";
import { formatCurrency } from "../services/formatCurrency";
import { HiDotsVertical } from "react-icons/hi";
import { useEffect, useRef, useState } from "react";
import { CategoryComponent } from "./Category";
import { UpcomingBox } from "./UpcomingBox";
import { updateExpense } from "../services/api";
import { FiRefreshCcw, FiStar } from "react-icons/fi";
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
    <div
      key={id}
      ref={menuRef}
      className="stacked-card stacked-card--expense mb-4"
      onClick={(e) => {
        e.stopPropagation();
        setShowMenu(false);
      }}
    >
      <div className="stacked-card__panel flex items-start gap-3 p-4">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-slate-900/40 accent-teal-300"
          checked={selected}
          onChange={() => onSelect?.(id, budgetId!)}
          hidden={!selectMode}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="stacked-card__title truncate font-semibold text-base">
              {title}
            </p>
            <FiRefreshCcw
              className={`h-4 w-4 ${
                isRecurring ? "text-teal-300" : "stacked-card__icon opacity-35"
              }`}
            />
            <button
              type="button"
              aria-label={favorite ? "Unfavorite" : "Favorite"}
              onClick={(e) => {
                e.stopPropagation();
                if (typeof updateFavorites === "function")
                  updateFavorites(id, budgetId!, !favorite);
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
          <CategoryComponent category={category} isUpcoming={upcoming} />
          <p className="stacked-card__muted mt-2 text-xs">
            {formatRelativeDate(updatedAt)}
          </p>
        </div>
        {showMenu && (
          <div className="absolute right-4 top-12 z-100 w-36 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <ul className="text-sm text-gray-700 dark:text-white">
              <li>
                <button
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  Edit
                </button>
              </li>
              <li>
                <button
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    removeExpense(id, budgetId);
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
                    duplicateExpense(id, budgetId);
                    setShowMenu(false);
                  }}
                >
                  Duplicate
                </button>
              </li>
              <li>
                <button
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    if (typeof updateFavorites === "function")
                      updateFavorites(id, budgetId!, !favorite);
                    setShowMenu(false);
                  }}
                >
                  {favorite ? " Remove from Favorites" : " Add to Favorites"}
                </button>
              </li>
            </ul>
          </div>
        )}
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
          <p className="stacked-card__amount text-lg font-bold">
            {formatCurrency(amount, currency)}
          </p>
        </div>
      </div>
    </div>
  );
};
