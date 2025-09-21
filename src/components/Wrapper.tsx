import { useItemContext } from "../hooks/useItemContext";

export const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const { deviceType } = useItemContext();

  const pt = deviceType === "iphone" ? "pt-10" : "pt-0";

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 dark:text-white ${pt}`}
    >
      <div className="h-full overflow-y-auto pb-24 pt-[env(safe-area-inset-top)]">
      {children}
      </div>
    </div>
  );
};
