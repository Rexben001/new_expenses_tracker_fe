import { useEffect, useMemo, useState } from "react";
import { getBudgets, getExpenses, getUser } from "../services/api";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { ItemContext } from "../types/context";
import { getMonthlyTotal, getYearlyTotally } from "../services/item";
import { Capacitor } from "@capacitor/core";
import { getDeviceType } from "../utils/platform";
import { getTokens } from "../services/amplify";
import { useAuth } from "./AuthContext";

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

  const auth = useAuth();

  const [tokens, setTokens] = useState<{
    accessToken: string;
    idToken: string;
  }>();

  const [loading, setLoading] = useState(false);

  const [deviceType, setDeviceType] = useState<
    "iphone" | "ipad" | "android" | "web"
  >("web");

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    fetchBudgets();
    fetchExpenses();
    fetchUser();
    getDeviceType().then((type) => setDeviceType(type));
    getTokens().then((t) => {
      console.log({ t });
      if (t && t.accessToken && t.idToken) {
        setTokens({ accessToken: t.accessToken, idToken: t.idToken });
      } else {
        setTokens({
          accessToken: t?.accessToken ?? "",
          idToken: t?.idToken ?? "",
        });
      }
    });
  }, [auth]);

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
      deviceType,
      tokens,
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
      deviceType,
      tokens,
    ]
  );

  return (
    <ItemContext.Provider value={value}>{props.children}</ItemContext.Provider>
  );
}
