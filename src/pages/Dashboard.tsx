import { Link, useNavigate } from "react-router-dom";
import { useItemContext } from "../hooks/useItemContext";
import {
  formatRelativeDate,
  getTimeOfTheDay,
  getYear,
  getMonth,
} from "../services/formatDate";
import { formatCurrency } from "../services/formatCurrency";
import { LoadingScreen } from "../components/LoadingScreen";
import { removeToken } from "../services/isLoggedIn";
import { logoutUrl } from "../services/getLoginUrl";
import { getMonthlyTotal } from "../services/item";
import { CategoryComponent } from "../components/Category";
import { ExpenseChart } from "../components/ExpensesChart";
import { FiTrendingDown, FiPieChart, FiTrendingUp } from "react-icons/fi";
import { Wrapper } from "../components/Wrapper";
import { HeaderComponent } from "../components/HeaderComponent";

export function Dashboard() {
  const { expenses, budgets, loading, user, currency } = useItemContext();

  const navigate = useNavigate();

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${
    user?.userName ?? "Rexben"
  }`;

  console.log({
    expenses,
    budgets,
    loading,
    user,
  });

  const expense = (expenses || []).find((expense) => !expense.upcoming);
  const total = getMonthlyTotal(expenses, user?.budgetStartDay ?? 1) ?? 0;

  const totalBudget = getMonthlyTotal(budgets, user?.budgetStartDay ?? 1) ?? 0;

  const remaining = totalBudget - total;

  const percent = (total / totalBudget) * 100;

  const totalWidth = percent > 100 ? 100 : percent;

  const progressBarClass =
    percent > 90
      ? "bg-red-500 h-1.5 rounded-full"
      : "bg-blue-500 h-1.5 rounded-full";

  if (loading) return <LoadingScreen />;

  return (
    <Wrapper>
      <div className="flex flex-col space-y-4 min-h-screen bg-white dark:bg-gray-900 dark:text-white px-4 pt-6 pb-24 max-w-md mx-auto">
        <HeaderComponent>
          <header className="flex items-center justify-between pb-1">
            <div
              className="flex items-center gap-3"
              onClick={() => navigate("/settings")}
            >
              <img
                src={avatarUrl}
                alt="User avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm text-gray-500">
                  Good {getTimeOfTheDay()}
                </p>
                <p className="font-medium">{user?.userName || user?.email}</p>
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

          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-indigo-200 dark:to-indigo-300 dark:text-blue-800 text-white px-4 py-3 rounded-xl shadow">
            <span className="absolute top-1.5 right-3 text-[11px] font-medium bg-white/20 dark:bg-blue-600 dark:text-white px-2 py-0.5 rounded-full">
              {getMonth(user.budgetStartDay)} {getYear()}
            </span>

            {/* Stat Row */}
            <div className="flex justify-between items-center text-sm gap-4 pt-4">
              {/* Budget */}
              <div className="flex items-center gap-2 flex-1">
                <FiPieChart className="text-lg opacity-80" />
                <div>
                  <p className="text-xs opacity-80">Budget</p>
                  <span className="font-bold">
                    {formatCurrency(totalBudget || 0, currency)}
                  </span>
                </div>
              </div>

              {/* Expenses */}
              <div className="flex items-center gap-2 flex-1">
                <FiTrendingDown className="text-lg opacity-80" />
                <div>
                  <p className="text-xs opacity-80">Expenses</p>
                  <span className="font-bold">
                    {formatCurrency(total || 0, currency)}
                  </span>
                </div>
              </div>

              {/* Remaining */}
              <div className="flex items-center gap-2 flex-1">
                <FiTrendingUp className="text-lg opacity-80" />
                <div>
                  <p className="text-xs opacity-80">Remaining</p>
                  <span className="font-bold">
                    {formatCurrency(remaining || 0, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full bg-white/30 dark:bg-gray-300 rounded-full h-1 mt-3">
              <div
                className={progressBarClass}
                style={{ width: `${totalWidth}%` }}
              />
            </div>
          </div>
        </HeaderComponent>

        <section className="mx-1">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Recent Expenses</h3>
            <button className="text-sm text-blue-500">
              <Link to={"/expenses"}>View all</Link>
            </button>
          </div>

          {expense ? (
            <div
              key={expense?.id}
              className="bg-white dark:bg-gray-900 dark:text-white dark:shadow-amber-50 rounded-xl p-4 shadow flex justify-between items-start mb-3"
            >
              <div>
                <p className="font-semibold text-base">{expense?.title}</p>
                {<CategoryComponent category={expense.category} />}
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
      </div>
    </Wrapper>
  );
}
