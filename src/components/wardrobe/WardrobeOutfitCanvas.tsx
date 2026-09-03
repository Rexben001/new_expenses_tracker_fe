import { Fragment, useState } from "react";
import {
  FiLock,
  FiMove,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiTrash2,
  FiUnlock,
} from "react-icons/fi";
import {
  DEFAULT_GARMENT_TRANSFORM,
  type GarmentTransform,
} from "../../services/wardrobeOutfitLayout";
import type { WardrobeCategory, WardrobeItem } from "../../types/wardrobe";

const garmentPosition: Record<WardrobeCategory, string> = {
  top: "left-[15%] top-[4%] h-[39%] w-[70%]",
  shirt: "left-[13%] top-[3%] h-[42%] w-[74%]",
  dress: "left-[10%] top-[2%] h-[92%] w-[80%]",
  "blazer-jacket": "left-[8%] top-[2%] h-[47%] w-[84%]",
  trousers: "left-[22%] top-[40%] h-[56%] w-[56%]",
  skirt: "left-[18%] top-[40%] h-[48%] w-[64%]",
};

const layerOrder: Record<WardrobeCategory, number> = {
  trousers: 10,
  skirt: 10,
  top: 20,
  shirt: 20,
  dress: 20,
  "blazer-jacket": 30,
};

function transformStyle(transform: GarmentTransform, zIndex: number) {
  return {
    zIndex,
    transform: `translate3d(${transform.x}%, ${transform.y}%, 0) rotate(${transform.rotation}deg) scale(${transform.scale})`,
    transformOrigin: "50% 50%",
  };
}

