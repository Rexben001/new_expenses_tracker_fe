import { createContext } from "react";
import type { Budget } from "./budgets";
import type { Expense } from "./expenses";
import type { User } from "../context/ItemContext";

interface IItemContext {
  budgets: Budget[];
  expenses: Expense[];
  setBudgets(budgets: Budget[]): void;
  setExpenses(expenses: Expense[]): void;
  currentMonthExpensesTotal: number;
  loading: boolean;
  setLoading(loading: boolean): void;
  fetchExpenses(): Promise<void>;
  fetchBudgets(): Promise<void>;
  fetchUser(): Promise<void>;
  user: User;
  currency?: string;
}

export const ItemContext = createContext<IItemContext>({} as IItemContext);
