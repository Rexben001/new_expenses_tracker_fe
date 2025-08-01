const COLOR_CODES = {
  Food: "bg-red-100 dark:bg-red-800",
  Transport: "bg-blue-100 dark:bg-blue-800",
  Entertainment: "bg-green-100 dark:bg-green-800",
  Utilities: "bg-yellow-100 dark:bg-yellow-800",
  Health: "bg-purple-100 dark:bg-purple-800",
  Shopping: "bg-pink-100 dark:bg-pink-800",
  Insurance: "bg-gray-100 dark:bg-gray-800",
  Miscellaneous: "bg-orange-100 dark:bg-orange-800",
  Toiletries: "bg-teal-100 dark:bg-teal-800",
  Holiday: "bg-indigo-100 dark:bg-indigo-800",
  Other: "bg-gray-200 dark:bg-gray-700",
};
type CategoryType = keyof typeof COLOR_CODES;

export const CategoryComponent = ({
  category,
  isUpcoming = false,
}: {
  category: CategoryType | string;
  isUpcoming?: boolean;
}) => {
  const color = isUpcoming
    ? "text-gray-250 dark:text-gray-500"
    : COLOR_CODES[category as CategoryType] || "bg-gray-100 dark:bg-gray-800";
  return (
    <p
      className={`inline-block w-fit text-sm ${color} border-0 border-gray-300 dark:border-gray-600 rounded-full px-2 py-0.5 bg-gray-100 dark:bg-gray-800`}
    >
      {category}
    </p>
  );
};
