import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2, FiFilter, FiSearch, FiPlus } from "react-icons/fi";
import { FooterNav } from "../components/FooterNav";
import { deleteBudget } from "../services/api";
import { formatRelativeDate } from "../services/formatDate";
import { formatCurrency } from "../services/formatCurrency";
import { useItemContext } from "../hooks/useItemContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { AddNewItem } from "../components/NoItem";
import { useEffect, useState } from "react";
import { useBudgetSearch } from "../hooks/useBudgetsSearch";

export function BudgetPage() {
  const navigate = useNavigate();

  const location = useLocation();

  const { loading, fetchBudgets } = useItemContext();

  const [query, setQuery] = useState("");

  const filteredBudgets = useBudgetSearch(query);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchBudgets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    window.history.replaceState({}, document.title);
  }, []);

  if (loading) return <LoadingScreen />;

  // const mainExpenses = filteredBud

  return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">
          All Budgets
          <span className="text-blue-500">({filteredBudgets.length})</span>
        </h1>
        <button className="text-gray-500 hover:text-gray-800">
          <FiFilter className="text-xl" />
        </button>
      </div>

      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search budgets"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-10 py-2 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
      </div>

      {filteredBudgets.length ? (
        filteredBudgets.map(
          ({ id, title, category, period, updatedAt, amount, currency }) => (
            <div
              key={id}
              className="bg-white rounded-xl p-4 shadow flex justify-between items-start mb-4"
              onClick={() => {
                navigate(`/budgets/${id}`, {
                  state: {
                    title,
                    category,
                    period,
                    updatedAt,
                    amount,
                    currency,
                  },
                });
              }}
            >
              <div>
                <p className="font-semibold text-base">{title}</p>
                <p className="text-sm text-gray-500">{category}</p>
                <p className="text-xs text-gray-400 mt-1">{period}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeDate(updatedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(amount, currency || "EUR")}
                </p>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/budgets/${id}/edit`, {
                        state: {
                          title,
                          category,
                          period,
                          updatedAt,
                          amount,
                          currency,
                        },
                      });
                    }}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deleteBudget(id);
                      fetchBudgets();
                    }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          )
        )
      ) : (
        <AddNewItem
          url="/budgets/new"
          type="budgets"
          text="You don't have any budgets"
        />
      )}

      <Link
        to="/budgets/new"
        className="fixed bottom-20 right-6 bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700"
        aria-label="Add Expense"
      >
        <FiPlus className="text-2xl" />
      </Link>

      <FooterNav page="budgets" />
    </div>
  );
}

/**
 * TODO
 * search budgets
 * validate inputs
 * Handle not found values
 * Handle errors, display errors
 * Get expenses should get all expenses including the ones that belong to a budget, just add a budget name/color code to the expense
 * Fix logout
 */
