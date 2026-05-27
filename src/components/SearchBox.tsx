import { FiSearch } from "react-icons/fi";

export const SearchBox = ({
  query,
  setQuery,
  title,
}: {
  query: string;
  setQuery: (query: string) => void;
  title: string;
}) => {
  return (
    <div className="relative mb-2">
      <input
        type="text"
        placeholder={`Search ${title} by name or by category`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block h-9 w-full rounded-lg border border-gray-200 bg-white px-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
      />
      <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
    </div>
  );
};
