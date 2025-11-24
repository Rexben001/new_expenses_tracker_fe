import { useEffect, useState } from "react";
import { useItemContext } from "../hooks/useItemContext";
import { getTimeOfTheDay } from "../services/formatDate";
import {
  createSubAccount,
  deleteSubAccount,
  updateUser,
} from "../services/api";
import { FiMoon, FiSun, FiUserPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";
import SwipeShell from "../components/SwipeShell";
import type { SubAccount, User } from "../types/user";
import { tokenStore } from "../services/tokenStore";

const CURRENCY_OPTIONS = [
  "EUR",
  "USD",
  "GBP",
  "NGN",
  "CAD",
  "JPY",
  "CNY",
  "AUD",
  "INR",
  "CHF",
  "SEK",
  "NZD",
  "MXN",
  "SGD",
  "HKD",
  "NOK",
  "KRW",
  "TRY",
  "RUB",
  "BRL",
  "ZAR",
];

export function Profile() {
  const {
    user,
    loading,
    fetchUser,
    currentAccount,
    fetchBudgets,
    fetchExpenses,
  } = useItemContext();

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${
    user?.userName ?? user.email
  }`;

  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mainAccount, setMainAccount] = useState<User | undefined>(undefined);

  // NEW state for confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingSub, setDeletingSub] = useState<{
    id: string;
    name?: string;
  } | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  // Open confirm
  const requestDeleteSub = (sub: { subAccountId: string; name?: string }) => {
    setDeletingSub({ id: sub.subAccountId, name: sub.name });
    setConfirmOpen(true);
  };

  // Close confirm
  const cancelDelete = () => {
    setConfirmOpen(false);
    setDeletingSub(null);
  };

  // Confirm + delete (replaces handledDeleteSub usage)
  const confirmDelete = async () => {
    if (!deletingSub?.id) return;
    setDeletingBusy(true);
    try {
      await deleteSubAccount(deletingSub.id);

      // Refresh data & reload screen as you already do elsewhere
      await fetchUser();
      await fetchBudgets(); // optional: refresh main budgets
      await fetchExpenses(); // optional: refresh main expenses
      navigate(0);
    } finally {
      setDeletingBusy(false);
      setConfirmOpen(false);
      setDeletingSub(null);
    }
  };

  useEffect(() => {
    async function fetchSubAccount() {
      const subAccountId = await tokenStore.get("subAccountId");
      if (subAccountId) {
        setMainAccount({
          ...currentAccount?.subAccounts?.[0],
          userName: currentAccount?.subAccounts?.[0].name,
          accountType: "Sub",
        });
      } else {
        setMainAccount(user);
      }
    }
    fetchSubAccount();
  }, [
    currentAccount?.profile.currency,
    currentAccount?.profile?.email,
    currentAccount?.subAccounts,
    user,
  ]);

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.contains("dark");

    setIsDark(!isDark);

    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("color-theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("color-theme", "dark");
    }
  };

  const subAccounts: Array<{
    subAccountId: string;
    name: string;
    currency?: string;
  }> = Array.isArray(currentAccount?.subAccounts)
    ? currentAccount.subAccounts.map((sub: SubAccount) => ({
        subAccountId: sub.subAccountId,
        name: sub.name,
        currency: sub.currency,
      }))
    : [];

  const isSubAccount = user.accountType === "Sub"; // Replace with actual logic to determine if viewing a sub-account
  const currentSub = subAccounts.length > 0 ? subAccounts[0] : undefined; // Replace with actual current sub-account data
  const mainProfile = user; // Main profile data

  const [mainForm, setMainForm] = useState({
    userName: mainAccount?.userName || "",
    currency: mainAccount?.currency || "",
    budgetStartDay: mainAccount?.budgetStartDay || 1,
    // email: mainAccount?.email || "",
  });

  const [subForm, setSubForm] = useState({
    name: mainAccount?.userName || "",
    currency: mainAccount?.currency || "",
    budgetStartDay: mainAccount?.budgetStartDay || 1,
  });

  useEffect(() => {
    setMainForm({
      userName: mainAccount?.userName || "",
      currency: mainAccount?.currency || "",
      budgetStartDay: mainAccount?.budgetStartDay || 1,
      // email: mainAccount?.email || "",
    });
  }, [
    mainAccount?.budgetStartDay,
    mainAccount?.currency,
    mainAccount?.userName,
  ]);

  useEffect(() => {
    setSubForm({
      name: mainAccount?.userName || "",
      currency: mainAccount?.currency || "",
      budgetStartDay: mainAccount?.budgetStartDay || 1,
    });
  }, [
    mainAccount?.currency,
    mainAccount?.userName,
    mainAccount?.budgetStartDay,
  ]);

  const handleMainChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setMainForm({ ...mainForm, [e.target.name]: e.target.value });
  };

  const handleSubChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setSubForm({ ...subForm, [e.target.name]: e.target.value });
  };

  const handleSaveMain = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await updateUser(mainForm);
    await fetchUser();
    setIsSubmitting(false);
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const subAccountId = await tokenStore.get("subAccountId");
    updateUser(subForm, subAccountId!);

    setIsSubmitting(false);
  };
  const handleSwitchToMain = () => {
    // Logic to switch to main account view
    tokenStore.remove("subAccountId");
    fetchUser();
    navigate(0);
  };

  const handleSwitchToSub = async (subAccountId: string) => {
    // Logic to switch to selected sub-account view
    tokenStore.set("subAccountId", subAccountId);
    await fetchUser(subAccountId);
    await fetchBudgets(subAccountId);
    await fetchExpenses(subAccountId);
    navigate(0);
  };

  const handleCreateSub = async () => {
    createSubAccount();
    await fetchUser();
    await fetchBudgets();
    await fetchExpenses();
    navigate(0);
  };

  if (loading) return null;

  return (
    <SwipeShell toRight="/budgets" refresh={fetchUser}>
      <HeaderComponent>
        <header className="flex items-center justify-between">
          <div
            className="flex items-center gap-3"
            onClick={() => navigate("/")}
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full"
            />
            <div className="text-left">
              <p className="text-xs text-gray-500">Good {getTimeOfTheDay()}</p>
              <p className="font-medium">
                {isSubAccount
                  ? currentSub?.name ?? "Sub Account"
                  : mainProfile?.userName}
              </p>
              {isSubAccount ? (
                <span className="text-[10px] text-gray-500">Sub account</span>
              ) : (
                <span className="text-[10px] text-gray-500">Main account</span>
              )}
            </div>
          </div>

          <div
            onClick={toggleDarkMode}
            className="w-14 h-8 flex items-center bg-gray-300 dark:bg-gray-600 rounded-full p-1 cursor-pointer relative transition-colors"
          >
            <div
              className={`w-6 h-6 flex items-center justify-center rounded-full shadow-md transform transition-transform duration-300 ${
                isDark
                  ? "translate-x-6 bg-gray-800 text-yellow-400"
                  : "translate-x-0 bg-yellow-400 text-white"
              }`}
            >
              {isDark ? <FiMoon size={14} /> : <FiSun size={14} />}
            </div>
          </div>
        </header>
      </HeaderComponent>

      <div className="flex flex-col space-y-6 min-h-screen dark:text-white px-4 pt-6 max-w-md mx-auto mt-13">
        {!isSubAccount ? (
          // MAIN ACCOUNT DETAILS
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
            <h2 className="text-base font-semibold mb-4">Main profile</h2>
            <form className="space-y-4" onSubmit={handleSaveMain}>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Username
                </label>
                <input
                  name="userName"
                  value={mainForm.userName}
                  onChange={handleMainChange}
                  placeholder="Enter name"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Currency
                </label>
                <select
                  name="currency"
                  value={mainForm.currency}
                  onChange={handleMainChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="" disabled>
                    Select Currency
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
                  Budget Start Day
                </label>
                <select
                  name="budgetStartDay"
                  value={String(mainForm.budgetStartDay)}
                  onChange={handleMainChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="" disabled>
                    Select Month Start Day
                  </option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((option) => (
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
                  value={mainProfile?.email || ""}
                  disabled
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 font-semibold disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save main settings"}
              </button>
            </form>
          </section>
        ) : (
          // SUB ACCOUNT DETAILS
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
            <h2 className="text-base font-semibold mb-4">Sub account</h2>
            <form className="space-y-4" onSubmit={handleSaveSub}>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Name</label>
                <input
                  name="name"
                  value={subForm.name}
                  onChange={handleSubChange}
                  placeholder="e.g. Default"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Currency
                </label>
                <select
                  name="currency"
                  value={subForm.currency}
                  onChange={handleSubChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="" disabled>
                    Select Currency
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
                  Budget Start Day
                </label>
                <select
                  name="budgetStartDay"
                  value={String(subForm.budgetStartDay)}
                  onChange={handleSubChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="" disabled>
                    Select Month Start Day
                  </option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 font-semibold disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save sub settings"}
                </button>

                <button
                  type="button"
                  onClick={handleSwitchToMain}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-full hover:bg-black font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  Switch to main
                </button>
              </div>
            </form>
          </section>
        )}

        {/* --- Sub Accounts List + Create --- */}
        {!isSubAccount && (
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Sub accounts</h3>
              <span className="text-xs text-gray-500">
                {subAccounts.length} total
              </span>
            </div>

            {subAccounts.length === 0 ? (
              <p className="text-sm text-gray-500">No sub accounts yet.</p>
            ) : (
              <ul className="space-y-2">
                {subAccounts.map((sub) => (
                  <li
                    key={sub.subAccountId}
                    className="flex items-center justify-between p-3 border rounded-xl dark:border-gray-800 gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sub.name}</p>
                      <p className="text-xs text-gray-500">{sub.currency}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSwitchToSub(sub.subAccountId)}
                        className="h-9 px-3 rounded-full bg-blue-600 text-white hover:bg-black text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2"
                        disabled={isSubmitting}
                        title="Switch to this sub account"
                      >
                        Switch
                      </button>

                      <button
                        onClick={() => requestDeleteSub(sub)}
                        className="h-9 px-3 rounded-full bg-red-600 text-white hover:bg-red-700 text-sm font-medium disabled:opacity-60"
                        disabled={isSubmitting}
                        title="Delete sub account"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={handleCreateSub}
              className="mt-4 w-full h-10 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 inline-flex items-center justify-center gap-2 disabled:opacity-60"
              disabled={isSubmitting}
            >
              <FiUserPlus className="w-4 h-4" />
              Create sub account
            </button>
          </section>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelDelete}
          />
          {/* Modal content */}
          <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete sub account?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This will permanently delete
              {deletingSub?.name ? (
                <>
                  {" "}
                  <span className="font-medium">“{deletingSub.name}”</span>
                </>
              ) : (
                <> this sub account</>
              )}
              , including{" "}
              <span className="font-medium">all budgets and expenses</span>{" "}
              associated with it. This action cannot be undone.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 h-10 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                disabled={deletingBusy}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-10 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
                disabled={deletingBusy}
              >
                {deletingBusy ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterNav />
    </SwipeShell>
  );
}
