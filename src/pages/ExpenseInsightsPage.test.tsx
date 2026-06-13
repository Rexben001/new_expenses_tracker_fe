import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useItemContext } from "../hooks/useItemContext";
import { getExpenseInsights } from "../services/api";
import type { ExpenseInsightsResponse } from "../services/api";
import { ExpenseInsightsPage } from "./ExpenseInsightsPage";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}));

vi.mock("../hooks/useItemContext", () => ({
  useItemContext: vi.fn(),
}));

vi.mock("../services/api", () => ({
  getExpenseInsights: vi.fn(),
}));

const mockedUseItemContext = vi.mocked(useItemContext);
const mockedGetExpenseInsights = vi.mocked(getExpenseInsights);

const insightsResponse: ExpenseInsightsResponse = {
  categories: [
    {
      amount: 75,
      category: "Hair",
      percent: 60,
    },
  ],
  currency: "USD",
  generatedAt: "2026-06-09T00:00:00.000Z",
  insights: [
    {
      id: "insight-1",
      message: "You are close to your monthly budget.",
      severity: "warning",
      title: "Budget alert",
      type: "budget",
      value: 25,
    },
  ],
  period: {
    current: "June 2026",
    previous: "May 2026",
  },
  totals: {
    changePercent: 12,
    currentBudget: 200,
    currentMonth: 125,
    previousMonth: 110,
    remainingBudget: 75,
  },
};

function renderPage() {
  render(
    <MemoryRouter>
      <ExpenseInsightsPage />
    </MemoryRouter>
  );
}

describe("ExpenseInsightsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseItemContext.mockReturnValue({
      currency: "USD",
      deviceType: "web",
      getSubAccountId: vi.fn().mockResolvedValue("sub-1"),
    } as any);
    mockedGetExpenseInsights.mockResolvedValue(insightsResponse);
  });

  test("loads and renders insight metrics", async () => {
    renderPage();

    expect(screen.getByText("Analysing your expenses...")).toBeInTheDocument();
    expect(await screen.findByText("June 2026")).toBeInTheDocument();
    expect(screen.getByText("$125.00")).toBeInTheDocument();
    expect(screen.getByText("Budget left")).toBeInTheDocument();
    expect(screen.getAllByText("$75.00")).toHaveLength(2);
    expect(screen.getByText("Hair")).toBeInTheDocument();
    expect(screen.getByText("Budget alert")).toBeInTheDocument();
    expect(mockedGetExpenseInsights).toHaveBeenCalledWith("sub-1");
  });

  test("refreshes insights from the toolbar button", async () => {
    renderPage();

    await screen.findByText("Budget alert");
    await userEvent.click(
      screen.getByRole("button", { name: "Refresh insights" })
    );

    await waitFor(() => {
      expect(mockedGetExpenseInsights).toHaveBeenCalledTimes(2);
    });
  });

  test("shows an error when insights fail to load", async () => {
    mockedGetExpenseInsights.mockRejectedValueOnce(new Error("Network failed"));

    renderPage();

    expect(
      await screen.findByText("Could not load expense insights.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Budget alert")).not.toBeInTheDocument();
  });
});
