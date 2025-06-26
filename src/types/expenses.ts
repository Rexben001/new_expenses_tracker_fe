export type Expense = {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  currency: string;
  amount: number;
  budgetId?: string
};
