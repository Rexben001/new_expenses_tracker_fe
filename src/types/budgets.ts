export type Budget = {
  id: string;
  title: string;
  amount: number;
  period: string;
  category: string;
  updatedAt: string;
  currency: string;
  upcoming?: boolean;
  favorite?: boolean;
};
