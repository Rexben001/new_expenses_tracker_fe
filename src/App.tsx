import { Dashboard } from "./pages/Dashboard";
import { ExpenseForm } from "./pages/ExpenseForm";
import { HomePage } from "./pages/HomePage";
import {
  Route,
  Routes,
  HashRouter,
  BrowserRouter,
  Navigate,
} from "react-router-dom";
import { BudgetPage } from "./pages/BudgetPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { ExpenseInsightsPage } from "./pages/ExpenseInsightsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { TaskForm } from "./pages/TaskForm";
import { TasksPage } from "./pages/TasksPage";
import { IphoneVideosPage } from "./pages/IphoneVideosPage";
import { HowToPage } from "./pages/HowToPage";
import { BudgetForm } from "./pages/BudgetForm";
import { BudgetIdPage } from "./pages/BudgetIdPage";
import { ItemContextProvider } from "./context/ItemContext";
import { Profile } from "./pages/Profile";
import ScanReceiptRoute from "./pages/ScanReceiptRoute";
import ScanReceiptV2Route from "./pages/ScanReceiptV2Route";
import NotFound from "./pages/NotFound";
import { Capacitor } from "@capacitor/core";
import { Wrapper } from "./components/Wrapper";
import LoginForm from "./pages/LoginForm";
import { useAuth } from "./context/AuthContext";
import { useEffect, useState, type ReactNode } from "react";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { jwtDecode } from "jwt-decode";
import { getTokens, hasIdToken } from "./services/amplify";
import { isAdminEmail } from "./services/admin";
import { TaskNotificationLayer } from "./components/TaskNotificationLayer";
import { useItemContext } from "./hooks/useItemContext";

const isNative = Capacitor.isNativePlatform();

type CognitoIdClaims = {
  email?: string;
};

function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const { user, resourceLoading } = useItemContext();
  const [tokenEmail, setTokenEmail] = useState<string | null>();

  useEffect(() => {
    if (user?.email) return;

    let mounted = true;
    getTokens()
      .then((tokens) => {
        if (!mounted) return;
        if (!tokens.idToken) {
          setTokenEmail(null);
          return;
        }
        setTokenEmail(jwtDecode<CognitoIdClaims>(tokens.idToken).email ?? null);
      })
      .catch(() => {
        if (mounted) setTokenEmail(null);
      });

    return () => {
      mounted = false;
    };
  }, [user?.email]);

  const email = user?.email ?? tokenEmail;
  if (isAdminEmail(email)) return <>{children}</>;
  if (resourceLoading.user || tokenEmail === undefined) return null;
  return <Navigate to="/" replace />;
}

export default function App() {
  useEffect(() => {
    if (!isNative) return;
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
          <TaskNotificationLayer />
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
                <Route
                  path="/calendar/*"
                  element={<Navigate to="/login" replace />}
                />
                {/* ...you can guard other private paths similarly */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route
                  path="/expenses/insights"
                  element={<ExpenseInsightsPage />}
                />
                <Route path="/expenses/new" element={<ExpenseForm />} />
                <Route
                  path="/expenses/:expenseId/edit"
                  element={<ExpenseForm />}
                />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/tasks/new" element={<TaskForm />} />
                <Route path="/tasks/:taskId/edit" element={<TaskForm />} />
                <Route
                  path="/videos"
                  element={
                    <AdminOnlyRoute>
                      <IphoneVideosPage />
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/how-to"
                  element={
                    <AdminOnlyRoute>
                      <HowToPage />
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/how-to/:howToId"
                  element={
                    <AdminOnlyRoute>
                      <HowToPage />
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <AdminOnlyRoute>
                      <CalendarPage />
                    </AdminOnlyRoute>
                  }
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
                <Route
                  path="/expenses/scan-v2"
                  element={<ScanReceiptV2Route />}
                />

                {/* web-only 404, mobile redirects (if you want that behavior) */}
                {isNative ? (
                  <Route
                    path="*"
                    element={<Navigate to="/" replace />}
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
