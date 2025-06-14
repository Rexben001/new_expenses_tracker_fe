import { FooterNav } from "../components/FooterNav";
import { useEffect, useState } from "react";
import { useItemContext } from "../hooks/useItemContext";
import { getTimeOfTheDay } from "../services/formatDate";
import { LoadingScreen } from "../components/LoadingScreen";
import { updateUser } from "../services/api";

const CURRENCY_OPTIONS = ["EUR", "USD", "NGN", "CAD"];

export function Profile() {
  const { user, loading, fetchUser } = useItemContext();

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${user.userName}`;

  const [formData, setFormData] = useState({
    userName: user?.userName,
    currency: user?.currency,
    colorMode: user?.colorMode,
  });

  useEffect(() => {
    setFormData({
      userName: user?.userName,
      currency: user?.currency,
      colorMode: user?.colorMode,
    });
  }, [user?.colorMode, user?.currency, user?.userName]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateUser(formData);

    await fetchUser();
  };

  useEffect(() => {
    // Apply or remove dark mode class
    document.documentElement.classList.toggle(
      "dark",
      user?.colorMode === "Dark"
    );
  }, [user]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col space-y-4 min-h-screen bg-white dark:bg-gray-900 dark:text-white px-4 pt-6 pb-24 max-w-md mx-auto">
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

        <button onClick={() => setDarkMode(!darkMode)}>🌒</button>
      </header>

      <section>
        <div className="flex justify-between items-center mb-2">
          <form className="space-y-6 w-full" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm dark:text-white  text-gray-500 mb-1 block">
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
              <label className="text-sm dark:text-white  text-gray-500 mb-1 block">
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
              <label className="text-sm dark:text-white  text-gray-500 mb-1 block">
                Color Mode
              </label>
              <select
                name="colorMode"
                value={formData.colorMode}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select Color Mode
                </option>
                {["Dark", "Light"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm dark:text-white  text-gray-500 mb-1 block">
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

      <FooterNav />
    </div>
  );
}
