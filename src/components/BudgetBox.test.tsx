import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getExpenses } from "../services/api";
import type { Budget } from "../types/budgets";
import type { Expense } from "../types/expenses";
import { useItemContext } from "../hooks/useItemContext";
import { BudgetBox } from "./BudgetBox";

vi.mock("../hooks/useItemContext", () => ({
  useItemContext: vi.fn(),
}));

vi.mock("../services/api", () => ({
  duplicateBudget: vi.fn().mockResolvedValue({}),
  getExpenses: vi.fn(),
  updateBudget: vi.fn().mockResolvedValue({}),
}));

const mockedUseItemContext = vi.mocked(useItemContext);
const mockedGetExpenses = vi.mocked(getExpenses);

const budget: Budget = {
  amount: 100,
  category: "Food",
  currency: "USD",
  favorite: false,
  id: "budget-1",
  isRecurring: false,
  title: "Groceries",
  updatedAt: "2026-06-09",
};

const expenses: Expense[] = [
  {
    amount: 40,
    budgetId: "budget-1",
    category: "Food",
    currency: "USD",
    favorite: false,
    id: "expense-1",
    isRecurring: false,
    title: "Market",
    updatedAt: "2026-06-09",
  },
];

function renderBudgetBox(props: Partial<React.ComponentProps<typeof BudgetBox>> = {}) {
  const removeBudget = vi.fn().mockResolvedValue(undefined);
  const updateFavorites = vi.fn().mockResolvedValue(undefined);

  render(
    <MemoryRouter>
      <BudgetBox
        budget={budget}
        currency="USD"
        removeBudget={removeBudget}
        updateFavorites={updateFavorites}
        {...props}
      />
    </MemoryRouter>
  );

  return { removeBudget, updateFavorites };
}

describe("BudgetBox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseItemContext.mockReturnValue({
      fetchBudgets: vi.fn(),
      getSubAccountId: vi.fn().mockResolvedValue("sub-1"),
    } as any);
    mockedGetExpenses.mockResolvedValue(expenses);
  });

  test("loads expenses and renders budget usage", async () => {
    renderBudgetBox();

    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(await screen.findByText("40% used")).toBeInTheDocument();
    expect(screen.getByText("$60.00 left")).toBeInTheDocument();
    expect(mockedGetExpenses).toHaveBeenCalledWith("budget-1", "sub-1");
  });

  test("toggles favorite from the star button", async () => {
    const { updateFavorites } = renderBudgetBox();

    await userEvent.click(screen.getByRole("button", { name: "Favorite" }));

    expect(updateFavorites).toHaveBeenCalledWith("budget-1", true);
  });

  test("opens the action menu and deletes the budget", async () => {
    const { removeBudget } = renderBudgetBox();

    await userEvent.click(
      screen.getByRole("button", { name: "Open budget actions" })
    );
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(removeBudget).toHaveBeenCalledWith("budget-1");
    });
  });
});
