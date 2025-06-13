import { Link } from "react-router-dom";
import { FooterNav } from "../components/FooterNav";
import { deleteExpense } from "../services/api";
import { ExpenseBox } from "../components/ExpenseBox";
import { FiFilter, FiSearch, FiPlus } from "react-icons/fi";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { AddNewItem } from "../components/NoItem";

export function ExpensesPage() {
  const { expenses, loading, fetchExpenses } = useItemContext();

  const removeExpense = async (id: string) => {
    await deleteExpense(id);
    fetchExpenses();
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">All Expenses</h1>
        <button className="text-gray-500 hover:text-gray-800">
          <FiFilter className="text-xl" />
        </button>
      </div>

      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search expenses"
          className="w-full px-10 py-2 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
      </div>

      {expenses?.length ? (
        expenses.map(({ id, title, category, amount, updatedAt, currency }) => (
          <ExpenseBox
            key={id}
            id={id}
            title={title}
            category={category}
            amount={amount}
            updatedAt={updatedAt}
            currency={currency}
            removeExpense={removeExpense}
          />
        ))
      ) : (
        <AddNewItem
          url="/expenses/new"
          type="expenses"
          text="You don't have any expenses"
        />
      )}

      <Link
        to="/expenses/new"
        className="fixed bottom-20 right-6 bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700"
        aria-label="Add Expense"
      >
        <FiPlus className="text-2xl" />
      </Link>

      <FooterNav page="expenses" />
    </div>
  );
}
