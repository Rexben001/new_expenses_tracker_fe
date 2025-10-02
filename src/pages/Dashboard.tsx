import { Link, useNavigate } from "react-router-dom";
import { useItemContext } from "../hooks/useItemContext";
import {
  formatRelativeDate,
  getTimeOfTheDay,
  getYear,
  getMonth,
  getDefaultBudgetMonthYear,
} from "../services/formatDate";
import { formatCurrency } from "../services/formatCurrency";
import { getTotal } from "../services/item";
import { CategoryComponent } from "../components/Category";
import { ExpenseChart } from "../components/ExpensesChart";
import { FiTrendingDown, FiPieChart, FiTrendingUp } from "react-icons/fi";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import SwipeShell from "../components/SwipeShell";
import { useExpenseFilter } from "../hooks/useExpensesSearch";
import { useBudgetFilter } from "../hooks/useBudgetsSearch";
import { OverviewBoard } from "../components/Overview";

export function Dashboard() {
  const {
    expenses,
    budgets,
    loading,
    user,
    currency,
    fetchExpenses,
    fetchBudgets,
  } = useItemContext();

  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [totalWidth, setTotalWidth] = useState(0);
  const [progressBarClass, setProgressBarClass] = useState(
    "bg-blue-500 h-1.5 rounded-full"
  );
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const auth = useAuth();

  const defaults = useMemo(() => {
    if (user?.budgetStartDay == null) return null;
    return getDefaultBudgetMonthYear(user.budgetStartDay);
  }, [user.budgetStartDay]);

  useEffect(() => {
    if (!defaults) return;
    setMonth((prev) => (prev ? prev : defaults.month));
    setYear((prev) => (prev ? prev : defaults.year));
  }, [defaults]);

  const navigate = useNavigate();

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.userName}`;

  const expense = expenses.find((expense) => !expense.upcoming);

  const _filterExpenses = useExpenseFilter(
    [month],
    year,
    user?.budgetStartDay ?? 1
  );

  const _filterBudgets = useBudgetFilter(
    [month],
    year,
    user?.budgetStartDay ?? 1
  );

  useEffect(() => {
    const total = getTotal(_filterExpenses) ?? 0;
    const totalBudget = getTotal(_filterBudgets) ?? 0;

    const remaining = totalBudget - total;

    const percent = (total / totalBudget) * 100 || 0;

    const totalWidth = percent > 100 ? 100 : percent;

    const progressBarClass =
      percent > 90
        ? "bg-red-500 h-1.5 rounded-full"
        : "bg-blue-500 h-1.5 rounded-full";

    setTotalBudget(totalBudget);
    setTotalExpenses(total);
    setRemaining(remaining);
    setTotalWidth(totalWidth);
    setProgressBarClass(progressBarClass);
  }, [
    _filterBudgets,
    _filterExpenses,
    budgets,
    expenses,
    user?.budgetStartDay,
  ]);

  const [openStats, setOpenStats] = useState(false);

  if (loading || !auth?.authed) return null;

  return (
    <SwipeShell
      toLeft="/expenses"
      refresh={() => {
        fetchExpenses();
        fetchBudgets();
        return Promise.resolve();
      }}
    >
      <HeaderComponent>
        <header className="flex items-center justify-between pb-2">
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
              <p className="text-sm text-gray-500">Good {getTimeOfTheDay()}</p>
              <p className="font-medium">{user?.userName || user?.email}</p>
            </div>
          </div>
          <button
            className="text-gray-500 hover:text-black dark:text-white"
            onClick={() => {
              auth?.logout();
            }}
          >
            Logout
          </button>
        </header>
        <OverviewBoard
          month={month}
          year={year}
          setMonth={setMonth}
          setYear={setYear}
          setOpenStats={setOpenStats}
          totalBudget={totalBudget}
          totalExpenses={totalExpenses}
          currency={currency!}
          remaining={remaining}
          progressBarClass={progressBarClass}
          totalWidth={totalWidth}
        />
      </HeaderComponent>

      <Modal
        open={openStats}
        onClose={() => setOpenStats(false)}
        title="Budget details"
      >
        <div className="space-y-3 text-gray-800 dark:text-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiPieChart className="opacity-70" />
              <span className="text-sm">Budget</span>
            </div>
            <span className="font-semibold">
              {formatCurrency(totalBudget || 0, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiTrendingDown className="opacity-70" />
              <span className="text-sm">Expenses</span>
            </div>
            <span className="font-semibold">
              {formatCurrency(totalExpenses || 0, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="opacity-70" />
              <span className="text-sm">Remaining</span>
            </div>
            <span className="font-semibold">
              {formatCurrency(remaining || 0, currency)}
            </span>
          </div>

          {/* Optional: add a tiny legend/progress */}
          <div className="pt-2">
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
              <div
                className={progressBarClass}
                style={{ width: `${totalWidth}%`, height: "100%" }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {getMonth(user.budgetStartDay)} {getYear()}
            </p>
          </div>

          <button
            onClick={() => setOpenStats(false)}
            className="mt-3 w-full h-10 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </Modal>

      <div className="flex flex-col space-y-4 min-h-screen dark:text-white px-4 pt-6 max-w-md mx-auto mt-35">
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
              className="dark:text-white dark:shadow-amber-50 rounded-xl p-4 shadow flex justify-between items-start mb-3"
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
        <ExpenseChart />
      </div>
      <FooterNav />
    </SwipeShell>
  );
}
