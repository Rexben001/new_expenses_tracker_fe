export type Budget = {
  id: string;
  title: string;
  amount: number;
  category: string;
  updatedAt: string;
  currency: string;
  upcoming?: boolean;
  favorite?: boolean;
  isRecurring?: boolean;
};
