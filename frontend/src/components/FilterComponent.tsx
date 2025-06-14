type ItemFilterPopupProps = {
  month: string;
  year: string;
  setMonth: (value: string) => void;
  setYear: (value: string) => void;
  resetFilter: () => void;
};

export const ItemFilterPopup = ({
  month,
  year,
  setMonth,
  setYear,
  resetFilter,
}: ItemFilterPopupProps) => {
  return (
    <div className="flex justify-between items-center bg-white  dark:bg-gray-900 dark:text-white p-1 mb-1">
      <div>
        <label>Month:</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border-b-blue-700"
        >
          <option value="">All</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Year:</label>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">All</option>
          {[2025, 2024, 2023].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <button
        className="mt-2 bg-amber-700 text-white px-2 py-1 rounded"
        onClick={() => resetFilter()}
        hidden={!month && !year}
      >
        Clear
      </button>
    </div>
  );
};
