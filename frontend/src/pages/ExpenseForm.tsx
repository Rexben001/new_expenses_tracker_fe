import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import { createExpense, updateExpense } from "../services/api";
import { useItemContext } from "../hooks/useItemContext";

const CATEGORY_OPTIONS = [
  "Food & Drinks",
  "Transport",
  "Shopping",
  "Health",
  "Entertainment",
  "Utilities",
];

export function ExpenseForm() {
  const { currency } = useItemContext();

  const { expenseId } = useParams();
  const isEditMode = Boolean(expenseId);
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    category?: string;
    amount?: number;
    title?: string;
    updatedAt?: string;
    currency?: string;
    id?: string;
  };

  const [formData, setFormData] = useState({
    title: "",
    amount: 0,
    category: "",
    updatedAt: "",
    description: "",
    currency,
  });

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: state?.title ?? "",
        amount: Number(state?.amount || 0),
        category: state?.category ?? "",
        updatedAt: state?.updatedAt ?? "",
        description: "",
        currency: "EUR",
      });
    }
  }, [expenseId, isEditMode, state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode)
      updateExpense(
        expenseId!,
        {
          ...formData,
          amount: Number(formData.amount),
        },
        state?.id
      );
    else
      createExpense(
        { ...formData, amount: Number(formData.amount) },
        state?.id
      );

    if (state.id) navigate("/budgets");
    else
      navigate("/expenses", {
        state: { refresh: true },
      });
  };

  return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-12 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-black"
        >
          <FiChevronLeft className="text-2xl" />
        </button>
        <h1 className="text-xl font-bold">
          {isEditMode ? "Edit Expense" : "Create New Expense"}
        </h1>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">
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
          {isEditMode ? "Update Expense" : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
