import { Link, useNavigate } from "react-router-dom";
import { FaList, FaTasks, FaTools } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";
import SwipeShell from "../components/SwipeShell";
import { useAuth } from "../context/AuthContext";
import { useItemContext } from "../hooks/useItemContext";
import { getTimeOfTheDay } from "../services/formatDate";

const homeLinks = [
  {
    to: "/dashboard",
    label: "Expenses Tracker",
    icon: FaList,
    color: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200",
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: FaTasks,
    color:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
  },
  {
    to: "/settings",
    label: "Settings",
    icon: FaTools,
    color:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
  },
];

export function HomePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { user, fetchExpenses, fetchBudgets, fetchTasks } = useItemContext();
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.userName}`;

  if (!auth?.authed) return null;

  return (
    <SwipeShell
      toLeft="/dashboard"
      refresh={async () => {
        await Promise.all([fetchExpenses(), fetchBudgets(), fetchTasks()]);
      }}
    >
      <HeaderComponent>
        <header className="flex items-center justify-between pb-2">
          <button
            type="button"
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() => navigate("/settings")}
          >
            <img
              src={avatarUrl}
              alt="User avatar"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm text-gray-500">
                Good {getTimeOfTheDay()}
              </p>
              <p className="truncate font-medium">
                {user?.userName || user?.email}
              </p>
            </div>
          </button>
          <button
            className="text-gray-500 hover:text-black dark:text-white"
            onClick={() => auth.logout()}
          >
            Logout
          </button>
        </header>
      </HeaderComponent>

      <main className="mx-auto mt-24 min-h-screen max-w-md px-4 pt-6 dark:text-white">
        <div className="grid gap-3">
          {homeLinks.map(({ to, label, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              aria-label={`Open ${label}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-gray-950 dark:text-gray-50">
                    {label}
                  </p>
                </div>
                <FiArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </main>
      <FooterNav />
    </SwipeShell>
  );
}
