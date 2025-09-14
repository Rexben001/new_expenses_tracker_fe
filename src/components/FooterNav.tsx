import { FaHome, FaList, FaWallet, FaTools } from "react-icons/fa";
import { NavLink } from "react-router-dom";

export function FooterNav() {
  const active = "text-blue-600";
  const inactive = "text-gray-500 dark:text-white";
  const base = "flex flex-col items-center";

  const links = [
    { to: "/", icon: FaHome, label: "Home", end: true }, // end=true so "/" doesn’t match everything
    { to: "/expenses", icon: FaList, label: "Expenses" },
    { to: "/budgets", icon: FaWallet, label: "Budgets" },
    { to: "/settings", icon: FaTools, label: "Settings" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 dark:text-white border-t shadow-inner h-16 flex justify-around items-center text-sm max-w-md mx-auto w-full"
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
          <Icon className="text-lg" />
          <span className="text-xs">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
