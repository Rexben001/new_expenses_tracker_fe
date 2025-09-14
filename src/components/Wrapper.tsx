import { Capacitor } from "@capacitor/core";
import { FooterNav } from "./FooterNav";

export const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const isNative = Capacitor.isNativePlatform();

  const pt = isNative ? "pt-10" : "pt-0";
  return (
    <div
      className={`min-h-screen bg-white dark:bg-gray-900 dark:text-white ${pt} pb-16`}
    >
      {children}
      <FooterNav />
    </div>
  );
};
