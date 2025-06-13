import { useEffect, useMemo, useState } from "react";
import { getBudgets, getExpenses } from "../services/api";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { ItemContext } from "../types/context";
import { getMonthlyTotal, sortItemByRecent } from "../services/item";

export function ItemContextProvider(props: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
    fetchExpenses();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const budgets = await getBudgets();
      setBudgets(budgets);
    } catch (error) {
      console.log({ error });
    }

    setLoading(false);
  };

  const fetchExpenses = async () => {
    setLoading(true);

    try {
      const expenses = await getExpenses();
      setExpenses(expenses);
    } catch (error) {
      console.log({ error });
    }

    setLoading(false);
  };

  const currentMonthExpensesTotal = getMonthlyTotal(expenses);

  const recentExpenses = sortItemByRecent(expenses);

  const recentBudgets = sortItemByRecent(budgets);

  const value = useMemo(
    () => ({
      budgets,
      expenses,
      setBudgets,
      setExpenses,
      loading,
      setLoading,
      currentMonthExpensesTotal,
      recentExpenses,
      recentBudgets,
      fetchExpenses,
    }),
    [
      budgets,
      expenses,
      loading,
      currentMonthExpensesTotal,
      recentExpenses,
      recentBudgets,
    ]
  );

  return (
    <ItemContext.Provider value={value}>{props.children}</ItemContext.Provider>
  );
}
