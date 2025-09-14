import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.benjaminajewole.expensestracker",
  appName: "expenses tracker",
  webDir: "dist",
  // bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    // url: "https://indictable-industriously-hillary.ngrok-free.app",
    // cleartext: true,
  },
};

export default config;
