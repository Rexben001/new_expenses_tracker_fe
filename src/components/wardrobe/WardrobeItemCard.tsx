import { FiEdit3, FiHeart, FiTrash2 } from "react-icons/fi";
import type { WardrobeItem } from "../../types/wardrobe";
import { WARDROBE_CATEGORY_LABELS } from "../../types/wardrobe";

const imageHeightByCategory: Record<WardrobeItem["category"], string> = {
  top: "h-48",
  shirt: "h-56",
  dress: "h-80",
  "blazer-jacket": "h-64",
  trousers: "h-72",
  skirt: "h-60",
};

export function WardrobeItemCard({
  item,
  onDelete,
  onEdit,
  onToggleFavorite,
}: {
  item: WardrobeItem;
  onDelete: (item: WardrobeItem) => void;
  onEdit: (item: WardrobeItem) => void;
  onToggleFavorite: (item: WardrobeItem) => void;
}) {
  return (
    <article className="mb-4 break-inside-avoid overflow-hidden rounded-[1.35rem] border border-stone-200/80 bg-white shadow-[0_10px_35px_rgba(54,41,31,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(54,41,31,0.13)] dark:border-gray-800 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className={`group relative block w-full overflow-hidden bg-gradient-to-b from-[#f8f4ee] to-[#eee6db] ${imageHeightByCategory[item.category]} dark:from-gray-800 dark:to-gray-900`}
        aria-label={`Edit ${item.name}`}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.035]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-700 shadow-sm backdrop-blur dark:bg-gray-950/85 dark:text-gray-200">
          {item.colorTone}
        </span>
        <span
          className="absolute bottom-3 right-3 h-5 w-5 rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: item.colorHex }}
          aria-label={`${item.colorFamily} color`}
        />
      </button>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={() => onEdit(item)} className="min-w-0 text-left">
            <h3 className="truncate text-sm font-bold text-stone-900 dark:text-gray-50">
              {item.name}
            </h3>
            <p className="mt-0.5 text-xs capitalize text-stone-500 dark:text-gray-400">
              {WARDROBE_CATEGORY_LABELS[item.category]} · {item.colorFamily}
            </p>
          </button>
          <button
            type="button"
            onClick={() => onToggleFavorite(item)}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
              item.favorite
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50"
                : "text-stone-400 hover:bg-stone-100 hover:text-rose-500 dark:hover:bg-gray-800"
            }`}
            aria-label={item.favorite ? `Unfavorite ${item.name}` : `Favorite ${item.name}`}
          >
            <FiHeart className={item.favorite ? "fill-current" : ""} />
          </button>
        </div>

        <div className="mt-3 flex gap-2 border-t border-stone-100 pt-2 dark:border-gray-800">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FiEdit3 /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-500 hover:bg-rose-50 hover:text-rose-600 dark:text-gray-400 dark:hover:bg-rose-950/40"
          >
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

