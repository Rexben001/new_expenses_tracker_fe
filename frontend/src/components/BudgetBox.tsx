import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../services/formatCurrency";
import { formatRelativeDate } from "../services/formatDate";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { useEffect, useState } from "react";
import { getExpenses } from "../services/api";

export const BudgetBox = ({
  budget,
  currency,
}: {
  budget:
    | Budget
    | {
        category?: string;
        amount?: number;
        title?: string;
        period?: string;
        updatedAt?: string;
        currency?: string;
        id: string;
      };
  currency?: string;
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

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
  const calculateRemaining = () => {
    const budgetAmount = budget?.amount;

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return budgetAmount! - totalExpenses;
  };

  const spent = calculateRemaining();

  const { id, title, category, period, updatedAt, amount } = budget;

  return (
    <div
      key={budget.id}
      className="bg-white dark:bg-gray-900 dark:text-white dark:shadow-amber-50 rounded-xl p-4 shadow flex justify-between items-start mb-4"
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
      <div>
        <p className="font-semibold text-base">{budget?.title}</p>
        <p className="text-sm text-gray-500">Amount Remaining</p>
        <p className="text-sm text-gray-500">{budget?.category}</p>
        {/* <p className="text-xs text-gray-400 mt-1">{budget?.period}</p> */}
        <p className="text-xs text-gray-400 mt-1">
          {formatRelativeDate(budget?.updatedAt)}
        </p>
      </div>

      <div className="text-right">
        <p className="text-lg font-bold text-gray-800 dark:text-white">
          {formatCurrency(budget?.amount, currency)}
        </p>
        <p className="text-sm text-gray-500 dark:text-white">
          {" "}
          {formatCurrency(spent, currency)}
        </p>
      </div>
    </div>
  );
};
