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

type Step =
  | "CREDENTIALS"
  | "MFA"
  | "SIGNUP"
  | "SIGNUP_CODE"
  | "FORGOT"
  | "RESET_CODE";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("CREDENTIALS");
  const [error, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const auth = useAuth();
  if (!auth) throw new Error("Auth context is not available");

  const {
    login,
    confirmMfa,
    signup,
    confirmSignup,
    resendSignupCode,
    startResetPassword,
    confirmResetPassword,
  } = auth;

  const nav = useNavigate();
  const from = (useLocation().state as any)?.from?.pathname ?? "/";

  // ---- Handlers -------------------------------------------------------------

  const submitCreds = async () => {
    setBusy(true);
    setErr(null);
    try {
      const next = await login(email.trim(), pass);
      if (next === "DONE") nav(from, { replace: true });
      else if (next === "MFA") setStep("MFA");
      else if (next === "NEW_PASSWORD_REQUIRED")
        setErr("New password required.");
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

  const doSignup = async () => {
    setBusy(true);
    setErr(null);
    try {
      const next = await signup(email.trim(), pass);
      if (next === "SIGNUP_CODE") setStep("SIGNUP_CODE");
    } catch (e: any) {
      setErr(e.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const doConfirmSignup = async () => {
    setBusy(true);
    setErr(null);
    try {
      await confirmSignup(email.trim(), code.trim());
      // go back to login on success
      setStep("CREDENTIALS");
    } catch (e: any) {
      setErr(e.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const doForgot = async () => {
    setBusy(true);
    setErr(null);
    try {
      const next = await startResetPassword(email.trim());
      if (next === "RESET_CODE") setStep("RESET_CODE");
    } catch (e: any) {
      setErr(e.message || "Failed to start reset");
    } finally {
      setBusy(false);
    }
  };

  const doConfirmReset = async () => {
    setBusy(true);
    setErr(null);
    try {
      await confirmResetPassword(email.trim(), code.trim(), newPass);
      // back to login after reset
      setStep("CREDENTIALS");
      setPass("");
      setNewPass("");
      setCode("");
    } catch (e: unknown) {
      if (e && typeof e === "object" && "message" in e) {
        setErr((e as { message?: string }).message || "Failed to reset");
      } else {
        setErr("Failed to reset");
      }
    } finally {
      setBusy(false);
    }
  };

  // Enter-to-submit per step
  const submitOnEnter: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (step === "CREDENTIALS") return void submitCreds();
    if (step === "MFA") return void submitMfa();
    if (step === "SIGNUP") return void doSignup();
    if (step === "SIGNUP_CODE") return void doConfirmSignup();
    if (step === "FORGOT") return void doForgot();
    if (step === "RESET_CODE") return void doConfirmReset();
  };

  // Reusable field blocks
  const EmailField = (
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
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={submitOnEnter}
        />
      </div>
    </label>
  );

  const PasswordField = (
    <label className="block">
      <span className="mb-1.5 inline-flex items-center gap-2 text-[13px] font-medium text-gray-600 dark:text-gray-300">
        <FiLock /> Password
      </span>
      <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 focus-within:ring-2 focus-within:ring-blue-500">
        <input
          className="w-full h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
          placeholder="••••••••"
          type={showPass ? "text" : "password"}
          autoComplete={step === "SIGNUP" ? "new-password" : "current-password"}
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
  );

  // ---- UI -------------------------------------------------------------------

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
                {step === "SIGNUP"
                  ? "Create your account"
                  : step === "SIGNUP_CODE"
                  ? "Verify your email"
                  : step === "FORGOT"
                  ? "Reset your password"
                  : step === "RESET_CODE"
                  ? "Enter code and new password"
                  : step === "MFA"
                  ? "Enter your verification code"
                  : "Sign in to continue"}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* --- SIGN IN --- */}
          {step === "CREDENTIALS" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submitCreds();
              }}
            >
              {EmailField}
              {PasswordField}
              <button
                type="submit"
                disabled={busy || !email || pass.length < 6}
                className="mt-2 h-12 w-full rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("FORGOT")}
                  className="text-blue-600"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setStep("SIGNUP")}
                  className="text-blue-600"
                >
                  Create account
                </button>
              </div>
            </form>
          )}

          {/* --- MFA --- */}
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
                  className="w-full h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none tracking-widest text-center"
                  placeholder="123 456"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
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

          {/* --- SIGNUP --- */}
          {step === "SIGNUP" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                doSignup();
              }}
            >
              {EmailField}
              {PasswordField}
              <button
                type="submit"
                disabled={busy || !email || pass.length < 6}
                className="h-12 w-full rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {busy ? "Creating…" : "Create account"}
              </button>
              <p className="text-xs text-center mt-2">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-blue-600"
                  onClick={() => setStep("CREDENTIALS")}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* --- SIGNUP CODE --- */}
          {step === "SIGNUP_CODE" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                doConfirmSignup();
              }}
            >
              {/* Email (keep editable in case user mistyped) */}
              {EmailField}
              <label className="block">
                <span className="mb-1.5 inline-flex items-center gap-2 text-[13px] font-medium text-gray-600 dark:text-gray-300">
                  <FiShield /> Verification code
                </span>
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    className="w-full h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none tracking-[0.3em] text-center"
                    placeholder="123456"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={submitOnEnter}
                  />
                </div>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="h-11 flex-1 rounded-xl border"
                  onClick={() => resendSignupCode(email.trim())}
                >
                  Resend code
                </button>
                <button
                  type="submit"
                  disabled={busy || code.trim().length < 4 || !email}
                  className="h-11 flex-1 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {busy ? "Verifying…" : "Confirm"}
                </button>
              </div>
              <p className="text-xs text-center mt-2">
                Wrong email?{" "}
                <button
                  type="button"
                  className="text-blue-600"
                  onClick={() => setStep("SIGNUP")}
                >
                  Go back
                </button>
              </p>
            </form>
          )}

          {/* --- FORGOT (request reset code) --- */}
          {step === "FORGOT" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                doForgot();
              }}
            >
              {EmailField}
              <button
                type="submit"
                disabled={busy || !email}
                className="h-12 w-full rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {busy ? "Sending…" : "Send reset code"}
              </button>
              <p className="text-xs text-center mt-2">
                Remember it?{" "}
                <button
                  type="button"
                  className="text-blue-600"
                  onClick={() => setStep("CREDENTIALS")}
                >
                  Back to sign in
                </button>
              </p>
            </form>
          )}

          {/* --- RESET CODE (enter code + new password) --- */}
          {step === "RESET_CODE" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                doConfirmReset();
              }}
            >
              {EmailField}
              <label className="block">
                <span className="mb-1.5 inline-flex items-center gap-2 text-[13px] font-medium text-gray-600 dark:text-gray-300">
                  <FiShield /> Reset code
                </span>
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    className="w-full h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none tracking-[0.3em] text-center"
                    placeholder="123456"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={submitOnEnter}
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 inline-flex items-center gap-2 text-[13px] font-medium text-gray-600 dark:text-gray-300">
                  <FiLock /> New password
                </span>
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    className="w-full h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    type="password"
                    autoComplete="new-password"
                    placeholder="New password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    onKeyDown={submitOnEnter}
                  />
                </div>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="h-11 flex-1 rounded-xl border"
                  onClick={() => setStep("FORGOT")}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={
                    busy || code.trim().length < 4 || newPass.length < 6
                  }
                  className="h-11 flex-1 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {busy ? "Updating…" : "Update password"}
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
