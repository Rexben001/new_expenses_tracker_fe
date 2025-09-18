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
};

export const AuthContext = createContext<Ctx | null>(null);
export const useAuth = () => useContext(AuthContext!);
