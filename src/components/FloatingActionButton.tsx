import { useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiCamera, FiEdit2 } from "react-icons/fi";

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 inset-x-0 z-50">
      <div className="max-w-md mx-auto px-4 flex justify-end relative">
        {open && (
          <div className="flex flex-col items-end space-y-3 absolute bottom-16 right-5">
            <Link
              to="/expenses/scan"
              className="bg-white text-blue-600 dark:bg-gray-900 dark:text-white  border border-blue-600 dark:border-gray-700 px-4 py-2 rounded-md shadow hover:bg-blue-50 flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <FiCamera />
              <span>Scan Receipt</span>
            </Link>

            <Link
              to="/expenses/new"
              className="bg-white text-blue-600 border border-blue-600 dark:bg-gray-900 dark:text-white dark:border-gray-700 px-4 py-2 rounded-md shadow hover:bg-blue-50 flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <FiEdit2 />
              <span>Add Manually</span>
            </Link>
          </div>
        )}

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg focus:outline-none transition-transform"
          aria-label="Add an expense"
        >
          <FiPlus
            className={`text-2xl transform transition-transform ${
              open ? "rotate-45" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}
