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
import { LoadingScreen } from "./components/LoadingScreen";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";

const isNative = Capacitor.isNativePlatform();

export default function App() {
  // const [tokens, setTokens] = useState<{
  //   accessToken: string;
  //   idToken: string;
  // }>();

  // useEffect(() => {
  //   // initial load
  //   getTokens().then((t) =>
  //     setTokens({
  //       accessToken: t?.accessToken ?? "",
  //       idToken: t?.idToken ?? "",
  //     })
  //   );

  //   // react to auth events
  //   const onIn = async () => {
  //     const t = await getTokens();
  //     setTokens({
  //       accessToken: t?.accessToken ?? "",
  //       idToken: t?.idToken ?? "",
  //     });
  //   };
  //   const onOut = () => setTokens({ accessToken: "", idToken: "" });

  //   window.addEventListener("app:auth-signedIn", onIn);
  //   window.addEventListener("app:auth-signedOut", onOut);
  //   return () => {
  //     window.removeEventListener("app:auth-signedIn", onIn);
  //     window.removeEventListener("app:auth-signedOut", onOut);
  //   };
  // }, []);

  useEffect(() => {
    Keyboard.setResizeMode({ mode: KeyboardResize.Body }); // "native" is what often causes big jumps
    // Optional: if you don't want the WebView to scroll itself
    // Keyboard.setScroll({ isDisabled: true });
  }, []);

  const auth = useAuth();
  if (!auth || !auth.ready) return <LoadingScreen />;
  const { authed } = auth;

  const RouterComponent = isNative ? HashRouter : BrowserRouter;
  return (
    <ItemContextProvider>
      <RouterComponent>
        <Wrapper>
          <Routes>
            {!authed ? (
              <>
                <Route path="/login" element={<LoginForm />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={<Profile />} />
                <Route path="/expenses/new" element={<ExpenseForm />} />
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
                <Route path="/expenses/scan" element={<ScanReceiptRoute />} />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </Wrapper>
      </RouterComponent>
    </ItemContextProvider>
  );
}
