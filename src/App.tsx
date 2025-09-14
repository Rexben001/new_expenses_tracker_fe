import { Route, Routes, HashRouter, BrowserRouter } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { ExpenseForm } from "./pages/ExpenseForm";
import { BudgetPage } from "./pages/BudgetPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { BudgetForm } from "./pages/BudgetForm";
import { BudgetIdPage } from "./pages/BudgetIdPage";
import { ItemContextProvider } from "./context/ItemContext";
import { Profile } from "./pages/Profile";
import ScanReceiptRoute from "./pages/ScanReceiptRoute";
import NotFound from "./pages/NotFound";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

export default function App() {
  const RouterComponent = isNative ? HashRouter : BrowserRouter;
  return (
    <ItemContextProvider>
      <RouterComponent>
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
          <Route path="/expenses/scan" element={<ScanReceiptRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </RouterComponent>
    </ItemContextProvider>
  );
}
