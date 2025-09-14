import { beginLogin } from "./auth";

import { tokenStore } from "./tokenStore";

export async function removeToken() {
  await tokenStore.remove("idToken");
  await tokenStore.remove("accessToken");
}
export async function handleUnauthorized() {
  await removeToken();
  await beginLogin();
}
