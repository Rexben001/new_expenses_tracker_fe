import { FaChartPie, FaHome, FaList, FaTasks, FaWallet } from "react-icons/fa";
import { NavLink } from "react-router-dom";

export function FooterNav() {
  const active = "text-blue-600";
  const inactive = "text-gray-500 dark:text-white";
  const base = "flex flex-col items-center";

  const links = [
    { to: "/", icon: FaHome, label: "Home", end: true }, // end=true so "/" doesn’t match everything
    { to: "/dashboard", icon: FaChartPie, label: "Dashboard" },
    { to: "/expenses", icon: FaList, label: "Expenses" },
    { to: "/budgets", icon: FaWallet, label: "Budgets" },
    { to: "/tasks", icon: FaTasks, label: "Tasks" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 dark:text-white shadow-inner h-16 flex justify-around items-center text-sm max-w-md mx-auto w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-950"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {links.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <Icon className="text-xl pt-0.5" />
          <span className="text-xs">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
