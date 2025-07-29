import { FooterNav } from "../components/FooterNav";
import { Link } from "react-router-dom";
import { useItemContext } from "../hooks/useItemContext";
import {
  formatRelativeDate,
  getMonth,
  getTimeOfTheDay,
  getYear,
} from "../services/formatDate";
import { formatCurrency } from "../services/formatCurrency";
import { LoadingScreen } from "../components/LoadingScreen";
import { removeToken } from "../services/isLoggedIn";
import { logoutUrl } from "../services/getLoginUrl";
import { BudgetBox } from "../components/BudgetBox";
import { useEffect, useState } from "react";
import { getMonthlyTotal } from "../services/item";
import { CategoryComponent } from "../components/Cateegory";
import { useExpenseFilter } from "../hooks/useExpensesSearch";
import { ExpenseChart } from "../components/ExpensesChart";

export function Dashboard() {
  const {
    budgets,
    expenses,
    currentMonthExpensesTotal,
    loading,
    user,
    currency,
    currentYearExpensesTotal,
  } = useItemContext();

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${user.userName}`;

  const expense = expenses[0];

  const budget = budgets[0];

  const [duration, setDuration] = useState("monthly");

  const [total, setTotal] = useState(currentMonthExpensesTotal);

  const [type, setType] = useState(getMonth());

  useEffect(() => {
    const isMonthly = duration === "monthly";

    const total = isMonthly
      ? getMonthlyTotal(expenses, user?.budgetStartDay ?? 1)
      : currentYearExpensesTotal;

    setTotal(total);

    const type = isMonthly ? getMonth : getYear();
    setType(type);
  }, [
    currentMonthExpensesTotal,
    currentYearExpensesTotal,
    duration,
    expenses,
    total,
    user?.budgetStartDay,
  ]);

  const _filterExpenses = useExpenseFilter(["7"], "2025", user.budgetStartDay);

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col space-y-4 min-h-screen bg-white dark:bg-gray-900 dark:text-white px-4 pt-6 pb-24 max-w-md mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm text-gray-500">Good {getTimeOfTheDay()}</p>
            <p className="font-medium">{user.userName || user?.email}</p>
          </div>
        </div>
        <button
          className="text-gray-500 hover:text-black dark:text-white"
          onClick={() => {
            removeToken();
            window.location.href = logoutUrl;
          }}
        >
          Logout
        </button>
      </header>

      <div className="bg-gradient-to-r from-blue-500 to-blue-400 dark:from-indigo-50 dark:to-indigo-100 dark:text-blue-600  text-white p-4 rounded-xl shadow">
        <div className="flex justify-between text-sm">
          <span>Total expenses ({type})</span>
          <span>
            <select onChange={(e) => setDuration(e.target.value)}>
              <option key="monthly" value="monthly">
                Monthly
              </option>
              <option key="yearly" value="yearly">
                Yearly
              </option>
            </select>
          </span>
        </div>
        <div className="text-3xl font-semibold mt-2">
          {formatCurrency(total || 0, user.currency)}
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
            className="bg-white dark:bg-gray-900 dark:text-white dark:shadow-amber-50 rounded-xl p-4 shadow flex justify-between items-start mb-3"
          >
            <div>
              <p className="font-semibold text-base">{expense?.title}</p>
              {<CategoryComponent category={expense?.category} />}
              <p className="text-xs text-gray-400 mt-1">
                {formatRelativeDate(expense?.updatedAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {formatCurrency(expense?.amount, user.currency)}
              </p>
              <div className="flex justify-end gap-2 mt-2"></div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 text-center text-sm text-gray-500 p-4 rounded-xl">
            <p>You don’t have any expense for this month</p>
            <button className="mt-2 text-blue-500">
              <Link to="/expenses/new">+ Add an expense</Link>
            </button>
          </div>
        )}
      </section>
{/* 
      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Recent Budgets</h3>
          <button className="text-sm text-blue-500">
            <Link to={"/budgets"}>View all</Link>
          </button>
        </div>{" "}
        {budgets?.length === 0 ? (
          <div className="bg-gray-100 text-center text-sm text-gray-500 p-4 rounded-xl">
            <p>You don’t have any budget for this month</p>
            <button className="mt-2 text-blue-500">
              <Link to="/budgets/new">+ Add budget</Link>
            </button>
          </div>
        ) : (
          <BudgetBox budget={budget} currency={currency} showExpense={true} />
        )}
      </section> */}

      <ExpenseChart />
      <FooterNav />
    </div>
  );
}
