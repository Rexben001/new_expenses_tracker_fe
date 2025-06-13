import { FaHome, FaList, FaWallet, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";

export function FooterNav({ page }: { page?: string }) {
  const activeClass = "text-blue-600";
  const inactiveClass = "text-gray-500 hover:text-gray-800";

  const currentPage = page || window.location.pathname;
  const currentPageName = currentPage.split("/").pop();

  const getLinkClass = (page: string) => {
    const toPageName = page.split("/").pop();
    return currentPageName === toPageName ? activeClass : inactiveClass;
  };

  
  const NavMenuLink = ({
    to,
    icon: Icon,
    label,
    className,
  }: {
    to: string;
    icon: React.ElementType;
    label: string;
    className?: string;
  }) => (
    <Link to={to} className={`flex flex-col items-center ${className ?? ""}`}>
      <Icon className="text-lg" />
      <span className="text-xs">{label}</span>
    </Link>
  );

  const links = [
    { to: "/", icon: FaHome, label: "Home" },
    { to: "/expenses", icon: FaList, label: "Expenses" },
    { to: "/budgets", icon: FaWallet, label: "Budgets" },
    { to: "/profile", icon: FaUser, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-inner h-16 flex justify-around items-center text-gray-500 text-sm">
      {links.map(({ to, icon, label }) => (
        <NavMenuLink
          key={to}
          to={to}
          icon={icon}
          label={label}
          className={getLinkClass(to)}
        />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
    </nav>
  );
}
