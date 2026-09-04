import type { CalendarClient, CalendarEntry } from "../types/calendar";

export type PrefillSource = "context" | "history" | "profile" | "rule";

export type SmartDefault<T> = {
  value: T;
  confidence: "high" | "medium";
  source: PrefillSource;
};

export function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findExactNamedItem<T>(
  name: string,
  items: T[],
  getName: (item: T) => string,
) {
  const normalized = normalizeForMatch(name);
  if (!normalized) return undefined;
  return items.find((item) => normalizeForMatch(getName(item)) === normalized);
}

export function mostFrequent(values: Array<string | undefined | null>) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const clean = value?.trim();
    if (clean) counts.set(clean, (counts.get(clean) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0];
}

export function applyUntouchedDefaults<T extends object>(
  current: T,
  defaults: Partial<T>,
  touched: ReadonlySet<keyof T>,
) {
  const next = { ...current };
  (Object.keys(defaults) as Array<keyof T>).forEach((key) => {
    if (!touched.has(key) && defaults[key] !== undefined) {
      next[key] = defaults[key] as T[keyof T];
    }
  });
  return next;
}

export function inferShoppingDefaults(
  name: string,
  history: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
  }>,
) {
  const previous = findExactNamedItem(name, history, (item) => item.name);
  if (previous) {
    return {
      quantity: previous.quantity || 1,
      unit: previous.unit || "pieces",
      category: previous.category || "Other",
    };
  }

  const value = normalizeForMatch(name);
  const match = (
    pattern: RegExp,
    category: string,
    unit = "pieces",
  ) => pattern.test(value) ? { quantity: 1, unit, category } : undefined;

  return (
    match(/soap|shampoo|tooth|cream|deodorant|razor/, "Personal care")
    ?? match(/shirt|trouser|dress|skirt|jacket|sock|shoe|clothes/, "Clothing")
    ?? match(/cable|charger|battery|phone|keyboard|mouse|headphone/, "Electronics")
    ?? match(/pen|paper|notebook|printer|staple/, "Office")
    ?? match(/clean|detergent|tissue|toilet|bin|sponge|kitchen/, "Household")
  );
}

export function inferHowToMetadata(title: string) {
  const value = normalizeForMatch(title);
  const match = (pattern: RegExp, category: string, tags: string[]) =>
    pattern.test(value) ? { category, tags } : undefined;

  return (
    match(/login|account|password|sign in|portal/, "Accounts", ["account", "login"])
    ?? match(/payment|bill|subscription|invoice|direct debit/, "Payments", ["payment", "billing"])
    ?? match(/recipe|cook|meal|food/, "Food", ["food", "instructions"])
    ?? match(/deploy|server|website|app|code|software/, "Technology", ["technology", "instructions"])
    ?? match(/home|clean|repair|house/, "Home", ["home", "instructions"])
    ?? match(/work|office|process|client/, "Work", ["work", "process"])
  );
}

export function buildWardrobeName({
  category,
  colorFamily,
  colorTone,
}: {
  category: string;
  colorFamily: string;
  colorTone: string;
}) {
  const categoryName: Record<string, string> = {
    top: "top",
    shirt: "shirt",
    dress: "dress",
    "blazer-jacket": "jacket",
    trousers: "trousers",
    skirt: "skirt",
  };
  const parts = [colorTone, colorFamily, categoryName[category] ?? category]
    .map((part) => part.trim().toLowerCase())
    .filter((part, index, all) => part && all.indexOf(part) === index);
  const name = parts.join(" ");
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "Garment";
}

function minutesFromTime(value?: string) {
  const [hours, minutes] = (value ?? "").split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes)
    ? hours * 60 + minutes
    : -1;
}

function timeFromMinutes(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function nextCalendarStartTime(
  dateKey: string,
  entries: CalendarEntry[],
  now = new Date(),
) {
  const occupied = new Set(
    entries
      .filter((entry) => entry.date === dateKey)
      .flatMap((entry) => entry.clients ?? [])
      .map((client) => minutesFromTime(client.startTime))
      .filter((minutes) => minutes >= 0),
  );
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const earliest = dateKey === today
    ? Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30
    : 9 * 60;

  for (let minutes = 9 * 60; minutes <= 19 * 60; minutes += 30) {
    if (minutes >= earliest && !occupied.has(minutes)) return timeFromMinutes(minutes);
  }
  return "09:00";
}

export function findPreviousCalendarClient(
  name: string,
  entries: CalendarEntry[],
): CalendarClient | undefined {
  const clients = entries
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date))
    .flatMap((entry) => entry.clients ?? []);
  return findExactNamedItem(name, clients, (client) => client.name);
}
