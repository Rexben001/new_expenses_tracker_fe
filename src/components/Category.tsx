import React from "react";

const COLOR_CODES = {
  Food: "bg-red-300 text-red-900 dark:bg-red-700 dark:text-white",
  Transport: "bg-blue-300 text-blue-900 dark:bg-blue-700 dark:text-white",
  Entertainment:
    "bg-green-300 text-green-900 dark:bg-green-700 dark:text-white",
  Utilities: "bg-yellow-300 text-yellow-900 dark:bg-yellow-600 dark:text-white",
  Health: "bg-purple-300 text-purple-900 dark:bg-purple-700 dark:text-white",
  Shopping: "bg-pink-300 text-pink-900 dark:bg-pink-700 dark:text-white",
  Insurance: "bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-white",
  Miscellaneous:
    "bg-orange-300 text-orange-900 dark:bg-orange-700 dark:text-white",
  Toiletries: "bg-teal-300 text-teal-900 dark:bg-teal-700 dark:text-white",
  Holiday: "bg-indigo-300 text-indigo-900 dark:bg-indigo-700 dark:text-white",
  Others: "bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-white",
  Education: "bg-lime-300 text-lime-900 dark:bg-lime-700 dark:text-white",
  Subscriptions: "bg-cyan-300 text-cyan-900 dark:bg-cyan-700 dark:text-white",
  Gifts: "bg-rose-300 text-rose-900 dark:bg-rose-700 dark:text-white",
  "Personal Care":
    "bg-amber-300 text-amber-900 dark:bg-amber-700 dark:text-white",
};

type CategoryType = keyof typeof COLOR_CODES;

export const CategoryComponent = ({
  category,
  isUpcoming = false,
  onClick,
}: {
  category: CategoryType | string;
  isUpcoming?: boolean;
  onClick?: () => void;
}) => {
  const color = isUpcoming
    ? "text-gray-250 dark:text-gray-500 bg-gray-100 dark:bg-gray-800"
    : COLOR_CODES[category as CategoryType] || "bg-gray-100 dark:bg-gray-800";
  return (
    <p
      className={`inline-block w-fit text-sm ${color} border-0 rounded-full px-2 py-0.5`}
      onClick={onClick}
    >
      {category}
    </p>
  );
};

export const SuggestionCategories = ({
  categories,
  onSelect,
}: {
  categories: string[];
  onSelect: (category: string) => void;
}) => {
  const [clicked, setClicked] = React.useState<string>("");
  return (
    <div className="flex flex-wrap gap-1">
      {categories.map((cat) => (
        <CategoryComponent
          key={cat}
          category={cat}
          onClick={() => {
            onSelect(cat);
            setClicked(cat);
          }}
          isUpcoming={clicked === cat}
        />
      ))}
    </div>
  );
};
