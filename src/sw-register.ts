import { Workbox } from "workbox-window";
if ("serviceWorker" in navigator) {
  const wb = new Workbox("/sw.js", { scope: "/" });
  wb.addEventListener("waiting", () => wb.messageSkipWaiting());
  wb.register();
}
