import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiLogIn,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"CREDENTIALS" | "MFA">("CREDENTIALS");
  const [error, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const auth = useAuth();
  if (!auth) {
    throw new Error("Auth context is not available");
  }
  const { login, confirmMfa } = auth;
  const nav = useNavigate();
  const from = (useLocation().state as any)?.from?.pathname ?? "/";

  const submitCreds = async () => {
    setBusy(true);
    setErr(null);
    try {
      const next = await login(email.trim(), pass);
      if (next === "DONE") nav(from, { replace: true });
      if (next === "MFA") setStep("MFA");
      if (next === "NEW_PASSWORD_REQUIRED") setErr("New password required.");
    } catch (e: any) {
      setErr(e.message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const submitMfa = async () => {
    setBusy(true);
    setErr(null);
    try {
      await confirmMfa(code.trim());
      nav(from, { replace: true });
    } catch (e: any) {
      setErr(e.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const submitOnEnter: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step === "CREDENTIALS") {
        submitCreds();
      } else {
        submitMfa();
      }
    }
  };

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-5 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative rounded-3xl shadow-xl ring-1 ring-black/5 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md p-6 md:p-8">
          {/* Brand */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <FiLogIn className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight dark:text-white">
                Expenses Tracker
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sign in to continue
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {step === "CREDENTIALS" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submitCreds();
              }}
            >
              {/* Email */}
              <label className="block">
                <span className="mb-1.5 inline-flex items-center gap-2 text-[13px] font-medium text-gray-600 dark:text-gray-300">
                  <FiMail /> Email
                </span>
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    className="w-full h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    placeholder="you@example.com"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={submitOnEnter}
                  />
                </div>
              </label>

              {/* Password */}
              <label className="block">
                <span className="mb-1.5 inline-flex items-center gap-2 text-[13px] font-medium text-gray-600 dark:text-gray-300">
                  <FiLock /> Password
                </span>
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    className="w-full h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    placeholder="••••••••"
                    type={showPass ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    onKeyDown={submitOnEnter}
                  />
                  <button
                    type="button"
                    aria-label={showPass ? "Hide password" : "Show password"}
                    onClick={() => setShowPass((s) => !s)}
                    className="ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-300"
                  >
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <p className="mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                  Minimum 6 characters
                </p>
              </label>

              <button
                type="submit"
                disabled={busy}
                className="mt-2 h-12 w-full rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}

          {step === "MFA" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submitMfa();
              }}
            >
              <div className="flex items-center gap-2 text-[13px] font-medium text-gray-600 dark:text-gray-300">
                <FiShield /> Multi‑Factor Authentication
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter the verification code sent to your device.
              </p>
              <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 focus-within:ring-2 focus-within:ring-blue-500">
                <input
                  className="w-full h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                  placeholder="123 456"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={submitOnEnter}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="h-11 flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  onClick={() => setStep("CREDENTIALS")}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={busy || code.trim().length < 4}
                  className="h-11 flex-1 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {busy ? "Verifying…" : "Confirm"}
                </button>
              </div>
            </form>
          )}

          {/* extras */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            By signing in you agree to our{" "}
            <span className="underline decoration-dotted">Terms</span> &{" "}
            <span className="underline decoration-dotted">Privacy</span>.
          </div>
        </div>

        {/* subtle footer */}
        <p className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
          v{import.meta.env.VITE_APP_VERSION ?? "1.0.0"}
        </p>
      </div>
    </div>
  );
}
