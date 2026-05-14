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
        <div className="stacked-card stacked-card--upcoming">
          <button
            onClick={() => setShowUpcoming((s) => !s)}
            className="stacked-card__panel flex w-full items-center justify-between px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="stacked-card__title font-semibold">Upcoming</span>
              <span className="stacked-card__muted">({upcomingItems.length})</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="stacked-card__amount font-semibold">
                {formatCurrency(totalUpcoming, currency)}
              </span>
              <FiChevronDown
                className={`stacked-card__icon h-4 w-4 transition-transform ${
                  showUpcoming ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>
          </button>
        </div>

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
