// components/Modal.tsx
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  // lock background scroll when open
  useEffect(() => {
    if (!open) return;
    const orig = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = orig;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose} // click outside closes
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      {/* Sheet / Dialog */}
      <div
        className="relative w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl mx-auto p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()} // prevent backdrop close when clicking content
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-semibold dark:text-white">
            {title ?? "Details"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-gray-500 hover:text-gray-800 dark:text-gray-300"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
