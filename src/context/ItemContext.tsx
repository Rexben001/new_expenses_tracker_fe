import { useCallback, useEffect, useMemo, useState } from "react";
import { getBudgets, getExpenses, getUser } from "../services/api";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { ItemContext } from "../types/context";
import { getMonthlyTotal, getYearlyTotally } from "../services/item";
import { Capacitor } from "@capacitor/core";
import { getDeviceType } from "../utils/platform";
import { getTokens } from "../services/amplify";
import { useAuth } from "./AuthContext";
import type { Account, User } from "../types/user";
import { tokenStore } from "../services/tokenStore";

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
    accountType: "Main",
    id: undefined,
  });

  const [currency, setCurrency] = useState<string | undefined>(undefined);

  const [currentAccount, setCurrentAccount] = useState<Account | undefined>(
    undefined
  );

  const [currentAccountId, setCurrentAccountId] = useState<string | undefined>(
    undefined
  );

  const [budgetStartDay, setBudgetStartDay] = useState<number | undefined>(
    user.budgetStartDay
  );

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

  const getSubAccountId = useCallback(async (): Promise<string | undefined> => {
    const subAccountId = await tokenStore.get("subAccountId");
    return subAccountId === null ? undefined : subAccountId;
  }, []);

  const fetchBudgets = useCallback(
    async (_subId?: string) => {
      const subId = _subId ?? (await getSubAccountId());
      try {
        const budgets = await getBudgets(subId);
        setBudgets(budgets);
      } catch (error) {
        console.log({ error });
      }
    },
    [getSubAccountId]
  );

  const fetchExpenses = useCallback(
    async (_subId?: string) => {
      const subId = _subId ?? (await getSubAccountId());

      try {
        const expenses = await getExpenses(undefined, subId);
        setExpenses(expenses);
      } catch (error) {
        console.log({ error });
      }
    },
    [getSubAccountId]
  );

  const fetchUser = useCallback(
    async (_subId?: string) => {
      const subId = _subId ?? (await getSubAccountId());

      try {
        const user = (await getUser(subId)) as Account;
        console.log({
          user,
        });
        // pick the profile part from subAccount if subId
        if (subId && user.subAccounts) {
          const subAccount = user.subAccounts.find(
            ({ subAccountId }) => subAccountId === subId
          );
          setCurrency(subAccount?.currency ?? user.profile.currency);
          setBudgetStartDay(
            subAccount?.budgetStartDay ?? user.profile.budgetStartDay
          );
        } else {
          setCurrency(user.profile.currency);
          setBudgetStartDay(user.profile.budgetStartDay);
        }
        setUser(user.profile);
        setCurrentAccount(user);
      } catch (error) {
        console.log({ error });
      }
    },
    [getSubAccountId]
  );

  const currentMonthExpensesTotal = getMonthlyTotal(
    expenses,
    budgetStartDay ?? 1
  );
  const currentYearExpensesTotal = getYearlyTotally(expenses);

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
      setCurrentAccount,
      currentAccount,
      setCurrentAccountId,
      currentAccountId,
      getSubAccountId,
      budgetStartDay,
    }),
    [
      budgets,
      expenses,
      loading,
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
      currentAccount,
      currentAccountId,
      getSubAccountId,
      budgetStartDay,
    ]
  );

  return (
    <ItemContext.Provider value={value}>{props.children}</ItemContext.Provider>
  );
}
