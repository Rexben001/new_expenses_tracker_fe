export const resetFilter = ({
  setMonths,
  setYear,
  setShowPopup,
}: {
  setMonths: (months: string[]) => void;
  setYear: (year: string) => void;
  setShowPopup: (popup: boolean) => void;
}) => {
  setMonths([]);
  setYear("");
  setShowPopup(false);
};
