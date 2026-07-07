import { format, getMonth, getYear, parseISO } from "date-fns";
import type {
  CalendarClient,
  CalendarEntry,
  CalendarStatus,
  HairStyle,
} from "../types/calendar";

export type CalendarView = "STATUS" | "DETAILS";

export type CalendarFormData = {
  status: CalendarStatus;
  clients: CalendarClient[];
  notes: string;
};

export function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function createClientId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function defaultHairStyle(): HairStyle {
  return {
    style: "knotless",
    size: "medium",
    length: "bra",
    additionalDetails: "",
  };
}

export function createBlankClient(): CalendarClient {
  return {
    id: createClientId(),
    name: "",
    startTime: "",
    price: undefined,
    hairStyle: defaultHairStyle(),
  };
}

export function normalizeHairStyle(hairStyle?: Partial<HairStyle>): HairStyle {
  return {
    style: hairStyle?.style ?? "knotless",
    size: hairStyle?.size ?? "medium",
    length: hairStyle?.length ?? "bra",
    additionalDetails: hairStyle?.additionalDetails ?? "",
  };
}

export function normalizeClientPrice(price?: number) {
  if (price === undefined || price === null) return undefined;

  const value = Number(price);
  if (!Number.isFinite(value) || value < 0) return undefined;

  return Math.round(value * 100) / 100;
}

export function normalizeClient(
  client: Partial<CalendarClient>,
  entry?: CalendarEntry
): CalendarClient {
  return {
    ...client,
    id: client.id || createClientId(),
    name: client.name ?? "",
    startTime: client.startTime ?? entry?.startTime ?? "",
    price: normalizeClientPrice(client.price),
    hairStyle: normalizeHairStyle(client.hairStyle),
  };
}

export function getEntryClients(entries: CalendarEntry[]) {
  return entries
    .flatMap((entry) =>
      (entry.clients ?? []).map((client) => normalizeClient(client, entry))
    )
    .filter((client) => client.name?.trim());
}

export function isBooked(entries: CalendarEntry[]) {
  return (
    entries.some((entry) => entry.status === "booked") ||
    getEntryClients(entries).length > 0
  );
}

export function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isExplicitlyAvailable(entries: CalendarEntry[]) {
  return entries.some((entry) => entry.status === "available");
}

export function isExplicitlyUnavailable(entries: CalendarEntry[]) {
  return entries.some((entry) => entry.status === "unavailable");
}

export function getDayStatus(
  day: Date,
  entries: CalendarEntry[]
): CalendarStatus {
  if (isBooked(entries)) return "booked";
  if (isExplicitlyUnavailable(entries)) return "unavailable";
  if (isExplicitlyAvailable(entries) || isWeekend(day)) return "available";
  return "unavailable";
}

export function getPrimaryEntry(entries: CalendarEntry[]) {
  return entries.find((entry) => entry.status === "booked") ?? entries[0];
}

export function formatHairStyle(hairStyle?: HairStyle) {
  const normalized = normalizeHairStyle(hairStyle);
  return `${normalized.size} ${normalized.style}, ${normalized.length}`;
}

export function formatClientCell(client: CalendarClient) {
  const hairStyle = normalizeHairStyle(client.hairStyle);
  const time = client.startTime ? `${client.startTime} ` : "";
  return `${time}${client.name} - ${hairStyle.size} ${hairStyle.style}`;
}

export function formatCompactClientCell(client: CalendarClient) {
  const time = client.startTime ? `${client.startTime} ` : "";
  return `${time}${client.name}`;
}

export function getClientPrice(client: CalendarClient) {
  return normalizeClientPrice(client.price) ?? 0;
}

export function getCalendarRevenue(entries: CalendarEntry[]) {
  return getEntryClients(entries).reduce(
    (total, client) => total + getClientPrice(client),
    0
  );
}

export function getCalendarClientCount(entries: CalendarEntry[]) {
  return getEntryClients(entries).length;
}

export function getCalendarRevenueByMonth(entries: CalendarEntry[], year: number) {
  const totals = Array.from({ length: 12 }, () => 0);

  entries.forEach((entry) => {
    const date = parseISO(entry.date);
    if (getYear(date) !== year) return;

    totals[getMonth(date)] += getCalendarRevenue([entry]);
  });

  return totals;
}

export function getCalendarClientsByMonth(entries: CalendarEntry[], year: number) {
  const totals = Array.from({ length: 12 }, () => 0);

  entries.forEach((entry) => {
    const date = parseISO(entry.date);
    if (getYear(date) !== year) return;

    totals[getMonth(date)] += getCalendarClientCount([entry]);
  });

  return totals;
}

export function getCalendarDailyStats(
  entries: CalendarEntry[],
  year: number,
  monthIndex: number
) {
  const totals = new Map<string, { clients: number; revenue: number }>();

  entries.forEach((entry) => {
    const date = parseISO(entry.date);
    if (getYear(date) !== year || getMonth(date) !== monthIndex) return;

    const entryClients = getCalendarClientCount([entry]);
    const entryRevenue = getCalendarRevenue([entry]);
    if (entryClients === 0 && entryRevenue === 0) return;

    const current = totals.get(entry.date) ?? { clients: 0, revenue: 0 };
    totals.set(entry.date, {
      clients: current.clients + entryClients,
      revenue: current.revenue + entryRevenue,
    });
  });

  return [...totals.entries()]
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildClients(clients: CalendarClient[]) {
  return clients
    .map((client) => {
      const price = normalizeClientPrice(client.price);

      return {
        id: client.id || createClientId(),
        name: client.name.trim(),
        startTime: client.startTime,
        ...(price !== undefined ? { price } : {}),
        hairStyle: {
          ...normalizeHairStyle(client.hairStyle),
          additionalDetails: client.hairStyle?.additionalDetails?.trim() ?? "",
        },
      };
    })
    .filter((client) => client.name);
}
