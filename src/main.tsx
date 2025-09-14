import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { tokenStore } from "./services/tokenStore.ts";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
// import "./sw-register";

function parseHashTokens(hash: string) {
  const params = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash
  );
  return {
    idToken: params.get("id_token"),
    accessToken: params.get("access_token"),
  };
}

const isNative = Capacitor.isNativePlatform();

console.log({ isNative });
if (isNative) {
  CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
    // you used "capacitor://localhost/" as redirect
    if (url.startsWith("capacitor://localhost/")) {
      try {
        const { hash } = new URL(url);
        const { idToken, accessToken } = parseHashTokens(hash);
        if (idToken) await tokenStore.set("idToken", idToken);
        if (accessToken) await tokenStore.set("accessToken", accessToken);
      } finally {
        try {
          await Browser.close();
        } catch {}
        // optionally navigate to your home screen here
      }
    }
  });
} else {
  // web
  if (
    window.location.hash.includes("id_token") ||
    window.location.hash.includes("access_token")
  ) {
    const { idToken, accessToken } = parseHashTokens(window.location.hash);
    if (idToken) tokenStore.set("idToken", idToken);
    if (accessToken) tokenStore.set("accessToken", accessToken);
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
