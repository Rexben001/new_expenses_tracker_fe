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

type FooterGroupKey = "more";

type FooterGroup = {
  key: FooterGroupKey;
  icon: IconType;
  label: string;
  links: FooterLink[];
};

type FooterItem = FooterLink | FooterGroup;

const isGroupItem = (item: FooterItem): item is FooterGroup => "links" in item;

const footerLinks = {
  home: { to: "/", icon: FaHome, label: "Home", end: true },
  dashboard: { to: "/dashboard", icon: FaChartPie, label: "Dashboard" },
  expenses: { to: "/expenses", icon: FaList, label: "Expenses" },
  budgets: { to: "/budgets", icon: FaWallet, label: "Budgets" },
  calendar: {
    to: "/calendar",
    icon: FaCalendarAlt,
    label: "Calendar",
    adminOnly: true,
  },
  tasks: { to: "/tasks", icon: FaTasks, label: "Tasks" },
  settings: { to: "/settings", icon: FaTools, label: "Settings" },
  howTo: {
    to: "/how-to",
    icon: FaQuestionCircle,
    label: "How-To",
    adminOnly: true,
  },
  videos: {
    to: "/videos",
    icon: FaVideo,
    label: "iPhone Videos",
    adminOnly: true,
  },
} satisfies Record<string, FooterLink>;

const gridClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export function FooterNav({ className = "" }: { className?: string }) {
  const { user } = useItemContext();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<FooterGroupKey | null>(null);
  const isAdmin = isAdminEmail(user?.email);

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

  const navItems = useMemo<FooterItem[]>(() => {
    const canShow = (link: FooterLink) => !link.adminOnly || isAdmin;
    const visible = (links: FooterLink[]) => links.filter(canShow);
    const withMore = (
      primaryLinks: FooterLink[],
      moreLinks: FooterLink[]
    ): FooterItem[] => {
      const primary = visible(primaryLinks);
      const primaryPaths = new Set(primary.map((link) => link.to));
      const menuLinks = visible(moreLinks).filter(
        (link) => !primaryPaths.has(link.to)
      );

      if (!menuLinks.length) return primary;
      return [
        ...primary,
        {
          key: "more",
          icon: FaEllipsisH,
          label: "More",
          links: menuLinks,
        },
      ];
    };

    const pathname = location.pathname;
    const isExpensesSection =
      pathname === "/dashboard" ||
      pathname.startsWith("/expenses") ||
      pathname.startsWith("/budgets");

    if (isExpensesSection) {
      return withMore(
        [
          footerLinks.home,
          footerLinks.dashboard,
          footerLinks.expenses,
          footerLinks.budgets,
        ],
        [
          footerLinks.settings,
          footerLinks.calendar,
          footerLinks.tasks,
          footerLinks.howTo,
          footerLinks.videos,
        ]
      );
    }

    if (pathname.startsWith("/tasks")) {
      return visible([footerLinks.home, footerLinks.tasks, footerLinks.settings]);
    }

    if (pathname.startsWith("/calendar")) {
      return visible([
        footerLinks.home,
        footerLinks.calendar,
        footerLinks.settings,
      ]);
    }

    if (pathname.startsWith("/how-to")) {
      return visible([footerLinks.home, footerLinks.howTo, footerLinks.settings]);
    }

    if (pathname.startsWith("/videos")) {
      return visible([footerLinks.home, footerLinks.videos, footerLinks.settings]);
    }

    if (pathname.startsWith("/settings")) {
      return withMore(
        [footerLinks.home, footerLinks.settings],
        [
          footerLinks.dashboard,
          footerLinks.expenses,
          footerLinks.budgets,
          footerLinks.tasks,
          footerLinks.calendar,
          footerLinks.howTo,
          footerLinks.videos,
        ]
      );
    }

    return withMore(
      [footerLinks.home, footerLinks.dashboard, footerLinks.tasks],
      [
        footerLinks.expenses,
        footerLinks.budgets,
        footerLinks.settings,
        footerLinks.calendar,
        footerLinks.howTo,
        footerLinks.videos,
      ]
    );
  }, [isAdmin, location.pathname]);

  const gridClass = gridClasses[Math.min(Math.max(navItems.length, 1), 5)];
  const itemClass =
    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-1.5 text-[11px] font-medium leading-tight transition";
  const inactiveClass =
    "text-gray-500 hover:bg-white/70 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-800";
  const activeClass =
    "bg-white text-blue-700 shadow-sm dark:bg-gray-800 dark:text-blue-200";
  const groupMenuClass =
    "absolute bottom-20 z-50 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 text-sm shadow-xl dark:border-gray-800 dark:bg-gray-900";

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

  const renderLink = ({ to, icon: Icon, label, end }: FooterLink) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        `h-14 ${itemClass} ${isActive ? activeClass : inactiveClass}`
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="block max-w-full truncate leading-4">{label}</span>
    </NavLink>
  );

  const renderGroup = ({ key, icon: Icon, label, links }: FooterGroup) => {
    const isActive = links.some(isLinkActive);

    return (
      <div key={key} className="relative">
        {openGroup === key && renderGroupMenu(links, "right")}
        <button
          type="button"
          className={`h-14 w-full ${itemClass} ${
            isActive || openGroup === key ? activeClass : inactiveClass
          }`}
          onClick={() =>
            setOpenGroup((current) => (current === key ? null : key))
          }
          aria-expanded={openGroup === key}
          aria-haspopup="menu"
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="flex max-w-full items-center gap-0.5 truncate leading-4">
            {label}
            <FiChevronUp
              className={`h-3 w-3 shrink-0 transition-transform ${
                openGroup === key ? "rotate-0" : "rotate-180"
              }`}
            />
          </span>
        </button>
      </div>
    );
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-md bg-gradient-to-br from-slate-50 to-blue-50 px-2 pb-4 pt-2 text-sm shadow-inner dark:from-gray-900 dark:to-gray-950 dark:text-white ${className}`}
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className={`grid ${gridClass} gap-1.5`}>
        {navItems.map((item) =>
          isGroupItem(item) ? renderGroup(item) : renderLink(item)
        )}
      </div>
    </nav>
  );
}
