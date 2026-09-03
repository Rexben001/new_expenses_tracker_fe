export const WARDROBE_CATEGORIES = [
  "top",
  "shirt",
  "dress",
  "blazer-jacket",
  "trousers",
  "skirt",
] as const;

export type WardrobeCategory = (typeof WARDROBE_CATEGORIES)[number];

export const WARDROBE_COLOR_FAMILIES = [
  "black",
  "white",
  "gray",
  "beige",
  "brown",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
] as const;

export type WardrobeColorFamily =
  (typeof WARDROBE_COLOR_FAMILIES)[number];
export type WardrobeColorTone = "dark" | "light";

export type WardrobeItem = {
  id: string;
  name: string;
  category: WardrobeCategory;
  colorFamily: WardrobeColorFamily;
  colorHex: string;
  colorTone: WardrobeColorTone;
  imageKey: string;
  imageUrl: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WardrobeItemPayload = Pick<
  WardrobeItem,
  "category" | "colorFamily" | "colorHex" | "colorTone" | "favorite" | "name"
> & {
  id: string;
  imageKey: string;
};

export type WardrobePlanDay = {
  date: string;
  itemIds: string[];
  lockedItemIds: string[];
  favorite: boolean;
};

export type WardrobeWeekPlan = {
  weekStart: string;
  generation: number;
  days: WardrobePlanDay[];
  createdAt?: string;
  updatedAt?: string;
};

export const WARDROBE_CATEGORY_LABELS: Record<WardrobeCategory, string> = {
  top: "Tops",
  shirt: "Shirts",
  dress: "Dresses",
  "blazer-jacket": "Blazers & jackets",
  trousers: "Trousers",
  skirt: "Skirts",
};
