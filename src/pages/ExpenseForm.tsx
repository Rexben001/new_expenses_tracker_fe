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
import { Info } from "lucide-react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
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
    isRecurring: "false",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isBudgetRecurring, setIsBudgetRecurring] = useState<boolean | null>();

  useEffect(() => {
    if (isEditMode) {
      const selectedBudget = budgets.find((b) => b.id === state.id);
      setIsBudgetRecurring(selectedBudget?.isRecurring ?? null);
      setFormData({
        title: state?.title ?? "",
        amount: Number(state?.amount ?? 0),
        category: state?.category ?? "",
        updatedAt:
          state?.updatedAt?.split("T")[0] ??
          new Date().toISOString().split("T")[0],
        description: "",
        currency: state?.currency || "EUR",
        budgetId: state?.id ?? "",
        upcoming: state?.upcoming ?? "false",
        isRecurring: state?.isRecurring?.toString() ?? "false",
      });
    } else if (state?.id) {
      const bud = budgets?.find((b) => b.id === state.id);
      setIsBudgetRecurring(bud?.isRecurring ?? null);
      setFormData({
        title: "",
        amount: 0,
        category: bud?.category ?? "",
        updatedAt: new Date().toISOString().split("T")[0],
        description: "",
        currency: state?.currency || "EUR",
        budgetId: state?.id ?? "",
        upcoming: state?.upcoming ?? "false",
        isRecurring: state?.isRecurring ?? "false",
      });
    }
  }, [budgets, expenseId, isEditMode, state]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    if (name === "budgetId") {
      const selectedBudget = budgets.find((b) => b.id === value);
      console.log({ selectedBudget });
      setIsBudgetRecurring(selectedBudget?.isRecurring ?? null);
    }

    if (name === "title") {
      const suggestions = value.trim() ? suggestCategories(value) : [];
      setSuggestions(suggestions);
      setFormData({
        ...updatedFormData,
        category:
          suggestions.length === 1 ? suggestions[0] : updatedFormData.category,
      });
    } else {
      if (updatedFormData.title.trim() === "") setSuggestions([]);
      setFormData(updatedFormData);
    }
    setError("");
  };

  console.log({ state });
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
          isRecurring: formData.isRecurring === "true",
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
          isRecurring: formData.isRecurring === "true",
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

  console.log({ isBudgetRecurring: !!isBudgetRecurring });

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

          <div className="flex gap-6 justify-between sm:justify-start sm:gap-12">
            {/* Recurring */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
                Recurring
                <Info
                  data-tooltip-html={
                    isBudgetRecurring
                      ? "<p>If enabled, this expense will <br/> automatically recreate every month.</p>"
                      : "<p>This expense is not recurring. <br/> To enable recurring expenses, <br /> please select a recurring budget.</p>"
                  }
                  className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                  data-tooltip-id="recurring-tooltip"
                />
              </span>
              <button
                type="button"
                disabled={!isBudgetRecurring}
                onClick={() =>
                  setFormData({
                    ...formData,
                    isRecurring:
                      formData.isRecurring === "true" ? "false" : "true",
                  })
                }
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  !isBudgetRecurring
                    ? "opacity-50 cursor-not-allowed"
                    : formData.isRecurring === "true"
                    ? "bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-300 ${
                    formData.isRecurring === "true" ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {/* Upcoming */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
                Upcoming
                <Info
                  data-tooltip-html="<p>Mark this as upcoming if it’s <br/> a future expense or not yet active.</p>"
                  className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                  data-tooltip-id="recurring-tooltip"
                />
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    upcoming: formData.upcoming === "true" ? "false" : "true",
                  })
                }
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  formData.upcoming === "true"
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-300 ${
                    formData.upcoming === "true" ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
            <Tooltip id="recurring-tooltip" />
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

// TODO: Only show recurring option if the selected budget is recurring
