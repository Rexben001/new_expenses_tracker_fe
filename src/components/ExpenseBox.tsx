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

  const bgColor = upcoming
    ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-700 cursor-not-allowed"
    : "bg-white dark:bg-gray-900 dark:shadow-amber-50 text-black dark:text-white";

  const textColor = upcoming
    ? "text-gray-250 dark:text-gray-500"
    : "text-black dark:text-white";

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
      className={`bg-white dark:text-white dark:shadow-amber-50 rounded-xl p-4 shadow flex justify-between items-start mb-4
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
        onChange={() => onSelect?.(id, budgetId!)}
        hidden={!selectMode}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-base ${textColor}`}>{title}</p>
          <FiRefreshCcw
            className={`w-4 h-4 ${
              isRecurring ? "text-blue-500" : "text-gray-300 dark:text-gray-600"
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
            className={`transition p-0.5 rounded-full text-yellow-400 ${
              favorite ? "opacity-100" : "opacity-30 hover:opacity-60"
            }`}
          >
            <FiStar
              className="w-4 h-4"
              fill={favorite ? "currentColor" : "none"}
            />
          </button>
        </div>{" "}
        {<CategoryComponent category={category} isUpcoming={upcoming} />}
        <p className="text-xs text-gray-400 mt-1">
          {" "}
          {formatRelativeDate(updatedAt)}
        </p>
      </div>
      {showMenu && (
        <div className="absolute right-3.5 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md z-100">
          <ul className="text-sm text-gray-700 dark:text-white">
            <li>
              <button
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
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
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
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
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
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
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
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
          <HiDotsVertical className={`h-5 w-5 ${textColor}`} />
        </div>
        <p className={`text-lg font-bold ${textColor}`}>
          {formatCurrency(amount, currency)}
        </p>
      </div>
    </div>
  );
};
