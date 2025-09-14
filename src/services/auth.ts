// auth.ts (new helper)
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { loginUrl } from "./getLoginUrl";
import { tokenStore } from "./tokenStore";

let loggingIn = false;
export async function beginLogin() {
  if (loggingIn) return;
  loggingIn = true;
  try {
    console.log("[Auth] loginUrl =", loginUrl);
    if (!/^https:\/\//i.test(loginUrl))
      throw new Error("Login URL must be https://");
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: loginUrl }); // don’t pass windowName on iOS
    } else {
      window.location.assign(loginUrl);
    }
  } finally {
    loggingIn = false;
  }
}

// Optional: central logout
export async function removeAllTokens() {
  await tokenStore.remove("idToken");
  await tokenStore.remove("accessToken");
}
