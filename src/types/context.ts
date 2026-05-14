import { createContext } from "react";
import type { Budget } from "./budgets";
import type { Expense } from "./expenses";
import type { Task } from "./tasks";
import type { Account, User } from "./user";

interface IItemContext {
  budgets: Budget[];
  expenses: Expense[];
  tasks: Task[];
  setBudgets(budgets: Budget[]): void;
  setExpenses(expenses: Expense[]): void;
  setTasks(tasks: Task[]): void;
  currentMonthExpensesTotal: number;
  loading: boolean;
  setLoading(loading: boolean): void;
  fetchExpenses(subId?: string): Promise<void>;
  fetchBudgets(subId?: string): Promise<void>;
  fetchTasks(subId?: string): Promise<void>;
  fetchUser(subId?: string): Promise<void>;
  user: User;
  currency?: string;
  currentYearExpensesTotal: number;
  isNative: boolean;
  deviceType: "iphone" | "ipad" | "android" | "web";
  tokens?: {
    accessToken: string;
    idToken: string;
  };
  setCurrentAccount(account: Account): void;
  currentAccount: Account | undefined;
  setCurrentAccountId(accountId: string | undefined): void;
  currentAccountId: string | undefined;
  getSubAccountId(): Promise<string | undefined>;
  budgetStartDay: number | undefined;
}

export const ItemContext = createContext<IItemContext>({} as IItemContext);
