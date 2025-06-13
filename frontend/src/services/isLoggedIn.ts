import { jwtDecode } from "jwt-decode";
import { loginUrl } from "./getLoginUrl";

export function isUserLoggedIn(): boolean {
  const token = localStorage.getItem("idToken");

  return !!token;
}

export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

export function handleUnauthorized() {
  localStorage.removeItem("idToken");
  localStorage.removeItem("accessToken");
  window.location.href = loginUrl; // or redirect to Cognito Hosted UI
}
