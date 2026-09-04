export type User = {
  userName?: string;
  currency?: string;
  email?: string;
  colorMode?: "Dark" | "White";
  budgetStartDay?: number;
  calendarEnabled?: boolean;
  accountType: "Main" | "Sub";
  id?: string;
};

export type Account = {
  profile: User;
  subAccounts?: SubAccount[];
};

export type SubAccount = {
  name: string;
  currency?: string;
  subAccountId: string;
  budgetStartDay?: number;
};
