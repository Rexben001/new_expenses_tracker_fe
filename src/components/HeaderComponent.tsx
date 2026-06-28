import { Capacitor } from "@capacitor/core";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useItemContext } from "../hooks/useItemContext";

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Home";
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/calendar") return "Calendar";
  if (pathname === "/tasks") return "Tasks";
  if (pathname === "/tasks/new") return "New Task";
  if (pathname.startsWith("/tasks/")) return "Edit Task";
  if (pathname === "/videos") return "iPhone Videos";
  if (pathname === "/how-to") return "How-To";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/expenses/insights") return "Expense Insights";
  if (pathname === "/expenses/new") return "New Expense";
  if (pathname === "/expenses/scan" || pathname === "/expenses/scan-v2") {
    return "Scan Receipt";
  }
  if (pathname.startsWith("/expenses/")) return "Edit Expense";
  if (pathname === "/expenses") return "Expenses";
  if (pathname === "/budgets/new") return "New Budget";
  if (pathname.startsWith("/budgets/") && pathname.endsWith("/edit")) {
    return "Edit Budget";
  }
  if (pathname.startsWith("/budgets/")) return "Budget";
  if (pathname === "/budgets") return "Budgets";
  return "Page";
}

export const HeaderComponent = ({
  children,
  className = "",
  collapsible = true,
  title,
}: {
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  title?: string;
}) => {
  const isNative = Capacitor.isNativePlatform();
  const location = useLocation();

  const { deviceType } = useItemContext();
  const pageTitle = title ?? getPageTitle(location.pathname);
  const storageKey = useMemo(
    () => `header-collapsed:${location.pathname}`,
    [location.pathname]
  );
  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsible || typeof localStorage === "undefined") return false;
    return localStorage.getItem(storageKey) === "true";
  });

  useEffect(() => {
    if (!collapsible || typeof localStorage === "undefined") {
      setCollapsed(false);
      return;
    }

    setCollapsed(localStorage.getItem(storageKey) === "true");
  }, [collapsible, storageKey]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(storageKey, String(next));
      }
      return next;
    });
  };

  const pt = isNative && deviceType === "iphone" ? "pt-10" : "pt-2";
  return (
    <div
      className={`fixed max-w-md mx-auto top-0 px-2.5 left-0 right-0 z-150 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 ${pt} ${
        collapsed ? "pb-1" : "pb-2"
      } w-full shadow-sm transition-[padding] duration-200 ${className}`}
    >
      {collapsible && collapsed && (
        <div className="flex h-8 items-center justify-center px-12 text-sm font-semibold text-gray-800 dark:text-gray-100">
          <span className="max-w-full truncate">{pageTitle}</span>
        </div>
      )}

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ${
          collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        }`}
        aria-hidden={collapsed}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>

      {collapsible && (
        <button
          type="button"
          className="absolute -bottom-3 left-1/2 grid h-6 w-11 -translate-x-1/2 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand top section" : "Collapse top section"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <FiChevronDown /> : <FiChevronUp />}
        </button>
      )}
    </div>
  );
};
