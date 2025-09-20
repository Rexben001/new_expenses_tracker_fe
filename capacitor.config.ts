import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.benjaminajewole.Expenses-tracker",
  appName: "Expenses Tracker",
  webDir: "dist",
  // bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    // url: "https://indictable-industriously-hillary.ngrok-free.app",
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000, // ms; show on launch
      launchAutoHide: false, // we’ll hide manually after init
      backgroundColor: "#0F172A", // dark background example
      showSpinner: true,
      androidScaleType: "CENTER_CROP", // how the image scales
      launchFadeOutDuration: 2000,
      androidSplashResourceName: "splash",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
  },
};

export default config;