function PlacementSlider({
  disabled,
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
}: {
  disabled: boolean;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  const displayValue = step < 1
    ? `${Math.round(value * 100)}%`
    : `${value > 0 ? "+" : ""}${value}`;
  return (
    <label className="grid grid-cols-[4.25rem_1fr_2.75rem] items-center gap-2 text-[10px] font-bold text-stone-500 dark:text-gray-400">
      <span>{label}</span>
      <input
        type="range"
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-5 w-full cursor-pointer accent-rose-600 disabled:cursor-not-allowed"
      />
      <span className="text-right tabular-nums text-stone-700 dark:text-gray-200">
        {displayValue}
      </span>
    </label>
  );
}

export function WardrobeOutfitCanvas({
  disabled = false,
  editing = false,
  garmentTransforms = {},
  items,
  lockedItemIds = [],
  onAddJacket,
  onRegenerate,
  onRemove,
  onSelectItem,
  onToggleLock,
  onTransformChange,
}: {
  disabled?: boolean;
  editing?: boolean;
  garmentTransforms?: Record<string, GarmentTransform>;
  items: WardrobeItem[];
  lockedItemIds?: string[];
  onAddJacket?: () => void;
  onRegenerate?: () => void;
  onRemove?: (item: WardrobeItem) => void;
  onSelectItem?: (item: WardrobeItem) => void;
  onToggleLock?: (item: WardrobeItem) => void;
  onTransformChange?: (item: WardrobeItem, transform: GarmentTransform) => void;
}) {
  const [fittingItemId, setFittingItemId] = useState<string | null>(null);
  const sortedItems = items
    .slice()
    .sort((left, right) => layerOrder[left.category] - layerOrder[right.category]);
  const label = items.length
    ? `Outfit: ${items.map((item) => item.name).join(", ")}`
    : "Empty outfit";

  const updateTransform = (
    item: WardrobeItem,
    key: keyof GarmentTransform,
    value: number,
  ) => {
    onTransformChange?.(item, {
      ...(garmentTransforms[item.id] ?? DEFAULT_GARMENT_TRANSFORM),
      [key]: value,
    });
  };

  return (
    <div>
      <div
        className="relative mx-auto aspect-[4/5] w-full max-w-[18rem] overflow-hidden rounded-[2rem] border border-[#ded3c7] bg-[#f4f0eb] shadow-[inset_0_1px_0_rgba(255,255,255,.9),inset_0_-30px_55px_rgba(92,63,38,.07),0_18px_35px_rgba(64,43,25,.12)] dark:border-gray-700 dark:bg-gray-800"
        role="group"
        aria-label={label}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,.95),transparent_42%),linear-gradient(135deg,rgba(167,139,111,.05)_25%,transparent_25%,transparent_50%,rgba(167,139,111,.05)_50%,rgba(167,139,111,.05)_75%,transparent_75%)] bg-[length:auto,22px_22px] dark:bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,.09),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-3 rounded-[1.55rem] border border-white/70 shadow-[inset_0_0_30px_rgba(255,255,255,.28)] dark:border-white/10" />
        <div className="pointer-events-none absolute left-5 top-5 z-40 rounded-full border border-stone-200/80 bg-white/75 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 shadow-sm backdrop-blur dark:border-gray-600 dark:bg-gray-900/70 dark:text-gray-500">
          Outfit flat lay
        </div>
        <div className="pointer-events-none absolute bottom-[2%] left-[15%] h-[7%] w-[70%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(48,35,25,.17)_0%,rgba(48,35,25,.05)_48%,transparent_72%)] blur-sm dark:bg-[radial-gradient(ellipse,rgba(0,0,0,.45)_0%,rgba(0,0,0,.12)_48%,transparent_72%)]" />

        {sortedItems.map((item) => {
          const transform = garmentTransforms[item.id] ?? DEFAULT_GARMENT_TRANSFORM;
          const isJacket = item.category === "blazer-jacket";
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectItem?.(item)}
              className={`absolute ${garmentPosition[item.category]} touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                onSelectItem && !disabled ? "cursor-pointer" : "cursor-default"
              }`}
              style={transformStyle(transform, layerOrder[item.category])}
              aria-label={onSelectItem ? `Swap ${item.name}` : item.name}
            >
              {isJacket ? (
                <>
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain [filter:saturate(1.04)_contrast(1.02)_drop-shadow(4px_10px_7px_rgba(48,31,18,0.22))]"
                    style={{ clipPath: "polygon(0 0, 48% 0, 43% 100%, 0 100%)" }}
                  />
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain [filter:saturate(1.04)_contrast(1.02)_drop-shadow(4px_10px_7px_rgba(48,31,18,0.22))]"
                    style={{ clipPath: "polygon(52% 0, 100% 0, 100% 100%, 57% 100%)" }}
                  />
                  <span className="pointer-events-none absolute left-[44%] top-[18%] h-[66%] w-px rotate-[4deg] bg-black/20 shadow-[0_0_3px_rgba(0,0,0,.18)]" />
                  <span className="pointer-events-none absolute right-[44%] top-[18%] h-[66%] w-px -rotate-[4deg] bg-black/20 shadow-[0_0_3px_rgba(0,0,0,.18)]" />
                </>
              ) : (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="pointer-events-none h-full w-full object-contain [filter:saturate(1.04)_contrast(1.02)_drop-shadow(4px_10px_7px_rgba(48,31,18,0.22))]"
                />
              )}
            </button>
          );
        })}

        {items.length === 0 && (
          <div className="absolute inset-x-6 top-[42%] z-40 rounded-2xl border border-dashed border-stone-300 bg-white/75 p-4 text-center text-xs font-semibold text-stone-500 backdrop-blur dark:border-gray-600 dark:bg-gray-900/75 dark:text-gray-300">
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
            const fitting = fittingItemId === item.id;
            const transform = garmentTransforms[item.id] ?? DEFAULT_GARMENT_TRANSFORM;
            return (
              <Fragment key={item.id}>
                <div className="flex items-center gap-1.5 rounded-xl bg-stone-50 px-2.5 py-2 text-xs dark:bg-gray-800">
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
                  {onTransformChange && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setFittingItemId(fitting ? null : item.id)}
                      className={`grid h-8 w-8 place-items-center rounded-lg disabled:cursor-not-allowed disabled:opacity-50 ${
                        fitting
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-200"
                          : "text-stone-400 hover:bg-white dark:hover:bg-gray-700"
                      }`}
                      aria-label={fitting ? `Close fit controls for ${item.name}` : `Adjust fit for ${item.name}`}
                      aria-expanded={fitting}
                    >
                      <FiMove />
                    </button>
                  )}
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

                {fitting && (
                  <div className="space-y-1.5 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2.5 dark:border-rose-950 dark:bg-rose-950/20">
                    <PlacementSlider
                      disabled={disabled}
                      label="Left/right"
                      min={-25}
                      max={25}
                      value={transform.x}
                      onChange={(value) => updateTransform(item, "x", value)}
                    />
                    <PlacementSlider
                      disabled={disabled}
                      label="Up/down"
                      min={-25}
                      max={25}
                      value={transform.y}
                      onChange={(value) => updateTransform(item, "y", value)}
                    />
                    <PlacementSlider
                      disabled={disabled}
                      label="Size"
                      min={0.7}
                      max={1.4}
                      step={0.05}
                      value={transform.scale}
                      onChange={(value) => updateTransform(item, "scale", value)}
                    />
                    <PlacementSlider
                      disabled={disabled}
                      label="Tilt"
                      min={-12}
                      max={12}
                      value={transform.rotation}
                      onChange={(value) => updateTransform(item, "rotation", value)}
                    />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onTransformChange?.(item, DEFAULT_GARMENT_TRANSFORM)}
                      className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-stone-500 hover:bg-white hover:text-stone-800 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                      <FiRotateCcw /> Reset fit
                    </button>
                  </div>
                )}
              </Fragment>
            );
          })}
          {onAddJacket && (
            <button
              type="button"
              disabled={disabled}
              onClick={onAddJacket}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 px-3 py-2.5 text-xs font-bold text-stone-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/30"
            >
              <FiPlus /> Add jacket or blazer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
