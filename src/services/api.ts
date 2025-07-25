import { handleUnauthorized } from "./isLoggedIn";

export const API_BASE_URL =
  "https://ybnvf6a6ce.execute-api.eu-west-1.amazonaws.com/prod/";

async function fetchApi({
  method,
  path,
  body,
}: {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}) {
  try {
    const token = localStorage.getItem("idToken");

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...(body ? { body: JSON.stringify(body) } : {}),
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();

      if (error.message === "Unauthorized") {
        handleUnauthorized();
        throw new Error("Unauthorized");
      }
      throw new Error(error);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export function getBudgets() {
  return fetchApi({
    method: "GET",
    path: "budgets",
  });
}

export function createBudget(body: unknown) {
  return fetchApi({
    method: "POST",
    path: "budgets",
    body,
  });
}

export function updateBudget(id: string, body: unknown) {
  return fetchApi({
    method: "PUT",
    path: `budgets/${id}`,
    body,
  });
}
export function deleteBudget(id: string) {
  return fetchApi({
    method: "DELETE",
    path: `budgets/${id}`,
  });
}

export function duplicateBudget(id: string, isOnly?: boolean) {
  const path = isOnly
    ? `budgets/${id}/duplicates?only=true`
    : `budgets/${id}/duplicates`;
  return fetchApi({
    method: "POST",
    path,
  });
}

export function getExpenses(budgetId?: string) {
  let path = "expenses";

  if (budgetId) path += `?budgetId=${budgetId}`;

  return fetchApi({
    method: "GET",
    path: path,
  });
}

export function getExpense(id?: string, budgetId?: string) {
  return fetchApi({
    method: "GET",
    path: getExpensesPath(id, budgetId),
  });
}

export function createExpense(body: unknown, budgetId?: string) {
  return fetchApi({
    method: "POST",
    path: getExpensesPath(undefined, budgetId),
    body,
  });
}

export function duplicateExpense(id: string, budgetId?: string) {
  return fetchApi({
    method: "POST",
    path: getExpensesPath(id, budgetId, "true"),
  });
}

export function updateExpense(id: string, body: unknown, budgetId?: string) {
  return fetchApi({
    method: "PUT",
    path: getExpensesPath(id, budgetId),
    body,
  });
}

export function deleteExpense(id: string, budgetId?: string) {
  return fetchApi({
    method: "DELETE",
    path: getExpensesPath(id, budgetId),
  });
}

export function getUser() {
  return fetchApi({
    method: "GET",
    path: "users",
  });
}

export async function updateUser(body: unknown) {
  return fetchApi({
    method: "PUT",
    path: "users",
    body,
  });
}

const getExpensesPath = (id?: string, budgetId?: string, duplicates = "") => {
  let path = "expenses";

  if (id) path += `/${id}`;

  if (duplicates) path += "/duplicates";

  if (budgetId) path += `?budgetId=${budgetId}`;

  return path;
};
