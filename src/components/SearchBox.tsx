import { FiSearch } from "react-icons/fi";

export const SearchBox = ({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (query: string) => void;
}) => {
  return (
    <div className="mb-4 relative">
      <input
        type="text"
        placeholder="Search expenses by name or by category"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full px-9 py-2 border rounded-full text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
      />
      <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
    </div>
  );
};
