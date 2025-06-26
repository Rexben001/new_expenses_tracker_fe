// components/LoadingScreen.tsx
import { FiLoader } from "react-icons/fi";

export function LoadingScreen({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600  dark:bg-gray-900 dark:text-white">
      <FiLoader className="animate-spin text-4xl text-blue-600 dark:text-white mb-4" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
}
