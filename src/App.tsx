import { Dashboard } from "./pages/Dashboard";
import { ExpenseForm } from "./pages/ExpenseForm";
import {
  Route,
  Routes,
  HashRouter,
  BrowserRouter,
  Navigate,
} from "react-router-dom";
import { BudgetPage } from "./pages/BudgetPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { BudgetForm } from "./pages/BudgetForm";
import { BudgetIdPage } from "./pages/BudgetIdPage";
import { ItemContextProvider } from "./context/ItemContext";
import { Profile } from "./pages/Profile";
import ScanReceiptRoute from "./pages/ScanReceiptRoute";
import NotFound from "./pages/NotFound";
import { Capacitor } from "@capacitor/core";
import { Wrapper } from "./components/Wrapper";
import LoginForm from "./pages/LoginForm";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { hasIdToken } from "./services/amplify";

const isNative = Capacitor.isNativePlatform();

export default function App() {
  useEffect(() => {
    Keyboard.setResizeMode({ mode: KeyboardResize.Body }); // "native" is what often causes big jumps
    // Optional: if you don't want the WebView to scroll itself
    // Keyboard.setScroll({ isDisabled: true });
  }, []);

  useEffect(() => {
    if (!isNative) return;
    // If you set launchAutoHide:false in capacitor.config, this guarantees control here.
    SplashScreen.show({ autoHide: false }).catch(() => {});
    return () => {
      // Ensure we never leave it up on unmount
      SplashScreen.hide().catch(() => {});
    };
  }, []);

  const auth = useAuth();

  useEffect(() => {
    (async () => {
      auth?.setAuthed(await hasIdToken());
      auth?.setReady(true);
    })();
  }, [auth]);

  useEffect(() => {
    if (!isNative) return;
    if (auth?.ready) {
      SplashScreen.hide().catch(() => {});
    }
  }, [auth?.ready]);

  if (!auth || !auth.ready) return;
  const { authed } = auth;

  const RouterComponent = isNative ? HashRouter : BrowserRouter;
  return (
    <ItemContextProvider>
      <RouterComponent>
        <Wrapper>
          <Routes>
            {!authed ? (
              <>
                {/* default route goes to /login */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginForm />} />
                {/* if someone hits /expenses while logged out, send them to /login */}
                <Route
                  path="/expenses/*"
                  element={<Navigate to="/login" replace />}
                />
                {/* ...you can guard other private paths similarly */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/expenses/new" element={<ExpenseForm />} />
                <Route
                  path="/expenses/:expenseId/edit"
                  element={<ExpenseForm />}
                />
                <Route path="/budgets" element={<BudgetPage />} />
                <Route path="/budgets/:budgetId" element={<BudgetIdPage />} />
                <Route path="/budgets/new" element={<BudgetForm />} />
                <Route
                  path="/budgets/:budgetId/edit"
                  element={<BudgetForm />}
                />
                <Route path="/settings" element={<Profile />} />
                <Route path="/expenses/scan" element={<ScanReceiptRoute />} />

                {/* web-only 404, mobile redirects (if you want that behavior) */}
                {isNative ? (
                  <Route
                    path="*"
                    element={<Navigate to="/expenses" replace />}
                  />
                ) : (
                  <Route path="*" element={<NotFound />} />
                )}
              </>
            )}
          </Routes>
        </Wrapper>
      </RouterComponent>
    </ItemContextProvider>
  );
}
