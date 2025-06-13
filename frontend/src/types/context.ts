import { createContext } from "react";
import type { Budget } from "./budgets";
import type { Expense } from "./expenses";

interface IItemContext {
  budgets: Budget[];
  expenses: Expense[];
  setBudgets(budgets: Budget[]): void;
  setExpenses(expenses: Expense[]): void;
  currentMonthExpensesTotal: number;
  recentExpenses: Expense[];
  recentBudgets: Budget[];
  loading: boolean;
  setLoading(loading: boolean): void;
  fetchExpenses(): void;
}

export const ItemContext = createContext<IItemContext>({} as IItemContext);
