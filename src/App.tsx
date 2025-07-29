import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { ExpenseForm } from "./pages/ExpenseForm";
import { BudgetPage } from "./pages/BudgetPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { BudgetForm } from "./pages/BudgetForm";
import { BudgetIdPage } from "./pages/BudgetIdPage";
import { ItemContextProvider } from "./context/ItemContext";
import { Profile } from "./pages/Profile";

export default function App() {
  return (
    <ItemContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Profile />} />
          <Route path="/expenses/new" element={<ExpenseForm />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/expenses/new" element={<ExpenseForm />} />
          <Route path="/expenses/:expenseId/edit" element={<ExpenseForm />} />
          <Route path="/budgets" element={<BudgetPage />} />
          <Route path="/budgets/:budgetId" element={<BudgetIdPage />} />
          <Route path="/budgets/new" element={<BudgetForm />} />
          <Route path="/budgets/:budgetId/edit" element={<BudgetForm />} />
        </Routes>
      </Router>
    </ItemContextProvider>
  );
}
