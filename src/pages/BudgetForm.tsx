import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import { createBudget, updateBudget } from "../services/api";
import { useItemContext } from "../hooks/useItemContext";
import { CATEGORY_OPTIONS } from "../services/item";
import type { BUDGET_STATE } from "../types/locationState";
import { SuggestionCategories } from "../components/Category";
import { suggestCategories } from "../services/suggestCategory";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";
import SwipeShell from "../components/SwipeShell";

export function BudgetForm() {
  const { currency } = useItemContext();
  const { budgetId } = useParams();
  const isEditMode = Boolean(budgetId);
  const navigate = useNavigate();

  const location = useLocation();

  const state = location.state as BUDGET_STATE;

  const [formData, setFormData] = useState({
    title: "",
    amount: 0,
    category: "",
    updatedAt: new Date().toISOString().split("T")[0],
    description: "",
    period: "monthly",
    upcoming: "false",
    currency,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: state?.title ?? "",
        amount: Number(state?.amount ?? 0),
        category: state?.category ?? "",
        updatedAt: state?.updatedAt?.split("T")[0] ?? "",
        period: state?.period ?? "monthly",
        description: "",
        upcoming: state?.upcoming ?? "false",
        currency: "EUR",
      });
    }
  }, [budgetId, isEditMode, state]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isEditMode)
      await updateBudget(budgetId!, {
        ...formData,
        amount: Number(formData.amount),
        upcoming: formData.upcoming === "true",
      });
    else
      await createBudget({
        ...formData,
        amount: Number(formData.amount),
        upcoming: formData.upcoming === "true",
      });

    navigate("/budgets", { state: { refresh: true } });
  };

  return (
    <SwipeShell>
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
      <div className="min-h-screen dark:text-white px-4 pt-6 pb-12 max-w-md mx-auto mt-14">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              Budget Name
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter name"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                  onSelect={(category) =>
                    setFormData({ ...formData, category })
                  }
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

          {/* <div>
          <label className="text-sm text-gray-500 mb-1 block">Period</label>
          <select
            name="period"
            value={formData.period}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select period
            </option>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div> */}

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
            {isEditMode ? "Update Budget" : "Add Budget"}
          </button>
        </form>
      </div>
      <FooterNav />
    </SwipeShell>
  );
}
