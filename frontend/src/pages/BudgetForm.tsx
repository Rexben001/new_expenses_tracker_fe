import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import { createBudget, updateBudget } from "../services/api";
import { useItemContext } from "../hooks/useItemContext";
import { CATEGORY_OPTIONS } from "../services/item";
import type { BUDGET_STATE } from "../types/locationState";

const PERIOD_OPTIONS = ["none", "monthly", "yearly"];

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
    updatedAt: "",
    description: "",
    period: "",
    currency,
  });

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: state?.title ?? "",
        amount: Number(state?.amount || 0),
        category: state?.category ?? "",
        updatedAt: state?.updatedAt ?? "",
        period: state?.period ?? "",
        description: "",
        currency: "EUR",
      });
    }
  }, [budgetId, isEditMode, state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode)
      await updateBudget(budgetId!, {
        ...formData,
        amount: Number(formData.amount),
      });
    else await createBudget({ ...formData, amount: Number(formData.amount) });

    navigate("/budgets", { state: { refresh: true } });
  };

  return (
    <div className="min-h-screen bg-white  dark:bg-gray-900 dark:text-white px-4 pt-6 pb-12 max-w-md mx-auto">
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
          <label className="text-sm text-gray-500 mb-1 block">Category</label>
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
          <label className="text-sm text-gray-500 mb-1 block">Category</label>
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
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Date</label>
          <input
            name="updatedAt"
            type="date"
            value={formData.updatedAt}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 font-semibold"
        >
          {isEditMode ? "Update Budget" : "Add Budget"}
        </button>
      </form>
    </div>
  );
}
