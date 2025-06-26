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
    <div className="flex justify-between items-center bg-white  dark:bg-gray-900 dark:text-white p-1 mb-3">
      <div className="dark:shadow-amber-50">
        <label>Month:</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black dark:bg-gray-800 dark:text-white"
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
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          {[2030, 2029, 2028, 2027, 2026, 2025, 2024, 2023, 2022].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <button
        className="mt-2 bg-red-800 text-white px-2.5 py-2 rounded-1.5xl"
        onClick={() => resetFilter()}
        hidden={!month && !year}
      >
        X
      </button>
    </div>
  );
};
