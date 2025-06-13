import { useEffect, useMemo, useState } from "react";
import { getBudgets, getExpenses, getUser } from "../services/api";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { ItemContext } from "../types/context";
import { getMonthlyTotal, sortItemByRecent } from "../services/item";

export type User = {
  userName?: string;
  currency?: string;
  email?: string;
};
export function ItemContextProvider(props: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [user, setUser] = useState<User>({});

  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
    fetchExpenses();
    fetchUser();
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

  const fetchUser = async () => {
    setLoading(true);

    try {
      const user = await getUser();
      setUser(user);
    } catch (error) {
      console.log({ error });
    }

    setLoading(false);
  };

  const currentMonthExpensesTotal = getMonthlyTotal(expenses);

  const recentExpenses = sortItemByRecent(expenses);

  const recentBudgets = sortItemByRecent(budgets);

  const currency = user?.currency ?? "EUR";

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
      fetchBudgets,
      user,
      currency,
    }),
    [
      budgets,
      expenses,
      loading,
      currentMonthExpensesTotal,
      recentExpenses,
      recentBudgets,
      user,
      currency,
    ]
  );

  return (
    <ItemContext.Provider value={value}>{props.children}</ItemContext.Provider>
  );
}
