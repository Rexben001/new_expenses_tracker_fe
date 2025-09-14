import { useEffect, useMemo, useState } from "react";
import { getBudgets, getExpenses, getUser } from "../services/api";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { ItemContext } from "../types/context";
import { getMonthlyTotal, getYearlyTotally } from "../services/item";
import { Capacitor } from "@capacitor/core";

export type User = {
  userName?: string;
  currency?: string;
  email?: string;
  colorMode?: "Dark" | "White";
  budgetStartDay?: number;
};
export function ItemContextProvider(
  props: Readonly<{ children: React.ReactNode }>
) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [user, setUser] = useState<User>({
    userName: undefined,
    currency: undefined,
    email: undefined,
    colorMode: undefined,
    budgetStartDay: undefined,
  });

  const [loading, setLoading] = useState(false);

  const isNative = Capacitor.isNativePlatform();

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

  const currentMonthExpensesTotal = getMonthlyTotal(
    expenses,
    user?.budgetStartDay ?? 1
  );
  const currentYearExpensesTotal = getYearlyTotally(expenses);

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
      fetchExpenses,
      fetchBudgets,
      user,
      currency,
      fetchUser,
      currentYearExpensesTotal,
      isNative,
    }),
    [
      budgets,
      expenses,
      loading,
      currentMonthExpensesTotal,
      user,
      currency,
      currentYearExpensesTotal,
      isNative,
    ]
  );

  return (
    <ItemContext.Provider value={value}>{props.children}</ItemContext.Provider>
  );
}
