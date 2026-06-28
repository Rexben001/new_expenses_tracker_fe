import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getErrorMessage,
  getBudgets,
  getCalendarEntries,
  getExpenses,
  getTasks,
  getUser,
} from "../services/api";
import type { Budget } from "../types/budgets";
import type { CalendarEntry } from "../types/calendar";
import type { Expense } from "../types/expenses";
import {
  ItemContext,
  type ResourceErrorState,
  type ResourceKey,
  type ResourceLoadingState,
} from "../types/context";
import { getMonthlyTotal, getYearlyTotally } from "../services/item";
import { Capacitor } from "@capacitor/core";
import { getDeviceType } from "../utils/platform";
import { getTokens } from "../services/amplify";
import { useAuth } from "./AuthContext";
import type { Account, User } from "../types/user";
import { tokenStore } from "../services/tokenStore";
import type { Task } from "../types/tasks";

const initialResourceLoading: ResourceLoadingState = {
  budgets: false,
  expenses: false,
  tasks: false,
  calendarEntries: false,
  user: false,
};

export function ItemContextProvider(
  props: Readonly<{ children: React.ReactNode }>
) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
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

  const [manualLoading, setLoading] = useState(false);
  const [resourceLoading, setResourceLoading] =
    useState<ResourceLoadingState>(initialResourceLoading);
  const [resourceErrors, setResourceErrors] = useState<ResourceErrorState>({});

  const [deviceType, setDeviceType] = useState<
    "iphone" | "ipad" | "android" | "web"
  >("web");

  const isNative = Capacitor.isNativePlatform();

  const loading =
    manualLoading || Object.values(resourceLoading).some(Boolean);

  const getSubAccountId = useCallback(async (): Promise<string | undefined> => {
    const subAccountId = await tokenStore.get("subAccountId");
    return subAccountId === null ? undefined : subAccountId;
  }, []);

  const loadResource = useCallback(
    async <T,>(
      resource: ResourceKey,
      load: () => Promise<T>,
      onSuccess: (value: T) => void,
      onFailure?: () => void
    ) => {
      setResourceLoading((current) => ({ ...current, [resource]: true }));
      setResourceErrors((current) => {
        const next = { ...current };
        delete next[resource];
        return next;
      });

      try {
        onSuccess(await load());
      } catch (error) {
        onFailure?.();
        setResourceErrors((current) => ({
          ...current,
          [resource]: getErrorMessage(error, `Could not load ${resource}.`),
        }));
      } finally {
        setResourceLoading((current) => ({ ...current, [resource]: false }));
      }
    },
    []
  );

  const fetchBudgets = useCallback(
    async (_subId?: string) => {
      const subId = _subId ?? (await getSubAccountId());
      await loadResource(
        "budgets",
        () => getBudgets(subId) as Promise<Budget[]>,
        setBudgets,
        () => setBudgets([])
      );
    },
    [getSubAccountId, loadResource]
  );

  const fetchExpenses = useCallback(
    async (_subId?: string) => {
      const subId = _subId ?? (await getSubAccountId());

      await loadResource(
        "expenses",
        () => getExpenses(undefined, subId) as Promise<Expense[]>,
        setExpenses,
        () => setExpenses([])
      );
    },
    [getSubAccountId, loadResource]
  );

  const fetchTasks = useCallback(
    async (_subId?: string) => {
      const subId = _subId ?? (await getSubAccountId());

      await loadResource(
        "tasks",
        () => getTasks(subId) as Promise<Task[]>,
        setTasks,
        () => setTasks([])
      );
    },
    [getSubAccountId, loadResource]
  );

  const fetchCalendarEntries = useCallback(
    async (_subId?: string) => {
      const subId = _subId ?? (await getSubAccountId());

      await loadResource(
        "calendarEntries",
        () => getCalendarEntries(subId),
        setCalendarEntries,
        () => setCalendarEntries([])
      );
    },
    [getSubAccountId, loadResource]
  );

  const fetchUser = useCallback(
    async (_subId?: string) => {
      const subId = _subId ?? (await getSubAccountId());

      await loadResource(
        "user",
        () => getUser(subId) as Promise<Account>,
        (user) => {
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
        }
      );
    },
    [getSubAccountId, loadResource]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchBudgets(), fetchExpenses(), fetchTasks(), fetchUser()]);
  }, [fetchBudgets, fetchExpenses, fetchTasks, fetchUser]);

  useEffect(() => {
    getDeviceType().then((type) => setDeviceType(type));
  }, []);

  useEffect(() => {
    if (!auth?.authed) return;

    refreshAll();
    getTokens().then((t) => {
      setTokens({
        accessToken: t?.accessToken ?? "",
        idToken: t?.idToken ?? "",
      });
    });
  }, [auth?.authed, refreshAll]);

  const currentMonthExpensesTotal = getMonthlyTotal(
    expenses,
    budgetStartDay ?? 1
  );
  const currentYearExpensesTotal = getYearlyTotally(expenses);

  const value = useMemo(
    () => ({
      budgets,
      expenses,
      tasks,
      calendarEntries,
      setBudgets,
      setExpenses,
      setTasks,
      setCalendarEntries,
      loading,
      resourceLoading,
      resourceErrors,
      setLoading,
      refreshAll,
      currentMonthExpensesTotal,
      fetchExpenses,
      fetchBudgets,
      fetchTasks,
      fetchCalendarEntries,
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
      tasks,
      calendarEntries,
      loading,
      resourceLoading,
      resourceErrors,
      refreshAll,
      currentMonthExpensesTotal,
      fetchExpenses,
      fetchBudgets,
      fetchTasks,
      fetchCalendarEntries,
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
