import { FiLock, FiRefreshCw, FiTrash2, FiUnlock } from "react-icons/fi";
import type { WardrobeCategory, WardrobeItem } from "../../types/wardrobe";

const garmentPosition: Record<WardrobeCategory, string> = {
  top: "left-[23%] top-[21%] z-20 h-[31%] w-[54%]",
  shirt: "left-[21%] top-[19%] z-20 h-[35%] w-[58%]",
  dress: "left-[18%] top-[18%] z-20 h-[70%] w-[64%]",
  "blazer-jacket": "left-[17%] top-[17%] z-30 h-[42%] w-[66%]",
  trousers: "left-[23%] top-[47%] z-10 h-[47%] w-[54%]",
  skirt: "left-[21%] top-[45%] z-10 h-[38%] w-[58%]",
};

const layerOrder: Record<WardrobeCategory, number> = {
  trousers: 0,
  skirt: 0,
  top: 1,
  shirt: 1,
  dress: 1,
  "blazer-jacket": 2,
};

export function WardrobeMannequin({
  disabled = false,
  editing = false,
  items,
  lockedItemIds = [],
  onRegenerate,
  onRemove,
  onSelectItem,
  onToggleLock,
}: {
  disabled?: boolean;
  editing?: boolean;
  items: WardrobeItem[];
  lockedItemIds?: string[];
  onRegenerate?: () => void;
  onRemove?: (item: WardrobeItem) => void;
  onSelectItem?: (item: WardrobeItem) => void;
  onToggleLock?: (item: WardrobeItem) => void;
}) {
  const sortedItems = items
    .slice()
    .sort((left, right) => layerOrder[left.category] - layerOrder[right.category]);
  const label = items.length
    ? `Outfit: ${items.map((item) => item.name).join(", ")}`
    : "Empty outfit";

  return (
    <div>
      <div
        className="relative mx-auto aspect-[2/3] w-full max-w-[18rem] overflow-hidden rounded-[2rem] border border-[#eadfd2] bg-[radial-gradient(circle_at_50%_24%,#fff_0%,#f8f1e9_48%,#eee2d5_100%)] shadow-inner dark:border-gray-700 dark:bg-[radial-gradient(circle_at_50%_24%,#374151_0%,#1f2937_52%,#111827_100%)]"
        role="img"
        aria-label={label}
      >
        <svg
          viewBox="0 0 240 360"
          className="absolute inset-x-[17%] bottom-[3%] h-[94%] w-[66%] text-[#d9c8b7] opacity-60 dark:text-gray-500"
          aria-hidden="true"
        >
          <circle cx="120" cy="37" r="25" fill="currentColor" />
          <path d="M92 69c8-7 48-7 56 0l15 89-14 64 13 123h-31l-11-104-11 104H78l13-123-14-64 15-89Z" fill="currentColor" />
          <path d="m84 85-20 20-23 104 19 4 31-94M156 85l20 20 23 104-19 4-31-94" fill="currentColor" />
        </svg>

        {sortedItems.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectItem?.(item)}
            className={`absolute ${garmentPosition[item.category]} ${
              onSelectItem && !disabled ? "cursor-pointer" : "cursor-default"
            }`}
            aria-label={onSelectItem ? `Swap ${item.name}` : item.name}
          >
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-contain drop-shadow-[0_8px_7px_rgba(60,45,32,0.18)]"
            />
          </button>
        ))}

        {items.length === 0 && (
          <div className="absolute inset-x-6 top-[43%] z-40 rounded-2xl bg-white/80 p-3 text-center text-xs font-semibold text-stone-500 backdrop-blur dark:bg-gray-900/80 dark:text-gray-300">
            Add clothes to style this day
          </div>
        )}

        {onRegenerate && (
          <button
            type="button"
            disabled={disabled}
            onClick={onRegenerate}
            className="absolute bottom-3 right-3 z-40 grid h-10 w-10 place-items-center rounded-full bg-stone-900 text-white shadow-lg transition hover:rotate-12 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900"
            aria-label="Regenerate this outfit"
          >
            <FiRefreshCw />
          </button>
        )}
      </div>

      {editing && items.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {items.map((item) => {
            const locked = lockedItemIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl bg-stone-50 px-2.5 py-2 text-xs dark:bg-gray-800"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-white shadow"
                  style={{ backgroundColor: item.colorHex }}
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectItem?.(item)}
                  className="min-w-0 flex-1 truncate text-left font-semibold text-stone-700 hover:text-stone-950 dark:text-gray-200 dark:hover:text-white"
                >
                  {item.name}
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleLock?.(item)}
                  className={`grid h-8 w-8 place-items-center rounded-lg disabled:cursor-not-allowed disabled:opacity-50 ${
                    locked
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                      : "text-stone-400 hover:bg-white dark:hover:bg-gray-700"
                  }`}
                  aria-label={locked ? `Unlock ${item.name}` : `Lock ${item.name}`}
                >
                  {locked ? <FiLock /> : <FiUnlock />}
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove?.(item)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-950/40"
                  aria-label={`Remove ${item.name} from outfit`}
                >
                  <FiTrash2 />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
