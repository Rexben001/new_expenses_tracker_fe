import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import { createExpense, updateExpense } from "../services/api";
import { useItemContext } from "../hooks/useItemContext";
import { CATEGORY_OPTIONS } from "../services/item";
import type { BUDGET_STATE } from "../types/locationState";
import { getMonthAndYear } from "../services/formatDate";

export function ExpenseForm() {
  const { currency, budgets, fetchExpenses } = useItemContext();

  const { expenseId } = useParams();
  const isEditMode = Boolean(expenseId);
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as BUDGET_STATE;

  const [formData, setFormData] = useState({
    title: "",
    amount: 0,
    category: "",
    updatedAt: "",
    description: "",
    currency,
    budgetId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: state?.title ?? "",
        amount: Number(state?.amount ?? 0),
        category: state?.category ?? "",
        updatedAt: state?.updatedAt ?? "",
        description: "",
        currency: "EUR",
        budgetId: state?.id ?? "",
      });
    } else if (state?.id) {
      setFormData({
        title: "",
        amount: 0,
        category: "",
        updatedAt: "",
        description: "",
        currency: "EUR",
        budgetId: state?.id ?? "",
      });
    }
  }, [expenseId, isEditMode, state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        },
        id
      );
    } else
      await createExpense(
        {
          ...formData,
          amount: Number(formData.amount),
          ...(id && { budgetId: id }),
        },
        id
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
    <div className="min-h-screen bg-white  dark:bg-gray-900 dark:text-white px-4 pt-6 pb-12 max-w-md mx-auto">
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

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm text-gray-500 dark:text-white  mb-1 block">
            Expense Name
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
          <label className="text-sm text-gray-500 dark:text-white  mb-1 block">
            Amount
          </label>
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
          <label className="text-sm dark:text-white  text-gray-500  mb-1 block">
            Category
          </label>
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
          <label className="text-sm dark:text-white   text-gray-500 mb-1 block">
            Budget
          </label>
          <select
            name="budgetId"
            value={formData.budgetId?.toString() ?? ""}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select Budget
            </option>
            {budgets?.length
              ? budgets.map(({ id, title, updatedAt }) => (
                  <option key={id} value={id.toString()}>
                    {title} - {getMonthAndYear(updatedAt)}
                  </option>
                ))
              : null}
          </select>
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
  );
}
