/* eslint-disable @typescript-eslint/no-explicit-any */
import Select from "react-select";

type ItemFilterPopupProps = {
  months: string[];
  year: string;
  setMonths: (value: string[]) => void;
  setYear: (value: string) => void;
  resetFilter: () => void;
};
const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

const monthOptions = months.map((month) => ({
  value: month,
  label: new Date(0, Number(month) - 1).toLocaleString("default", {
    month: "short",
  }),
}));

const SelectStyles = {
  control: (base: any, state: { isFocused: any }) => ({
    ...base,
    backgroundColor: "transparent",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    minHeight: "36px",
    fontSize: "0.875rem",
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: "white",
    zIndex: 9999,
    width: "100%", // 👈 keep same width as control
    maxWidth: "300px", // 👈 optional hard cap
  }),
  menuList: (base: any) => ({
    ...base,
    maxHeight: "200px", // avoid super tall menus
  }),
  option: (base: any, state: { isFocused: any }) => ({
    ...base,
    backgroundColor: state.isFocused ? "#e5e7eb" : "white",
    color: "#111827",
    fontSize: "0.875rem",
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "#e5e7eb",
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: "#111827",
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    ":hover": {
      backgroundColor: "#9ca3af",
      color: "white",
    },
  }),
};

export const ItemFilterPopup = ({
  months,
  year,
  setMonths,
  setYear,
  resetFilter,
}: ItemFilterPopupProps) => {
  return (
    <div className="w-full max-w-screen-xl mx-auto overflow-x-hidden">
      <div className="flex flex-wrap md:flex-nowrap items-end gap-2 bg-white dark:bg-gray-900 dark:text-white px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 w-full">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
            Months
          </label>
          <Select
            isMulti
            name="months"
            options={monthOptions}
            onChange={(selected) => {
              const selectedMonths = selected.map(
                (o: { value: string; label: string }) => String(o.value)
              );
              setMonths(selectedMonths);
            }}
            value={monthOptions.filter((opt) => months.includes(opt.value))}
            className="text-sm"
            classNamePrefix="react-select"
            closeMenuOnSelect={false}
            menuPortalTarget={
              typeof window !== "undefined" ? document.body : null
            }
            menuPosition="fixed"
            menuPlacement="auto"
            styles={SelectStyles}
          />
        </div>

        {/* Year Select */}
        <div className="min-w-[120px]">
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
            Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All</option>
            {[2030, 2029, 2028, 2027, 2026, 2025, 2024, 2023, 2022].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        {(months.length > 0 || year) && (
          <button
            className="h-fit bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
            onClick={resetFilter}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
