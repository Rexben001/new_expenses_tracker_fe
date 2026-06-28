import {
  FaCalendarAlt,
  FaChartPie,
  FaEllipsisH,
  FaHome,
  FaList,
  FaQuestionCircle,
  FaTasks,
  FaTools,
  FaVideo,
  FaWallet,
} from "react-icons/fa";
import { FiChevronUp } from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { NavLink, useLocation } from "react-router-dom";
import { useItemContext } from "../hooks/useItemContext";
import { isAdminEmail } from "../services/admin";

type FooterLink = {
  to: string;
  icon: IconType;
  label: string;
  end?: boolean;
  adminOnly?: boolean;
};

type FooterGroupKey = "expenses" | "more";

export function FooterNav({ className = "" }: { className?: string }) {
  const { user } = useItemContext();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<FooterGroupKey | null>(null);

  const expensesLinks: FooterLink[] = [
    { to: "/dashboard", icon: FaChartPie, label: "Dashboard" },
    { to: "/expenses", icon: FaList, label: "Expenses" },
    { to: "/budgets", icon: FaWallet, label: "Budgets" },
  ];

  const moreLinks = useMemo<FooterLink[]>(
    () =>
      (
        [
          { to: "/settings", icon: FaTools, label: "Settings" },
          {
            to: "/how-to",
            icon: FaQuestionCircle,
            label: "How-To",
            adminOnly: true,
          },
          {
            to: "/videos",
            icon: FaVideo,
            label: "iPhone Videos",
            adminOnly: true,
          },
        ] satisfies FooterLink[]
      ).filter((link) => !link.adminOnly || isAdminEmail(user?.email)),
    [user?.email]
  );

  const showCalendar = isAdminEmail(user?.email);

  useEffect(() => {
    setOpenGroup(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!openGroup) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenGroup(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [openGroup]);

  const isLinkActive = (link: FooterLink) =>
    link.end
      ? location.pathname === link.to
      : location.pathname === link.to ||
        location.pathname.startsWith(`${link.to}/`);

  const isExpensesActive = expensesLinks.some(isLinkActive);
  const isMoreActive = moreLinks.some(isLinkActive);
  const gridClass = showCalendar ? "grid-cols-5" : "grid-cols-4";
  const itemClass =
    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-medium leading-none transition";
  const inactiveClass =
    "text-gray-500 hover:bg-white/70 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-800";
  const activeClass =
    "bg-white text-blue-700 shadow-sm dark:bg-gray-800 dark:text-blue-200";
  const groupMenuClass =
    "absolute bottom-14 z-50 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 text-sm shadow-xl dark:border-gray-800 dark:bg-gray-900";

  const renderGroupMenu = (links: FooterLink[], align: "left" | "right") => (
    <div
      role="menu"
      className={`${groupMenuClass} ${align === "left" ? "left-0" : "right-0"}`}
    >
      {links.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-left ${
              isActive
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800"
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </div>
  );

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 mx-auto h-16 w-full max-w-md bg-gradient-to-br from-slate-50 to-blue-50 px-2 pt-1.5 text-sm shadow-inner dark:from-gray-900 dark:to-gray-950 dark:text-white ${className}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className={`grid h-full ${gridClass} gap-1.5`}>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `h-12 ${itemClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <FaHome className="h-5 w-5 shrink-0" />
          <span className="max-w-full truncate">Home</span>
        </NavLink>

        <div className="relative">
          {openGroup === "expenses" && renderGroupMenu(expensesLinks, "left")}
          <button
            type="button"
            className={`h-12 w-full ${itemClass} ${
              isExpensesActive || openGroup === "expenses"
                ? activeClass
                : inactiveClass
            }`}
            onClick={() =>
              setOpenGroup((current) =>
                current === "expenses" ? null : "expenses"
              )
            }
            aria-expanded={openGroup === "expenses"}
            aria-haspopup="menu"
          >
            <FaWallet className="h-5 w-5 shrink-0" />
            <span className="flex max-w-full items-center gap-0.5 truncate">
              Expenses
              <FiChevronUp
                className={`h-3 w-3 shrink-0 transition-transform ${
                  openGroup === "expenses" ? "rotate-0" : "rotate-180"
                }`}
              />
            </span>
          </button>
        </div>

        {showCalendar && (
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `h-12 ${itemClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <FaCalendarAlt className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate">Calendar</span>
          </NavLink>
        )}

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `h-12 ${itemClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <FaTasks className="h-5 w-5 shrink-0" />
          <span className="max-w-full truncate">Tasks</span>
        </NavLink>

        <div className="relative">
          {openGroup === "more" && renderGroupMenu(moreLinks, "right")}
          <button
            type="button"
            className={`h-12 w-full ${itemClass} ${
              isMoreActive || openGroup === "more" ? activeClass : inactiveClass
            }`}
            onClick={() =>
              setOpenGroup((current) => (current === "more" ? null : "more"))
            }
            aria-expanded={openGroup === "more"}
            aria-haspopup="menu"
          >
            <FaEllipsisH className="h-5 w-5 shrink-0" />
            <span className="flex max-w-full items-center gap-0.5 truncate">
              More
              <FiChevronUp
                className={`h-3 w-3 shrink-0 transition-transform ${
                  openGroup === "more" ? "rotate-0" : "rotate-180"
                }`}
              />
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
