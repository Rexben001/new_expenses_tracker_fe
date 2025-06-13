import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { formatRelativeDate } from "../services/formatDate";

type ExpenseBox = {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  currency: string;
  amount: number;
  budgetId?: string;
  removeExpense: (id: string, budgetId?: string) => Promise<void>;
};

export const ExpenseBox = ({
  id,
  title,
  category,
  updatedAt,
  amount,
  currency,
  budgetId,
  removeExpense,
}: ExpenseBox) => {
  return (
    <div
      key={id}
      className="bg-white rounded-xl p-4 shadow flex justify-between items-start mb-4"
    >
      <div>
        <p className="font-semibold text-base">{title}</p>
        <p className="text-sm text-gray-500">{category}</p>
        <p className="text-xs text-gray-400 mt-1">
          {" "}
          {formatRelativeDate(updatedAt)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-gray-800">${amount}</p>
        <div className="flex justify-end gap-2 mt-2">
          <button className="text-blue-500 hover:text-blue-700">
            <Link
              to={`/expenses/${id}/edit`}
              state={{
                title,
                category,
                updatedAt,
                amount,
                currency,
                id: budgetId,
              }}
            >
              <FiEdit2 />
            </Link>
          </button>
          <button
            className="text-red-500 hover:text-red-700"
            onClick={() => removeExpense(id, budgetId)}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
};
