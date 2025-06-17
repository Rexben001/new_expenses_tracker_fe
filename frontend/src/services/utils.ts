import { deleteExpense, duplicateExpense } from "./api";

export const resetFilter = ({
  setMonth,
  setYear,
  setShowPopup,
}: {
  setMonth: (month: string) => void;
  setYear: (year: string) => void;
  setShowPopup: (popup: boolean) => void;
}) => {
  setMonth("");
  setYear("");
  setShowPopup(false);
};
