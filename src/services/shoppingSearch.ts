import type { ShoppingItem } from "../types/shopping";

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function filterShoppingItems(items: ShoppingItem[], query: string) {
  const terms = normalizeSearchText(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return items;

  return items.filter((item) => {
    const searchableText = normalizeSearchText([
      item.name,
      item.category,
      item.notes,
      item.unit,
      item.source,
      item.purchasedAt,
    ].join(" "));

    return terms.every((term) => searchableText.includes(term));
  });
}
