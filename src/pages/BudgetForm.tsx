import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import { createBudget, updateBudget } from "../services/api";
import { useItemContext } from "../hooks/useItemContext";
import { CATEGORY_OPTIONS } from "../services/item";
import type { BUDGET_STATE } from "../types/locationState";
import { SuggestionCategories } from "../components/Category";
import {
  suggestCategories,
  suggestCategory as suggestHighConfidenceCategory,
} from "../services/suggestCategory";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";
import SwipeShell from "../components/SwipeShell";
import { tokenStore } from "../services/tokenStore";
import { Info } from "lucide-react";
import { Tooltip } from "react-tooltip";
import {
  applyUntouchedDefaults,
  findExactNamedItem,
} from "../services/smartDefaults";

export function BudgetForm() {
  const { budgets, currency } = useItemContext();
  const { budgetId } = useParams();
  const isEditMode = Boolean(budgetId);
  const navigate = useNavigate();

  const location = useLocation();

  const state = location.state as BUDGET_STATE;

  const [formData, setFormData] = useState({
    title: "",
    amount: "" as number | "",
    category: "",
    updatedAt: new Date().toISOString().split("T")[0],
    description: "",
    isRecurring: "false",
    upcoming: "false",
    currency: currency || "EUR",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(isEditMode);
  const touchedFields = useRef(new Set<string>());

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: state?.title ?? "",
        amount: Number(state?.amount ?? 0),
        category: state?.category ?? "",
        updatedAt: state?.updatedAt?.split("T")[0] ?? "",
        isRecurring: state?.isRecurring?.toString() ?? "false",
        description: "",
        upcoming: state?.upcoming ?? "false",
        currency: state.currency ?? "EUR",
      });
    }
  }, [budgetId, isEditMode, state]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    touchedFields.current.add(name);

    if (name === "title") {
      const suggestions = value.trim() ? suggestCategories(value) : [];
      const inferredCategory = suggestHighConfidenceCategory("", value);
      const previous = !isEditMode
        ? findExactNamedItem(value, budgets, (budget) => budget.title)
        : undefined;
      setSuggestions(suggestions);
      setFormData(applyUntouchedDefaults({
        ...updatedFormData,
        category:
          !touchedFields.current.has("category")
            ? inferredCategory ??
              (suggestions.length === 1 ? suggestions[0] : updatedFormData.category)
            : updatedFormData.category,
      }, previous ? {
        amount: previous.amount,
        category: previous.category,
        currency: previous.currency,
        isRecurring: String(Boolean(previous.isRecurring)),
        upcoming: String(Boolean(previous.upcoming)),
      } : {}, touchedFields.current as ReadonlySet<keyof typeof updatedFormData>));
    } else {
      if (updatedFormData.title.trim() === "") setSuggestions([]);
      setFormData(updatedFormData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const setIsRecurring =
      state?.isRecurring && formData.isRecurring === "false";

    const subAccountId = (await tokenStore.get("subAccountId")) || undefined;

    if (isEditMode)
      await updateBudget(
        budgetId!,
        {
          ...formData,
          amount: Number(formData.amount),
          upcoming: formData.upcoming === "true",
          isRecurring: formData.isRecurring === "true",
        },
        subAccountId,
        !!setIsRecurring
      );
    else {
      await createBudget(
        {
          ...formData,
          amount: Number(formData.amount),
          upcoming: formData.upcoming === "true",
          isRecurring: formData.isRecurring === "true",
        },
        subAccountId
      );
    }

    navigate("/budgets", { state: { refresh: true } });
  };

  return (
    <SwipeShell refresh={Promise.resolve}>
      <HeaderComponent>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/budgets")}
            className="text-gray-600 dark:text-white  hover:text-black"
          >
            <FiChevronLeft className="text-2xl" />
          </button>
          <h1 className="text-xl font-bold">
            {isEditMode ? "Edit Budget" : "Create New Budget"}
          </h1>
        </div>
      </HeaderComponent>
      <div className="min-h-screen dark:text-white px-4 pb-12 max-w-md mx-auto pt-[calc(var(--app-header-height,4rem)+1.5rem)] transition-[padding-top] duration-200">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              Budget Name
            </label>
            <input
              name="title"
              list="budget-title-history"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter name"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="budget-title-history">
              {Array.from(new Set(budgets.map((budget) => budget.title))).map((title) => (
                <option key={title} value={title} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Amount</label>
            <input
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
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
                    touchedFields.current.add("category");
                    setFormData({ ...formData, category });
                  }}
                />
              )}
            </div>{" "}
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

          <details
            open={detailsOpen}
            onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
            className="rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <summary className="cursor-pointer px-3 py-3 text-sm font-semibold">
              More details <span className="font-normal text-gray-400">· {formData.updatedAt || "Today"} · {formData.isRecurring === "true" ? "Recurring" : "One-time"}</span>
            </summary>
            <div className="space-y-5 border-t border-gray-200 p-3 dark:border-gray-700">
          <div className="flex gap-6 justify-between sm:justify-start sm:gap-12">
            {/* Recurring */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
                Recurring
                <Info
                  data-tooltip-html={
                    formData.isRecurring === "true"
                      ? "<p>If disabled, this budget will be a one-time budget <br /> and all expenses will be non-recurring</p>"
                      : "<p>If enabled, this budget will <br/> automatically recreate every month.</p>"
                  }
                  className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                  data-tooltip-id="recurring-tooltip"
                />
              </span>
              <button
                type="button"
                onClick={() =>
                  {
                    touchedFields.current.add("isRecurring");
                    setFormData({
                      ...formData,
                      isRecurring:
                        formData.isRecurring === "true" ? "false" : "true",
                    });
                  }
                }
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  formData.isRecurring === "true"
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
                  data-tooltip-html="<p>Mark this as upcoming if it’s <br/> a future budget or not yet active.</p>"
                  className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                  data-tooltip-id="recurring-tooltip"
                />
              </span>
              <button
                type="button"
                onClick={() =>
                  {
                    touchedFields.current.add("upcoming");
                    setFormData({
                      ...formData,
                      upcoming: formData.upcoming === "true" ? "false" : "true",
                    });
                  }
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
            <label className="text-sm text-gray-500 mb-1 block">Date</label>
            <input
              name="updatedAt"
              type="date"
              required
              value={formData.updatedAt}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
            </div>
          </details>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 font-semibold"
          >
            {isEditMode ? "Update Budget" : "Add Budget"}
          </button>
        </form>
      </div>
      <FooterNav />
    </SwipeShell>
  );
}
