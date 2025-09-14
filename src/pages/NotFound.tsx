import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import { FaList, FaWallet } from "react-icons/fa";
import { Wrapper } from "../components/Wrapper";
import { HeaderComponent } from "../components/HeaderComponent";

export default function NotFound() {
  return (
    <Wrapper>
      <div className="relative min-h-screen bg-white dark:bg-gray-900 dark:text-white px-4 pt-6 max-w-md mx-auto">
        {/* Sticky header (matches your pages) */}
        <HeaderComponent>
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Page Not Found</h1>
              <Link
                to="/"
                className="text-blue-600 dark:text-blue-400 text-sm font-semibold"
              >
                Home
              </Link>
            </div>
          </div>
        </HeaderComponent>

        {/* Hero / Illustration */}
        <div className="mt-6 flex flex-col items-center text-center">
          {/* Shimmer gradient badge */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20 blur-2xl animate-pulse" />
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2 text-white text-xs font-bold shadow dark:from-indigo-400 dark:to-purple-500">
              404 · Not in the budget
            </div>
          </div>

          {/* Piggy + coins (SVG + tiny CSS animation) */}
          <div className="relative mt-5 h-28 w-28 select-none">
            <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow">
              <defs>
                <linearGradient id="pigGrad" x1="0" x2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="url(#pigGrad)"
                opacity="0.08"
              />
              <path
                d="M50 118c0-28 28-50 63-50 22 0 41 8 50 20 9 1 18 9 18 16s-6 15-14 16c-3 19-20 35-41 41-7 2-14 3-22 3-28 0-49-14-49-31 0-6 1-10 3-14-2-1-3-2-3-1z"
                className="fill-blue-500 dark:fill-indigo-400"
              />
              <rect
                x="97"
                y="72"
                width="30"
                height="6"
                rx="3"
                className="fill-blue-900/40 dark:fill-indigo-950/50"
              />
              <circle cx="112" cy="60" r="8" className="fill-amber-300" />
            </svg>

            {/* Bouncing coins */}
            <span className="pointer-events-none absolute left-1/3 -top-2 h-3 w-3 rounded-full bg-amber-300 shadow animate-[coin_1.6s_ease-in-out_infinite]" />
            <span className="pointer-events-none absolute right-1/4 -top-3 h-2.5 w-2.5 rounded-full bg-amber-400 shadow animate-[coin_1.8s_ease-in-out_infinite_200ms]" />
            <span className="pointer-events-none absolute left-1/2 -top-4 h-2 w-2 rounded-full bg-amber-200 shadow animate-[coin_1.7s_ease-in-out_infinite_400ms]" />
          </div>

          <h2 className="mt-3 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Oops — we couldn’t find that page
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            No worries! Try one of these actions to get back on track.
          </p>

          {/* Quick actions (mobile-first grid) */}
          <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              to="/"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md dark:bg-white dark:text-slate-900"
            >
              <FiHome className="transition-transform group-hover:-translate-y-0.5" />
              Home
            </Link>
            <Link
              to="/expenses/new"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 hover:shadow-md"
            >
              <FaList className="transition-transform group-hover:rotate-12" />
              Add Expense
            </Link>
            <Link
              to="/budgets"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 hover:shadow-md dark:bg-blue-500"
            >
              <FaWallet className="transition-transform group-hover:-translate-y-0.5" />
              Budgets
            </Link>
          </div>

          {/* Helpful hints / links */}
          <div className="mt-6 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-left text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <p className="font-semibold mb-1">Tips</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Use the bottom nav to jump between Budgets and Expenses.</li>
              <li>Tap “Add Expense” to quickly log a transaction.</li>
              <li>Dark mode friendly and fully mobile optimized.</li>
            </ul>
          </div>
        </div>

        {/* Bottom nav (kept for parity with the app) */}
      </div>
    </Wrapper>
  );
}
