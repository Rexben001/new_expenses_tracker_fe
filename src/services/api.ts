import { getTokens } from "./amplify";
import type { CalendarEntry } from "../types/calendar";

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

type ApiErrorPayload = {
  message?: string;
  error?: string;
  statusCode?: number;
  details?: unknown;
};

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toApiError(response: Response, payload: unknown) {
  const errorPayload =
    payload && typeof payload === "object" ? (payload as ApiErrorPayload) : {};
  const message =
    errorPayload.message ??
    errorPayload.error ??
    (typeof payload === "string" ? payload : response.statusText) ??
    "Request failed";

  return new ApiError(
    message,
    errorPayload.statusCode ?? response.status,
    errorPayload.details
  );
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
) {
  return error instanceof Error ? error.message : fallback;
}

async function fetchApi({
  method,
  path,
  body,
  useIdToken = true,
}: {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  useIdToken?: boolean;
}) {
  const token = await getTokens();
  const authToken = useIdToken ? token?.idToken : token?.accessToken;

  if (!authToken) {
    throw new ApiError("No auth token available", 401);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...(body ? { body: JSON.stringify(body) } : {}),
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
  const payload = await readResponseBody(response);

  if (!response.ok) {
    throw toApiError(response, payload);
  }

  return payload;
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

export function getCalendarEntries(subId?: string) {
  return fetchApi({
    method: "GET",
    path: addSubIdPath("calendar", subId),
  }) as Promise<CalendarEntry[]>;
}

export function getCalendarEntry(id: string, subId?: string) {
  return fetchApi({
    method: "GET",
    path: addSubIdPath(`calendar/${id}`, subId),
  }) as Promise<CalendarEntry[]>;
}

export function createCalendarEntry(body: unknown, subId?: string) {
  return fetchApi({
    method: "POST",
    path: addSubIdPath("calendar", subId),
    body,
  });
}

export function updateCalendarEntry(
  id: string,
  body: unknown,
  subId?: string
) {
  return fetchApi({
    method: "PUT",
    path: addSubIdPath(`calendar/${id}`, subId),
    body,
  });
}

export function deleteCalendarEntry(id: string, subId?: string) {
  return fetchApi({
    method: "DELETE",
    path: addSubIdPath(`calendar/${id}`, subId),
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
  if (id) {
    path += path.includes("?")
      ? `&subId=${encodeURIComponent(id)}`
      : `?subId=${encodeURIComponent(id)}`;
  }
  if (setIsRecurring) {
    path += path.includes("?")
      ? `&setIsRecurring=${setIsRecurring}`
      : `?setIsRecurring=${setIsRecurring}`;
  }

  return path;
};
