import { addDays, formatISO } from "date-fns";
import type {
  WardrobeCategory,
  WardrobeItem,
  WardrobePlanDay,
  WardrobeWeekPlan,
} from "../types/wardrobe";
import { hexToRgb, rgbToHsl } from "./wardrobeColors";

const UPPER_CATEGORIES = new Set<WardrobeCategory>(["top", "shirt"]);
const LOWER_CATEGORIES = new Set<WardrobeCategory>(["trousers", "skirt"]);
const NEUTRAL_FAMILIES = new Set(["black", "white", "gray", "beige", "brown"]);

type OutfitCandidate = {
  itemIds: string[];
  score: number;
};

const isoDate = (date: Date) => formatISO(date, { representation: "date" });

function hueDistance(left: number, right: number) {
  const distance = Math.abs(left - right) % 360;
  return Math.min(distance, 360 - distance);
}

export function scoreColorPair(left: WardrobeItem, right: WardrobeItem) {
  const toneContrast = left.colorTone === right.colorTone ? 0 : 0.8;
  const leftNeutral = NEUTRAL_FAMILIES.has(left.colorFamily);
  const rightNeutral = NEUTRAL_FAMILIES.has(right.colorFamily);

  if (leftNeutral || rightNeutral) {
    return (leftNeutral && rightNeutral ? 3.2 : 4.2) + toneContrast;
  }

  const leftHue = rgbToHsl(hexToRgb(left.colorHex)).hue;
  const rightHue = rgbToHsl(hexToRgb(right.colorHex)).hue;
  const distance = hueDistance(leftHue, rightHue);

  if (distance <= 18) return 4.4 + toneContrast;
  if (distance <= 62) return 3.7 + toneContrast;
  if (distance >= 145) return 4 + toneContrast;
  if (distance >= 100 && distance <= 140) return 3 + toneContrast;
  return 1.4 + toneContrast;
}

function averagePairScore(items: WardrobeItem[]) {
  if (items.length < 2) return 3;
  let score = 0;
  let pairs = 0;
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      score += scoreColorPair(items[left], items[right]);
      pairs += 1;
    }
  }
  return score / pairs;
}

export function buildOutfitCandidates(items: WardrobeItem[]): OutfitCandidate[] {
  const dresses = items.filter((item) => item.category === "dress");
  const uppers = items.filter((item) => UPPER_CATEGORIES.has(item.category));
  const lowers = items.filter((item) => LOWER_CATEGORIES.has(item.category));
  const jackets = items.filter((item) => item.category === "blazer-jacket");
  const candidates: OutfitCandidate[] = dresses.map((dress) => ({
    itemIds: [dress.id],
    score: 4 + (dress.favorite ? 0.25 : 0),
  }));

  for (const upper of uppers) {
    for (const lower of lowers) {
      const baseScore = scoreColorPair(upper, lower);
      if (baseScore < 2.2) continue;
      const baseItems = [upper, lower];
      candidates.push({
        itemIds: baseItems.map((item) => item.id),
        score:
          baseScore + baseItems.filter((item) => item.favorite).length * 0.25,
      });

      for (const jacket of jackets) {
        const outfitItems = [...baseItems, jacket];
        const jacketScore = averagePairScore(outfitItems);
        if (jacketScore < 2.7) continue;
        candidates.push({
          itemIds: outfitItems.map((item) => item.id),
          score:
            jacketScore +
            outfitItems.filter((item) => item.favorite).length * 0.25,
        });
      }
    }
  }

  return candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return left.itemIds.join(":").localeCompare(right.itemIds.join(":"));
  });
}

function stringHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function emptyPlanDay(date: string): WardrobePlanDay {
  return { date, itemIds: [], lockedItemIds: [], favorite: false };
}

