import { formatCurrency } from "../services/formatCurrency";
import { formatRelativeDate } from "../services/formatDate";

export const UpcomingBox = ({
  amount,
  title,
  updatedAt,
  updateItem,
  currency = "EUR",
}: {
  amount: number;
  title: string;
  updatedAt?: string;
  updateItem: () => void;
  currency?: string;
}) => {
  return (
    <div className="dark:shadow-amber-50 rounded-xl p-2 px-4 shadow mb-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-700">
      <div className="flex justify-between items-center text-sm gap-4 pt-1">
        <p
          className={`font-semibold text-base text-gray-250 dark:text-gray-500"`}
        >
          {title}
        </p>
        <p
          className={`font-semibold text-base text-gray-250 dark:text-gray-500"`}
        >
          {formatCurrency(amount, currency)}
        </p>
        <div
          onClick={() => {
            updateItem();
          }}
          className="w-14 h-8 flex items-center bg-gray-300 dark:bg-gray-600 rounded-full p-1 cursor-pointer relative transition-colors"
        >
          <div
            className={`w-6 h-6 flex items-center justify-center rounded-full shadow-md transform transition-transform duration-300`}
          ></div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-1">
        {" "}
        {formatRelativeDate(updatedAt)}
      </p>
    </div>
  );
};
