import { getTokens } from "./amplify";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://ybnvf6a6ce.execute-api.eu-west-1.amazonaws.com/prod/";

export type ReceiptScanV2Result = {
  source: "textract";
  merchant: string | null;
  total: number | null;
  date: string | null;
  rawText: string;
  confidence: number | null;
};

export type ExpenseInsight = {
  id: string;
  type:
    | "summary"
    | "category"
    | "budget"
    | "unusual"
    | "recurring"
    | "projection"
    | "merchant"
    | "duplicate";
  severity: "info" | "success" | "warning" | "danger";
  title: string;
  message: string;
  value?: number;
  category?: string;
  budgetId?: string;
  expenseId?: string;
};

export type ExpenseInsightsResponse = {
  generatedAt: string;
  currency: string;
  period: {
    current: string;
    previous: string;
    budgetStartDay?: number;
  };
  totals: {
    currentMonth: number;
    previousMonth: number;
    currentBudget: number;
    remainingBudget: number;
    changePercent: number | null;
  };
  categories: {
    category: string;
    amount: number;
    percent: number;
  }[];
  insights: ExpenseInsight[];
};

async function fetchApi({
  method,
  path,
  body,
}: {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  useIdToken?: boolean;
}) {
  try {
    const token = await getTokens();

    if (!token?.idToken) {
      throw new Error("No ID token available");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...(body ? { body: JSON.stringify(body) } : {}),
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.idToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();

      // if (error.message === "Unauthorized") {
      //   throw new Error("Unauthorized");
      // }

      throw new Error(error);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching data:", String(error));
    throw error;
  }
}

export function getBudgets(subId?: string) {
  return fetchApi({
    method: "GET",
    path: addSubIdPath("budgets", subId),
  });
}

export function createBudget(body: unknown, subId?: string) {
  return fetchApi({
    method: "POST",
    path: addSubIdPath("budgets", subId),
    body,
  });
}

export function updateBudget(
  id: string,
  body: unknown,
  subId?: string,
  setIsRecurring?: boolean
) {
  const path = addSubIdPath(`budgets/${id}`, subId, setIsRecurring);
  console.log({ setIsRecurring, path });
  return fetchApi({
    method: "PUT",
    path,
    body,
  });
}

export function deleteBudget(id: string, subId?: string) {
  return fetchApi({
    method: "DELETE",
    path: addSubIdPath(`budgets/${id}`, subId),
  });
}

export function duplicateBudget(id: string, isOnly?: boolean, subId?: string) {
  const path = isOnly
    ? `budgets/${id}/duplicates?only=true`
    : `budgets/${id}/duplicates`;
  return fetchApi({
    method: "POST",
    path: addSubIdPath(path, subId),
  });
}

export function getExpenses(budgetId?: string, subId?: string) {
  let path = "expenses";

  if (budgetId) path += `?budgetId=${budgetId}`;

  return fetchApi({
    method: "GET",
    path: addSubIdPath(path, subId),
  });
}

export function getExpenseInsights(subId?: string) {
  return fetchApi({
    method: "GET",
    path: addSubIdPath("expenses/insights", subId),
  }) as Promise<ExpenseInsightsResponse>;
}

export function getExpense(id?: string, budgetId?: string, subId?: string) {
  return fetchApi({
    method: "GET",
    path: addSubIdPath(getExpensesPath(id, budgetId), subId),
  });
}

export function createExpense(
  body: unknown,
  budgetId?: string,
  subId?: string
) {
  return fetchApi({
    method: "POST",
    path: addSubIdPath(getExpensesPath(undefined, budgetId), subId),
    body,
  });
}

export function duplicateExpense(
  id: string,
  budgetId?: string,
  subId?: string
) {
  return fetchApi({
    method: "POST",
    path: addSubIdPath(getExpensesPath(id, budgetId, "true"), subId),
  });
}

export function updateExpense(
  id: string,
  body: unknown,
  budgetId?: string,
  subId?: string
) {
  return fetchApi({
    method: "PUT",
    path: addSubIdPath(getExpensesPath(id, budgetId), subId),
    body,
  });
}

export function deleteExpense(id: string, budgetId?: string, subId?: string) {
  return fetchApi({
    method: "DELETE",
    path: addSubIdPath(getExpensesPath(id, budgetId), subId),
  });
}

export function getTasks(subId?: string) {
  return fetchApi({
    method: "GET",
    path: addSubIdPath("tasks", subId),
  });
}

export function getTask(id: string, subId?: string) {
  return fetchApi({
    method: "GET",
    path: addSubIdPath(`tasks/${id}`, subId),
  });
}

export function createTask(body: unknown, subId?: string) {
  return fetchApi({
    method: "POST",
    path: addSubIdPath("tasks", subId),
    body,
  });
}

export function updateTask(id: string, body: unknown, subId?: string) {
  return fetchApi({
    method: "PUT",
    path: addSubIdPath(`tasks/${id}`, subId),
    body,
  });
}

export function deleteTask(id: string, subId?: string) {
  return fetchApi({
    method: "DELETE",
    path: addSubIdPath(`tasks/${id}`, subId),
  });
}

export function getUser(subId?: string) {
  return fetchApi({
    method: "GET",
    path: addSubIdPath("users", subId),
  });
}

export async function updateUser(body: unknown, subId?: string) {
  return fetchApi({
    method: "PUT",
    path: addSubIdPath("users", subId),
    body,
  });
}

export async function createSubAccount() {
  return fetchApi({
    method: "POST",
    path: "users",
  });
}

export async function deleteSubAccount(subId: string) {
  return fetchApi({
    method: "DELETE",
    path: `users?subId=${subId}`,
  });
}

export function scanReceiptV2(
  body: {
    imageBase64: string;
    contentType: string;
    fileName?: string;
  },
  subId?: string
) {
  return fetchApi({
    method: "POST",
    path: addSubIdPath("receipts/scan-v2", subId),
    body,
  }) as Promise<ReceiptScanV2Result>;
}

const getExpensesPath = (id?: string, budgetId?: string, duplicates = "") => {
  let path = "expenses";

  if (id) path += `/${id}`;

  if (duplicates) path += "/duplicates";

  if (budgetId) path += `?budgetId=${budgetId}`;

  return path;
};

const addSubIdPath = (path: string, id?: string, setIsRecurring?: boolean) => {
  if (id) path += path.includes("?") ? `&subId=${id}` : `?subId=${id}`;
  if (setIsRecurring) {
    console.log("got here");
    path += path.includes("?")
      ? `&setIsRecurring=${setIsRecurring}`
      : `?setIsRecurring=${setIsRecurring}`;
  }

  return path;
};