export function generateWardrobeWeek({
  currentPlan,
  items,
  weekStart,
}: {
  currentPlan?: WardrobeWeekPlan | null;
  items: WardrobeItem[];
  weekStart: string;
}): WardrobeWeekPlan {
  const generation =
    currentPlan?.weekStart === weekStart ? currentPlan.generation + 1 : 1;
  const itemIds = new Set(items.map((item) => item.id));
  const currentByDate = new Map(
    (currentPlan?.days ?? []).map((day) => [day.date, day]),
  );
  const candidates = buildOutfitCandidates(items);
  const usage = new Map<string, number>();
  const days: WardrobePlanDay[] = [];
  let previousIds = new Set<string>();

  for (let offset = 0; offset < 7; offset += 1) {
    const date = isoDate(addDays(new Date(`${weekStart}T12:00:00`), offset));
    const current = currentByDate.get(date);
    const lockedIds = (current?.lockedItemIds ?? []).filter((id) => itemIds.has(id));

    if (current?.favorite) {
      const keptIds = current.itemIds.filter((id) => itemIds.has(id));
      keptIds.forEach((id) => usage.set(id, (usage.get(id) ?? 0) + 1));
      previousIds = new Set(keptIds);
      days.push({ ...current, itemIds: keptIds, lockedItemIds: lockedIds });
      continue;
    }

    const compatible = candidates.filter((candidate) =>
      lockedIds.every((id) => candidate.itemIds.includes(id)),
    );
    if (lockedIds.length > 0 && compatible.length === 0 && current) {
      const keptIds = current.itemIds.filter((id) => itemIds.has(id));
      keptIds.forEach((id) => usage.set(id, (usage.get(id) ?? 0) + 1));
      previousIds = new Set(keptIds);
      days.push({ ...current, itemIds: keptIds, lockedItemIds: lockedIds });
      continue;
    }
    const pool = compatible.length > 0 ? compatible : candidates;
    const ranked = pool
      .map((candidate) => {
        const reusePenalty = candidate.itemIds.reduce(
          (total, id) => total + (usage.get(id) ?? 0) * 1.8,
          0,
        );
        const consecutivePenalty = candidate.itemIds.some((id) => previousIds.has(id))
          ? 2.4
          : 0;
        const rotation =
          (stringHash(
            `${weekStart}:${generation}:${offset}:${candidate.itemIds.join(":")}`,
          ) %
            1000) /
          1500;
        return {
          ...candidate,
          rank: candidate.score - reusePenalty - consecutivePenalty + rotation,
        };
      })
      .sort((left, right) => right.rank - left.rank);
    const selected = ranked[0];
    const nextDay = current ?? emptyPlanDay(date);
    const selectedIds = selected?.itemIds ?? [];
    selectedIds.forEach((id) => usage.set(id, (usage.get(id) ?? 0) + 1));
    previousIds = new Set(selectedIds);
    days.push({
      ...nextDay,
      date,
      itemIds: selectedIds,
      lockedItemIds: lockedIds,
    });
  }

  return { weekStart, generation, days };
}

export function regenerateWardrobeDay({
  date,
  items,
  plan,
}: {
  date: string;
  items: WardrobeItem[];
  plan: WardrobeWeekPlan;
}) {
  const protectedPlan: WardrobeWeekPlan = {
    ...plan,
    days: plan.days.map((day) =>
      day.date === date
        ? { ...day, favorite: false }
        : { ...day, favorite: true },
    ),
  };
  const regenerated = generateWardrobeWeek({
    currentPlan: protectedPlan,
    items,
    weekStart: plan.weekStart,
  });
  const originalByDate = new Map(plan.days.map((day) => [day.date, day]));

  return {
    ...regenerated,
    days: regenerated.days.map((day) => {
      if (day.date !== date) return originalByDate.get(day.date) ?? day;
      return { ...day, favorite: originalByDate.get(day.date)?.favorite ?? false };
    }),
  };
}

export function categoriesCanReplace(
  current: WardrobeCategory,
  replacement: WardrobeCategory,
) {
  if (current === replacement) return true;
  return (
    (UPPER_CATEGORIES.has(current) && UPPER_CATEGORIES.has(replacement)) ||
    (LOWER_CATEGORIES.has(current) && LOWER_CATEGORIES.has(replacement))
  );
}

export function scoreReplacement(
  replacement: WardrobeItem,
  otherItems: WardrobeItem[],
) {
  return averagePairScore([replacement, ...otherItems]);
}
