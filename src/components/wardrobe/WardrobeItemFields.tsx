import { analyzeRgb, hexToRgb } from "../../services/wardrobeColors";
import {
  WARDROBE_CATEGORIES,
  WARDROBE_CATEGORY_LABELS,
  WARDROBE_COLOR_FAMILIES,
  type WardrobeCategory,
  type WardrobeColorFamily,
  type WardrobeColorTone,
} from "../../types/wardrobe";

export type WardrobeItemFormValues = {
  name: string;
  category: WardrobeCategory;
  colorFamily: WardrobeColorFamily;
  colorHex: string;
  colorTone: WardrobeColorTone;
  favorite: boolean;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800";

export function WardrobeItemFields({
  onChange,
  showFavorite = false,
  values,
}: {
  onChange: (values: WardrobeItemFormValues) => void;
  showFavorite?: boolean;
  values: WardrobeItemFormValues;
}) {
  const patch = (next: Partial<WardrobeItemFormValues>) =>
    onChange({ ...values, ...next });

  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-stone-500 dark:text-gray-400">
        Garment name
        <input
          value={values.name}
          onChange={(event) => patch({ name: event.target.value })}
          className={inputClass}
          maxLength={120}
          placeholder="Blue linen shirt"
          required
        />
      </label>

      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-stone-500 dark:text-gray-400">
        Category
        <select
          value={values.category}
          onChange={(event) =>
            patch({ category: event.target.value as WardrobeCategory })
          }
          className={inputClass}
        >
          {WARDROBE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {WARDROBE_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-[4.5rem_1fr] gap-3">
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-stone-500 dark:text-gray-400">
          Color
          <input
            type="color"
            value={values.colorHex}
            onChange={(event) => {
              const analysis = analyzeRgb(hexToRgb(event.target.value));
              patch({
                colorHex: analysis.colorHex,
                colorFamily: analysis.colorFamily,
                colorTone: analysis.colorTone,
              });
            }}
            className="mt-1.5 h-[42px] w-full cursor-pointer rounded-xl border border-stone-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900"
          />
        </label>
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-stone-500 dark:text-gray-400">
          Color group
          <select
            value={values.colorFamily}
            onChange={(event) =>
              patch({
                colorFamily: event.target.value as WardrobeColorFamily,
              })
            }
            className={inputClass}
          >
            {WARDROBE_COLOR_FAMILIES.map((family) => (
              <option key={family} value={family} className="capitalize">
                {family.charAt(0).toUpperCase() + family.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500 dark:text-gray-400">
          Light or dark
        </legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1 dark:bg-gray-800">
          {(["light", "dark"] as const).map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => patch({ colorTone: tone })}
              className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize transition ${
                values.colorTone === tone
                  ? "bg-white text-stone-950 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-stone-500 dark:text-gray-400"
              }`}
              aria-pressed={values.colorTone === tone}
            >
              {tone}
            </button>
          ))}
        </div>
      </fieldset>

      {showFavorite && (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 dark:border-gray-700 dark:text-gray-200">
          <input
            type="checkbox"
            checked={values.favorite}
            onChange={(event) => patch({ favorite: event.target.checked })}
            className="h-4 w-4 accent-rose-600"
          />
          Favorite garment
        </label>
      )}
    </div>
  );
}

