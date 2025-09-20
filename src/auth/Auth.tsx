import { useEffect, useState } from "react";
import {
  signIn,
  signOut,
  fetchAuthSession,
  confirmSignIn,
} from "aws-amplify/auth";
import { AuthContext, type Ctx } from "../context/AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  const hasIdToken = async () => {
    const s = await fetchAuthSession().catch(() => null);
    return !!s?.tokens?.idToken;
  };

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
      // only flip authed if an idToken truly exists
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
  };

  const getAccessToken = async () => {
    const s = await fetchAuthSession().catch(() => null);
    return s?.tokens?.accessToken?.toString() ?? null;
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
