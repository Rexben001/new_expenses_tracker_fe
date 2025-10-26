import { Capacitor } from "@capacitor/core";
import { useItemContext } from "../hooks/useItemContext";

export const HeaderComponent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isNative = Capacitor.isNativePlatform();

  const { deviceType } = useItemContext();

  const pt = isNative && deviceType === "iphone" ? "pt-10" : "pt-2";
  return (
    <div
      className={`fixed max-w-md mx-auto top-0 px-2.5 left-0 right-0 z-150 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 ${pt} pb-2 w-full`}
    >
      {children}
    </div>
  );
};
