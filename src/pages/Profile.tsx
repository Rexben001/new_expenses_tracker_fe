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

const cardClass =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300";
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:disabled:bg-gray-800";
const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-800";
const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60";

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
    fetchTasks,
  } = useItemContext();

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${
    user?.userName ?? user.email
  }`;

  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mainAccount, setMainAccount] = useState<User | undefined>(undefined);
  const [activeSubAccountId, setActiveSubAccountId] = useState<string | null>(
    null
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingSub, setDeletingSub] = useState<{
    id: string;
    name?: string;
  } | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const requestDeleteSub = (sub: { subAccountId: string; name?: string }) => {
    setDeletingSub({ id: sub.subAccountId, name: sub.name });
    setConfirmOpen(true);
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setDeletingSub(null);
  };

  const confirmDelete = async () => {
    if (!deletingSub?.id) return;
    setDeletingBusy(true);
    try {
      await deleteSubAccount(deletingSub.id);

      await fetchUser();
      await fetchBudgets();
      await fetchExpenses();
      await fetchTasks();
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
      setActiveSubAccountId(subAccountId);

      if (subAccountId) {
        const activeSubAccount =
          currentAccount?.subAccounts?.find(
            (sub) => sub.subAccountId === subAccountId
          ) ?? currentAccount?.subAccounts?.[0];

        setMainAccount({
          ...activeSubAccount,
          userName: activeSubAccount?.name,
          accountType: "Sub",
        });
      } else {
        setActiveSubAccountId(null);
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

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

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

  const isSubAccount = Boolean(activeSubAccountId) || user.accountType === "Sub";
  const currentSub =
    subAccounts.find((sub) => sub.subAccountId === activeSubAccountId) ??
    subAccounts[0];
  const mainProfile = user;

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
    const value =
      e.target.name === "budgetStartDay"
        ? Number(e.target.value)
        : e.target.value;
    setMainForm({ ...mainForm, [e.target.name]: value });
  };

  const handleSubChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value =
      e.target.name === "budgetStartDay"
        ? Number(e.target.value)
        : e.target.value;
    setSubForm({ ...subForm, [e.target.name]: value });
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
    await updateUser(subForm, subAccountId!);
    await fetchUser(subAccountId ?? undefined);

    setIsSubmitting(false);
  };
  const handleSwitchToMain = async () => {
    setIsSubmitting(true);
    try {
      await tokenStore.remove("subAccountId");
      setActiveSubAccountId(null);
      await Promise.all([
        fetchUser(),
        fetchBudgets(),
        fetchExpenses(),
        fetchTasks(),
      ]);
      navigate(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToSub = async (subAccountId: string) => {
    setIsSubmitting(true);
    try {
      await tokenStore.set("subAccountId", subAccountId);
      setActiveSubAccountId(subAccountId);
      await fetchUser(subAccountId);
      await fetchBudgets(subAccountId);
      await fetchExpenses(subAccountId);
      await fetchTasks(subAccountId);
      navigate(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSub = async () => {
    setIsSubmitting(true);
    try {
      await createSubAccount();
      await fetchUser();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <SwipeShell toRight="/" refresh={fetchUser}>
      <HeaderComponent>
        <header className="flex items-center justify-between pb-2">
          <button
            type="button"
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() => navigate("/")}
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Good {getTimeOfTheDay()}</p>
              <p className="truncate font-medium">
                {isSubAccount
                  ? currentSub?.name ?? "Sub Account"
                  : mainProfile?.userName}
              </p>
              <span className="text-xs text-gray-500">
                {isSubAccount ? "Sub account" : "Main account"}
              </span>
            </div>
          </button>

          <button
            type="button"
            aria-label="Toggle color theme"
            onClick={toggleDarkMode}
            className="relative flex h-8 w-14 items-center rounded-full bg-gray-200 p-1 transition-colors dark:bg-gray-700"
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-transform duration-300 ${
                isDark
                  ? "translate-x-6 bg-gray-900 text-yellow-300"
                  : "translate-x-0 bg-white text-yellow-600"
              }`}
            >
              {isDark ? <FiMoon size={14} /> : <FiSun size={14} />}
            </div>
          </button>
        </header>
      </HeaderComponent>

      <main className="mx-auto mt-24 flex min-h-screen max-w-md flex-col gap-4 px-4 pb-28 pt-6 dark:text-white">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
            Settings
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950 dark:text-gray-50">
            Account preferences
          </h1>
        </div>

        {!isSubAccount ? (
          <section className={cardClass}>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-950 dark:text-gray-50">
                Main profile
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Used for expenses, budgets, and tasks.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleSaveMain}>
              <div>
                <label className={labelClass}>Username</label>
                <input
                  name="userName"
                  value={mainForm.userName}
                  onChange={handleMainChange}
                  placeholder="Enter name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Currency</label>
                <select
                  name="currency"
                  value={mainForm.currency}
                  onChange={handleMainChange}
                  className={inputClass}
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
                <label className={labelClass}>Budget start day</label>
                <select
                  name="budgetStartDay"
                  value={String(mainForm.budgetStartDay)}
                  onChange={handleMainChange}
                  className={inputClass}
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
                <label className={labelClass}>Email address</label>
                <input
                  name="email"
                  value={mainProfile?.email || ""}
                  disabled
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                className={`${primaryButtonClass} w-full`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save main settings"}
              </button>
            </form>
          </section>
        ) : (
          <section className={cardClass}>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-950 dark:text-gray-50">
                Sub account
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                These settings only apply while this account is active.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleSaveSub}>
              <div>
                <label className={labelClass}>Name</label>
                <input
                  name="name"
                  value={subForm.name}
                  onChange={handleSubChange}
                  placeholder="e.g. Default"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Currency</label>
                <select
                  name="currency"
                  value={subForm.currency}
                  onChange={handleSubChange}
                  className={inputClass}
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
                <label className={labelClass}>Budget start day</label>
                <select
                  name="budgetStartDay"
                  value={String(subForm.budgetStartDay)}
                  onChange={handleSubChange}
                  className={inputClass}
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

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save sub settings"}
                </button>

                <button
                  type="button"
                  onClick={handleSwitchToMain}
                  className={secondaryButtonClass}
                  disabled={isSubmitting}
                >
                  Switch to main
                </button>
              </div>
            </form>
          </section>
        )}

        {!isSubAccount && (
          <section className={cardClass}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-950 dark:text-gray-50">
                  Sub accounts
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Switch between separate spending and task spaces.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {subAccounts.length} total
              </span>
            </div>

            {subAccounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800">
                No sub accounts yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {subAccounts.map((sub) => (
                  <li
                    key={sub.subAccountId}
                    className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-950 dark:text-gray-50">
                        {sub.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sub.currency || "No currency"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                      <button
                        type="button"
                        onClick={() => handleSwitchToSub(sub.subAccountId)}
                        className={secondaryButtonClass}
                        disabled={isSubmitting}
                        title="Switch to this sub account"
                      >
                        Switch
                      </button>

                      <button
                        type="button"
                        onClick={() => requestDeleteSub(sub)}
                        className={dangerButtonClass}
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
              type="button"
              onClick={handleCreateSub}
              className={`${primaryButtonClass} mt-4 w-full gap-2`}
              disabled={isSubmitting}
            >
              <FiUserPlus className="w-4 h-4" />
              Create sub account
            </button>
          </section>
        )}
      </main>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelDelete}
          />
          <div className="relative z-10 w-[90%] max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-semibold text-gray-950 dark:text-gray-50">
              Delete sub account?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This will permanently delete
              {deletingSub?.name ? (
                <>
                  {" "}
                  <span className="font-medium">"{deletingSub.name}"</span>
                </>
              ) : (
                <> this sub account</>
              )}
              , including{" "}
              <span className="font-medium">all budgets and expenses</span>{" "}
              associated with it. This action cannot be undone.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                className={secondaryButtonClass}
                disabled={deletingBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className={dangerButtonClass}
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

// TODO: clear local storage on sub-account delete, on logout
