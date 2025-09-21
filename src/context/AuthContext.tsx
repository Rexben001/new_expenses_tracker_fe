import { useContext, createContext } from "react";

export type Ctx = {
  ready: boolean;
  authed: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<"DONE" | "MFA" | "NEW_PASSWORD_REQUIRED">;
  confirmMfa: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  setAuthed(auth: boolean): void;
  setReady(ready: boolean): void;
  signup: (email: string, password: string) => Promise<"DONE" | "SIGNUP_CODE">;
  confirmSignup: (email: string, code: string) => Promise<"DONE">;
  resendSignupCode: (email: string) => Promise<void>;
  startResetPassword: (email: string) => Promise<"DONE" | "RESET_CODE">;
  confirmResetPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<"DONE">;
};

export const AuthContext = createContext<Ctx | null>(null);
export const useAuth = () => useContext(AuthContext!);
