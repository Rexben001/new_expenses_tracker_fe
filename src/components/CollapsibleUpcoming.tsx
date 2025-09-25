import { useState } from "react";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { formatCurrency } from "../services/formatCurrency";
import { getTotal } from "../services/item";
import { FiChevronDown } from "react-icons/fi";
import { ExpenseBox } from "./ExpenseBox";
import { BudgetBox } from "./BudgetBox";

type CompType = "Budget" | "Expense";

export const CollapsibleUpcoming = ({
  upcomingItems,
  currency,
  compType,
  removeExpense,
  duplicateExpense,
  removeBudget,
  show = false,
}: {
  upcomingItems: Budget[] | Expense[];
  currency: string;
  compType: CompType;
  show?: boolean;
  removeExpense?: (id: string, budgetId?: string) => Promise<void>;
  removeBudget?: (id: string) => Promise<void>;
  duplicateExpense?: (id: string, budgetId?: string) => Promise<void>;
}) => {
  const [showUpcoming, setShowUpcoming] = useState(show);

  const totalUpcoming = getTotal(upcomingItems, false);

  return (
    upcomingItems.length > 0 && (
      <div className="mb-4">
        <button
          onClick={() => setShowUpcoming((s) => !s)}
          className="w-full flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">Upcoming</span>
            <span className="text-gray-500 dark:text-gray-400">
              ({upcomingItems.length})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-700 dark:text-gray-200 font-semibold">
              {formatCurrency(totalUpcoming, currency)}
            </span>
            <FiChevronDown
              className={`h-4 w-4 transition-transform ${
                showUpcoming ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
        </button>

        {/* Collapsible content */}
        <div
          className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${
            showUpcoming ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-3">
            {upcomingItems.map((item) => {
              return compType === "Expense" ? (
                <ExpenseBoxWrapper
                  key={item.id}
                  expense={item as Expense}
                  currency={currency}
                  removeExpense={removeExpense!}
                  duplicateExpense={duplicateExpense!}
                />
              ) : (
                <BudgetBox
                  key={item.id}
                  budget={item as Budget}
                  currency={currency}
                  showExpense={true}
                  removeBudget={removeBudget!}
                />
              );
            })}
          </div>
        </div>
      </div>
    )
  );
};

const ExpenseBoxWrapper = ({
  expense,
  currency,
  removeExpense,
  duplicateExpense,
}: {
  expense: Expense;
  currency: string;
  removeExpense: (id: string, budgetId?: string) => Promise<void>;
  duplicateExpense: (id: string, budgetId?: string) => Promise<void>;
}) => {
  const { id, title, category, amount, updatedAt, budgetId, upcoming } =
    expense;
  return (
    <ExpenseBox
      key={id}
      id={id}
      title={title}
      category={category}
      amount={amount}
      updatedAt={updatedAt}
      currency={currency!}
      budgetId={budgetId}
      upcoming={upcoming}
      removeExpense={removeExpense}
      duplicateExpense={duplicateExpense}
    />
  );
};
