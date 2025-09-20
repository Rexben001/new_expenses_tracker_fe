import { useState, useEffect, useCallback, useMemo } from "react";
import { FiFilter, FiPlus, FiChevronLeft } from "react-icons/fi";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { deleteExpense, duplicateExpense, getExpense } from "../services/api";
import { AddNewItem } from "../components/NoItem";
import { ExpenseBox } from "../components/ExpenseBox";
import type { Expense } from "../types/expenses";
import { useItemContext } from "../hooks/useItemContext";
import { useExpenseFilter, useExpenseSearch } from "../hooks/useExpensesSearch";
import { ItemFilterPopup } from "../components/FilterComponent";
import type { BUDGET_STATE } from "../types/locationState";
import { resetFilter } from "../services/utils";
import { formatCurrency } from "../services/formatCurrency";
import { calculateRemaining, getTotal } from "../services/item";
import { ProgressBar } from "../components/ProgressBar";
import { SearchBox } from "../components/SearchBox";
import { getDefaultBudgetMonthYear } from "../services/formatDate";
import { CollapsibleUpcoming } from "../components/CollapsibleUpcoming";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";

export function BudgetIdPage() {
  const { loading, budgets, currency, user } = useItemContext();

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [query, setQuery] = useState("");

  const [showPopup, setShowPopup] = useState(false);

  const [months, setMonths] = useState<string[]>([]);
  const [year, setYear] = useState("");

  const navigate = useNavigate();

  const { budgetId } = useParams();

  const location = useLocation();

  const [total, setTotal] = useState(0);

  const defaults = useMemo(() => {
    if (user?.budgetStartDay == null) return null;
    return getDefaultBudgetMonthYear(user.budgetStartDay);
  }, [user?.budgetStartDay]);

  useEffect(() => {
    if (!defaults) return;
    setMonths((prev) => (prev.length ? prev : [defaults.month]));
    setYear((prev) => (prev ? prev : defaults.year));
  }, [defaults]);

  const ready = !loading && user?.budgetStartDay != null;

  const _filterExpenses = useExpenseFilter(
    months,
    year,
    user?.budgetStartDay ?? 1, // Default to 1 if not set
    expenses
  );

  const filteredExpenses = useExpenseSearch(query, _filterExpenses);

  const upcomingExpenses = filteredExpenses.filter((b) => b.upcoming);

  const activeExpenses = filteredExpenses.filter((b) => !b.upcoming);

  const state = location.state as BUDGET_STATE;

  const budget = useMemo(() => {
    return state?.title
      ? {
          ...state,
          id: budgetId ?? "",
        }
      : budgets.find((budget) => budget.id === budgetId);
  }, [state, budgetId, budgets]);

  const fetchBudgetExpenses = useCallback(async () => {
    try {
      const expenses = await getExpense("", budgetId);

      setExpenses(expenses);
    } catch (error) {
      console.log({ error });
      setExpenses([]);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchBudgetExpenses();
  }, [fetchBudgetExpenses]);

  const removeExpense = async (id: string, budgetId?: string) => {
    await deleteExpense(id, budgetId);
    await fetchBudgetExpenses();
  };

  const duplicateOldExpense = async (id: string, budgetId?: string) => {
    await duplicateExpense(id, budgetId);
    await fetchBudgetExpenses();
  };

  useEffect(() => {
    if (!budget?.title) {
      navigate("/budgets");
    }
  }, [budget, navigate]);

  useEffect(() => {
    const total = getTotal(filteredExpenses);
    setTotal(total);
  }, [filteredExpenses]);

  const remaining = calculateRemaining(budget?.amount ?? 0, expenses);

  if (loading || !ready) return null;

  const displayTitle = () => {
    const title = budget?.title;

    const hasBudget = title?.includes("budget");

    return hasBudget ? title : `${title} Budget`;
  };

  return (
    <>
      <HeaderComponent>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/budgets")}
            className="text-gray-600 dark:text-white  hover:text-black"
          >
            <FiChevronLeft className="text-2xl" />
          </button>

          <h1 className="text-xl font-bold"> {displayTitle()}</h1>
          <button
            className="text-gray-500 dark:text-white hover:text-gray-800"
            onClick={() => setShowPopup(!showPopup)}
          >
            <FiFilter className="text-xl" />
          </button>
        </div>

        <SearchBox query={query} setQuery={setQuery} title="expenses" />

        {showPopup && (
          <div className="w-full overflow-x-hidden">
            <ItemFilterPopup
              months={months}
              setMonths={setMonths}
              year={year}
              setYear={setYear}
              resetFilter={() => {
                resetFilter({ setMonths, setYear, setShowPopup });
              }}
            />
          </div>
        )}

        <p className="my-1.5 text-blue-500">
          Total Expenses:{"  "}
          <span className="font-bold text-black dark:text-white">
            {formatCurrency(total, currency)}
          </span>
        </p>
      </HeaderComponent>
      <div className="relative min-h-screen dark:text-white px-4 pt-6 max-w-md mx-auto mt-33">
        {budget && (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 dark:shadow-amber-50 rounded-2xl shadow p-5 flex justify-between items-start mb-6 cursor-pointer">
            <div className="flex-1">
              <p>Overall Budget Progress</p>
              <ProgressBar
                budget={{
                  ...budget,
                  title: budget.title ?? "",
                  category: budget.category ?? "",
                  amount: budget.amount ?? 0,
                  period: budget.period ?? "",
                  updatedAt: budget.updatedAt ?? "",
                  currency: budget.currency ?? "",
                  upcoming: budget.upcoming === "true",
                }}
                remaining={remaining}
                currency={currency!}
              />
            </div>
          </div>
        )}

        {filteredExpenses.length ? (
          <p className="mx-4 bold mb-3">
            Expenses{" "}
            <span className="text-blue-500">({filteredExpenses.length})</span>
          </p>
        ) : null}

        <div className="mx-3.5">
          <CollapsibleUpcoming
            upcomingItems={upcomingExpenses}
            currency={currency!}
            compType="Expense"
            removeExpense={removeExpense}
            duplicateExpense={duplicateOldExpense}
          />
        </div>

        {filteredExpenses.length ? (
          activeExpenses.map(
            ({ id, title, category, amount, updatedAt, upcoming }) => (
              <div key={id} className="mx-5">
                <ExpenseBox
                  key={id}
                  id={id}
                  title={title}
                  category={category}
                  amount={amount || 0}
                  updatedAt={updatedAt || ""}
                  currency={currency!}
                  removeExpense={removeExpense}
                  budgetId={budgetId}
                  duplicateExpense={duplicateOldExpense}
                  upcoming={upcoming}
                />
              </div>
            )
          )
        ) : (
          <AddNewItem
            url="/expenses/new"
            type="expenses"
            text="No expenses allocated to this budget"
            id={budgetId}
          />
        )}

        <div className="fixed bottom-24 inset-x-0 z-50">
          <div className="max-w-md mx-auto px-4 flex justify-end">
            <Link
              to="/expenses/new"
              className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
              aria-label="Add an expense"
              state={{ id: budgetId }}
            >
              <FiPlus className="text-2xl" />
            </Link>
          </div>
        </div>
      </div>
      <FooterNav />
    </>
  );
}
