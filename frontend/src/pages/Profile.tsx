import { FooterNav } from "../components/FooterNav";
import { useState } from "react";
import { useItemContext } from "../hooks/useItemContext";
import { getMonth, getTimeOfTheDay } from "../services/formatDate";
import { formatCurrency } from "../services/formatCurrency";
import { LoadingScreen } from "../components/LoadingScreen";
import { updateUser } from "../services/api";

const CURRENCY_OPTIONS = ["EUR", "USD", "NGN", "CAD"];

export function Profile() {
  const avatarUrl = "https://i.pravatar.cc/100";

  const { user, loading, currentMonthExpensesTotal } = useItemContext();

  const [formData, setFormData] = useState({
    userName: user.userName || user.email,
    currency: user.currency,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateUser(formData);
    window.location.reload();
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="p-4 space-y-6 max-w-md mx-6 flex-grow pb-24">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-sm text-gray-500">Good {getTimeOfTheDay()}</p>
              <p className="font-medium">{user?.userName}</p>
            </div>
          </div>
        </header>

        <div className="bg-gradient-to-r from-blue-500 to-blue-400 text-white p-4 rounded-xl shadow">
          <div className="flex justify-between text-sm">
            <span>Total expenses ({getMonth()})</span>
            <span>Monthly</span>
          </div>
          <div className="text-3xl font-semibold mt-2">
            {formatCurrency(currentMonthExpensesTotal, user.currency)}
          </div>
        </div>

        <section>
          <div className="flex justify-between items-center mb-2">
            <form className="space-y-6 w-full" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  UserName
                </label>
                <input
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  placeholder="Enter name"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Select period
                  </option>
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Email Address
                </label>
                <input
                  name="email"
                  value={user?.email}
                  onChange={handleChange}
                  disabled={true}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 font-semibold"
              >
                Update Profile
              </button>
            </form>
          </div>
        </section>
      </div>

      <FooterNav />
    </div>
  );
}
