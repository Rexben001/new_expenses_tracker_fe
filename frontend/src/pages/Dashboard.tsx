// Updated Dashboard with footer menu based on Figma
import { FaTrash, FaEdit } from "react-icons/fa";
import { FooterNav } from "../components/FooterNav";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useItemContext } from "../hooks/useItemContext";
import {
  formatRelativeDate,
  getMonth,
  getTimeOfTheDay,
} from "../services/formatDate";
import { formatCurrency } from "../services/formatCurrency";
import { LoadingScreen } from "../components/LoadingScreen";
import { logout } from "../services/isLoggedIn";

export function Dashboard() {
  const avatarUrl = "https://i.pravatar.cc/100";

  const {
    budgets,
    expenses,
    currentMonthExpensesTotal,
    recentExpenses,
    recentBudgets,
    loading,
    user,
  } = useItemContext();

  useEffect(() => {
    extractToken();
  }, []);

  const extractToken = () => {
    const hash = window.location.hash;

    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get("id_token");
      localStorage.setItem("idToken", idToken || "");
      return true;
    }
    return false;
  };

  const expense = recentExpenses[0];

  const budget = recentBudgets[0];

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="p-4 space-y-6 max-w-md mx-6 flex-grow pb-24">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-sm text-gray-500">Good {getTimeOfTheDay()}</p>
              <p className="font-medium">{user.userName || user?.email}</p>
            </div>
          </div>
          <button
            className="text-gray-500 hover:text-black"
            onClick={() => logout()}
          >
            Logout
          </button>
        </header>

        <div className="bg-gradient-to-r from-blue-500 to-blue-400 text-white p-4 rounded-xl shadow">
          <div className="flex justify-between text-sm">
            <span>Total expenses ({getMonth()})</span>
            <span>Monthly</span>
          </div>
          <div className="text-3xl font-semibold mt-2">
            {formatCurrency(currentMonthExpensesTotal || 0, user.currency)}
          </div>
        </div>

        <section>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Recent Expenses</h3>
            <button className="text-sm text-blue-500">
              <Link to={"/expenses"}>View all</Link>
            </button>
          </div>

          {expenses.length ? (
            <div
              key={expense?.id}
              className="bg-white rounded-xl p-4 shadow flex justify-between items-start mb-3"
            >
              <div>
                <p className="font-semibold text-base">{expense?.title}</p>
                <p className="text-sm text-gray-500">{expense?.category}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeDate(expense?.updatedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(expense?.amount, user.currency)}
                </p>
                <div className="flex justify-end gap-2 mt-2">
                  <button className="text-blue-500 hover:text-blue-700">
                    <FaEdit />
                  </button>
                  <button className="text-red-500 hover:text-red-700">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 text-center text-sm text-gray-500 p-4 rounded-xl">
              <p>You don’t have any expense for this month</p>
              <button className="mt-2 text-blue-500">
                <Link to="/expenses/new">+ Add Expense</Link>
              </button>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-2">Recent Budgets</h3>
          {budgets?.length === 0 ? (
            <div className="bg-gray-100 text-center text-sm text-gray-500 p-4 rounded-xl">
              <p>You don’t have any budget for this month</p>
              <button className="mt-2 text-blue-500">
                <Link to="/budgets/new">+ Add budget</Link>
              </button>
            </div>
          ) : (
            <div
              key={budget?.id}
              className="bg-white rounded-xl p-4 shadow flex justify-between items-start mb-3"
            >
              <div>
                <p className="font-semibold text-base">{budget?.title}</p>
                <p className="text-sm text-gray-500">{budget?.category}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeDate(budget?.updatedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(budget?.amount, user.currency)}
                </p>
                <div className="flex justify-end gap-2 mt-2">
                  <button className="text-blue-500 hover:text-blue-700">
                    <FaEdit />
                  </button>
                  <button className="text-red-500 hover:text-red-700">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <FooterNav />
    </div>
  );
}
