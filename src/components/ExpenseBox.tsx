import { useNavigate } from "react-router-dom";
import { formatRelativeDate } from "../services/formatDate";
import { formatCurrency } from "../services/formatCurrency";
import { HiDotsVertical } from "react-icons/hi";
import { useEffect, useRef, useState } from "react";
import { CategoryComponent } from "./Category";

type ExpenseBox = {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  currency: string;
  amount: number;
  budgetId?: string;
  removeExpense: (id: string, budgetId?: string) => Promise<void>;
  duplicateExpense: (id: string, budgetId?: string) => Promise<void>;
};

export const ExpenseBox = ({
  id,
  title,
  category,
  updatedAt,
  amount,
  currency,
  budgetId,
  removeExpense,
  duplicateExpense,
}: ExpenseBox) => {
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

  return (
    <div
      key={id}
      ref={menuRef}
      className="bg-white  dark:bg-gray-900 dark:text-white dark:shadow-amber-50 rounded-xl p-4 shadow flex justify-between items-start mb-4"
      onClick={(e) => {
        e.stopPropagation();
        setShowMenu(false);
      }}
    >
      <div>
        <p className="font-semibold text-base">{title}</p>
        {<CategoryComponent category={category} />}
        <p className="text-xs text-gray-400 mt-1">
          {" "}
          {formatRelativeDate(updatedAt)}
        </p>
      </div>
      {showMenu && (
        <div className="absolute right-3.5 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md z-10">
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
                      id: budgetId,
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
          <HiDotsVertical className="h-5 w-5 text-gray-600 dark:text-white" />
        </div>
        <p className="text-lg font-bold text-gray-800 dark:text-white">
          {formatCurrency(amount, currency)}
        </p>
      </div>
    </div>
  );
};
