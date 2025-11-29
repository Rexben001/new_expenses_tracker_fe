// auth/Auth.tsx
import { useEffect, useState } from "react";
import {
  signIn,
  signOut,
  fetchAuthSession,
  confirmSignIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";
import { AuthContext, type Ctx } from "../context/AuthContext";
import { hasIdToken } from "../services/amplify";
import { tokenStore } from "../services/tokenStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      setAuthed(await hasIdToken());
      setReady(true);
    })();
  }, []);

  const login: Ctx["login"] = async (username, password) => {
    const res = await signIn({ username, password });
    const step = res.nextStep?.signInStep ?? "DONE";
    if (step === "DONE") {
      setAuthed(await hasIdToken());
      return "DONE";
    }
    if (step === "CONFIRM_SIGN_IN_WITH_SMS_CODE") return "MFA";
    if (step === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED")
      return "NEW_PASSWORD_REQUIRED";
    return "DONE";
  };

  const confirmMfa: Ctx["confirmMfa"] = async (code) => {
    await confirmSignIn({ challengeResponse: code });
    setAuthed(await hasIdToken());
  };

  const logout: Ctx["logout"] = async () => {
    await signOut();
    setAuthed(false);
    setReady(true);
    tokenStore.remove("subAccountId");
  };

  const getAccessToken = async () => {
    const s = await fetchAuthSession().catch(() => null);
    return s?.tokens?.accessToken?.toString() ?? null;
  };

  // ✅ NEW: Sign up (returns "SIGNUP_CODE" when code is needed)
  const signup: Ctx["signup"] = async (email, password) => {
    const res = await signUp({
      username: email,
      password,
      options: { userAttributes: { email } },
    });
    if (res.nextStep.signUpStep === "CONFIRM_SIGN_UP") return "SIGNUP_CODE";
    return "DONE";
  };

  // ✅ NEW: Confirm sign up with the code
  const confirmSignup: Ctx["confirmSignup"] = async (email, code) => {
    await confirmSignUp({ username: email, confirmationCode: code });
    return "DONE";
  };

  // ✅ NEW: Resend signup code
  const resendSignupCode: Ctx["resendSignupCode"] = async (email) => {
    await resendSignUpCode({ username: email });
  };

  // ✅ NEW: Start password reset (sends code)
  const startResetPassword: Ctx["startResetPassword"] = async (email) => {
    const res = await resetPassword({ username: email });
    if (res.nextStep.resetPasswordStep === "CONFIRM_RESET_PASSWORD_WITH_CODE")
      return "RESET_CODE";
    return "DONE";
  };

  // ✅ NEW: Confirm password reset with code + new password
  const confirmResetPasswordApi: Ctx["confirmResetPassword"] = async (
    email,
    code,
    newPassword
  ) => {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
    return "DONE";
  };

  return (
    <AuthContext.Provider
      value={{
        ready,
        authed,
        login,
        confirmMfa,
        logout,
        getAccessToken,
        setAuthed,
        setReady,
        // 👇 NEW
        signup,
        confirmSignup,
        resendSignupCode,
        startResetPassword,
        confirmResetPassword: confirmResetPasswordApi,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
