import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import { createExpense, updateExpense } from "../services/api";
import { useItemContext } from "../hooks/useItemContext";
import { CATEGORY_OPTIONS } from "../services/item";
import type { BUDGET_STATE } from "../types/locationState";
import { getMonthAndYear } from "../services/formatDate";
import { suggestCategories } from "../services/suggestCategory";
import { SuggestionCategories } from "../components/Category";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import { tokenStore } from "../services/tokenStore";

export function ExpenseForm() {
  const { currency, budgets, fetchExpenses } = useItemContext();

  const { expenseId } = useParams();
  const isEditMode = Boolean(expenseId);
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as BUDGET_STATE;

  const [formData, setFormData] = useState({
    title: state?.title ?? "",
    amount: state?.amount ?? 0,
    category: state?.category ?? "",
    updatedAt: state?.updatedAt ?? new Date().toISOString().split("T")[0],
    description: "",
    currency,
    budgetId: "",
    upcoming: "false",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: state?.title ?? "",
        amount: Number(state?.amount ?? 0),
        category: state?.category ?? "",
        updatedAt:
          state?.updatedAt?.split("T")[0] ??
          new Date().toISOString().split("T")[0],
        description: "",
        currency: "EUR",
        budgetId: state?.id ?? "",
        upcoming: state?.upcoming ?? "false",
      });
    } else if (state?.id) {
      const bud = budgets?.find((b) => b.id === state.id);
      setFormData({
        title: "",
        amount: 0,
        category: bud?.category ?? "",
        updatedAt: new Date().toISOString().split("T")[0],
        description: "",
        currency: "EUR",
        budgetId: state?.id ?? "",
        upcoming: state?.upcoming ?? "false",
      });
    }
  }, [budgets, expenseId, isEditMode, state]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (e.target.name === "title") {
      const suggestions = suggestCategories(e.target.value);
      setSuggestions(suggestions);
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subAccountId = (await tokenStore.get("subAccountId")) || undefined;
    if (!formData.budgetId) {
      const option = budgets?.length
        ? "select a budget"
        : "create a budget first and then select it";
      setError(`You need to ${option}`);
      return;
    }
    setIsSubmitting(true);
    const id = formData.budgetId ?? state?.id;

    if (isEditMode) {
      const oldBudgetId = state?.id !== formData.budgetId && state?.id;
      await updateExpense(
        expenseId!,
        {
          ...formData,
          amount: Number(formData.amount),
          ...(oldBudgetId && { oldBudgetId }),
          ...(id && { budgetId: id }),
          upcoming: formData.upcoming === "true",
        },
        id,
        subAccountId
      );
    } else
      await createExpense(
        {
          ...formData,
          amount: Number(formData.amount),
          ...(id && { budgetId: id }),
          upcoming: formData.upcoming === "true",
        },
        id,
        subAccountId
      );

    await fetchExpenses();

    if (id) {
      navigate(`/budgets/${id}`, {
        state: { refresh: true },
      });
    } else
      navigate("/expenses", {
        state: { refresh: true },
      });
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <SwipeShell refresh={Promise.resolve}>
      <HeaderComponent>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => goBack()}
            className="text-gray-600 dark:text-white  hover:text-black"
          >
            <FiChevronLeft className="text-2xl" />
          </button>
          <h1 className="text-xl font-bold">
            {isEditMode ? "Edit Expense" : "Create New Expense"}
          </h1>
        </div>
      </HeaderComponent>
      <div className="min-h-screen dark:text-white px-4 pt-6 pb-12 max-w-md mx-auto mt-10">
        {error && (
          <div className="mb-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300 mt-2">
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-gray-500 dark:text-white  my-1 block">
              Expense Name
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter name"
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 dark:text-white  mb-1 block">
              Amount
            </label>
            <input
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="inline-flex items-center justify-between  mb-1">
              <label className="text-sm dark:text-white  text-gray-500 pr-4 block">
                Category
              </label>
              {suggestions.length > 0 && (
                <SuggestionCategories
                  categories={suggestions}
                  onSelect={(category) => {
                    setFormData({ ...formData, category });
                    setError("");
                  }}
                />
              )}
            </div>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select category
              </option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm dark:text-white text-gray-500 mb-1 block">
              Budget
            </label>

            {budgets?.length ? (
              <select
                name="budgetId"
                value={formData.budgetId?.toString() ?? ""}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select Budget
                </option>
                {budgets.map(({ id, title, updatedAt }) => (
                  <option key={id} value={id.toString()}>
                    {title} - {getMonthAndYear(updatedAt)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-3 text-sm">
                <p className="text-amber-800 dark:text-amber-200">
                  You need to create a budget before adding an expense.
                </p>
                <a
                  href="/budgets/new"
                  className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                >
                  Create budget
                </a>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm dark:text-white  text-gray-500 mb-1 block">
              Date
            </label>
            <input
              name="updatedAt"
              type="date"
              value={formData.updatedAt}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Upcoming</label>
            <select
              name="upcoming"
              value={formData.upcoming}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select upcoming status
              </option>
              {["true", "false"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 font-semibold"
          >
            {isEditMode ? "Update Expense" : "Add Expense"}
          </button>
        </form>
      </div>
      <FooterNav />
    </SwipeShell>
  );
}
