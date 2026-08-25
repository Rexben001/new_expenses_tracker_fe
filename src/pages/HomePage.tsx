import { Link, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCalendarWeek,
  FaList,
  FaQuestionCircle,
  FaTasks,
  FaTools,
  FaUtensils,
  FaShoppingBasket,
  FaVideo,
} from "react-icons/fa";
import { FiArrowRight, FiEye, FiEyeOff, FiSliders } from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";
import SwipeShell from "../components/SwipeShell";
import { useAuth } from "../context/AuthContext";
import { useItemContext } from "../hooks/useItemContext";
import { isAdminEmail } from "../services/admin";
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
    to: "/food",
    label: "Food Tracker",
    icon: FaUtensils,
    color:
      "bg-lime-50 text-lime-700 dark:bg-lime-950/50 dark:text-lime-200",
  },
  {
    to: "/food/timetable",
    label: "Food Timetable",
    icon: FaCalendarWeek,
    color:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200",
  },
  {
    to: "/shopping",
    label: "Shopping List",
    icon: FaShoppingBasket,
    color:
      "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-200",
  },
  {
    to: "/calendar",
    label: "Calendar",
    icon: FaCalendarAlt,
    color: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200",
    adminOnly: true,
  },
  {
    to: "/videos",
    label: "iPhone Videos",
    icon: FaVideo,
    color: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-200",
    adminOnly: true,
  },
  {
    to: "/how-to",
    label: "How-To",
    icon: FaQuestionCircle,
    color:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200",
    adminOnly: true,
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
  const { user, fetchExpenses, fetchBudgets, fetchTasks, fetchFoodItems, fetchCalendarEntries } =
    useItemContext();
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.userName}`;
  const isAdmin = isAdminEmail(user?.email);
  const [editingServices, setEditingServices] = useState(false);
  const [hiddenServices, setHiddenServices] = useState<Set<string>>(new Set());
  const serviceStorageKey = `hidden-home-services:${user?.id ?? user?.email ?? "default"}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(serviceStorageKey) ?? "[]");
      setHiddenServices(new Set(Array.isArray(saved) ? saved : []));
    } catch {
      setHiddenServices(new Set());
    }
  }, [serviceStorageKey]);

  const availableHomeLinks = useMemo(
    () => homeLinks.filter((link) => !link.adminOnly || isAdmin),
    [isAdmin]
  );
  const visibleHomeLinks = editingServices
    ? availableHomeLinks
    : availableHomeLinks.filter((link) => !hiddenServices.has(link.to));

  const toggleService = (path: string) => {
    setHiddenServices((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      localStorage.setItem(serviceStorageKey, JSON.stringify([...next]));
      return next;
    });
  };

  if (!auth?.authed) return null;

  return (
    <SwipeShell
      toLeft="/dashboard"
      refresh={async () => {
        const refreshers = [
          fetchExpenses(),
          fetchBudgets(),
          fetchTasks(),
          fetchFoodItems(),
        ];
        if (isAdmin) refreshers.push(fetchCalendarEntries());
        await Promise.all(refreshers);
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

      <main className="mx-auto min-h-screen max-w-md px-4 pt-[calc(var(--app-header-height,6rem)+1.5rem)] transition-[padding-top] duration-200 dark:text-white">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold">Services</h1>
            {hiddenServices.size > 0 && !editingServices && <p className="text-xs text-gray-500">{hiddenServices.size} hidden</p>}
          </div>
          <button type="button" onClick={() => setEditingServices((value) => !value)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${editingServices ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"}`}>
            <FiSliders /> {editingServices ? "Done" : "Edit services"}
          </button>
        </div>
        {editingServices && <p className="mb-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">Tap any service to hide or show it. Hidden services remain accessible from contextual bottom menus.</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibleHomeLinks.map(({ to, label, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              onClick={(event) => {
                if (!editingServices) return;
                event.preventDefault();
                toggleService(to);
              }}
              className={`relative flex min-h-32 flex-col justify-between rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 ${hiddenServices.has(to) ? "border-dashed border-gray-300 opacity-50 dark:border-gray-700" : "border-gray-200 dark:border-gray-800"}`}
              aria-label={editingServices ? `${hiddenServices.has(to) ? "Show" : "Hide"} ${label}` : `Open ${label}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                {editingServices ? (hiddenServices.has(to) ? <FiEye className="h-5 w-5 text-emerald-600" /> : <FiEyeOff className="h-5 w-5 text-red-500" />) : <FiArrowRight className="h-5 w-5 shrink-0 text-gray-400" />}
              </div>
              <p className="mt-4 text-sm font-semibold leading-tight text-gray-950 dark:text-gray-50">
                {label}
              </p>
              {editingServices && <span className="mt-1 text-xs font-medium text-gray-500">{hiddenServices.has(to) ? "Hidden · tap to show" : "Visible · tap to hide"}</span>}
            </Link>
          ))}
        </div>
      </main>
      <FooterNav />
    </SwipeShell>
  );
}
