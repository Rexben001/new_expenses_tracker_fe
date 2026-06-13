import { describe, expect, test, vi } from "vitest";
import type { CalendarClient, CalendarEntry } from "../types/calendar";
import {
  buildClients,
  formatClientCell,
  formatCompactClientCell,
  formatHairStyle,
  getDayStatus,
  getEntryClients,
  getPrimaryEntry,
  normalizeHairStyle,
  toDateKey,
} from "./calendarRules";

vi.stubGlobal("crypto", {
  randomUUID: () => "generated-id",
});

function entry(
  fields: Partial<CalendarEntry> & Pick<CalendarEntry, "date" | "status">
): CalendarEntry {
  return {
    clients: [],
    id: "entry-1",
    updatedAt: "2026-06-09T00:00:00.000Z",
    ...fields,
  };
}

describe("calendar rules", () => {
  test("formats date keys in the API date format", () => {
    expect(toDateKey(new Date("2026-06-09T12:00:00.000Z"))).toBe(
      "2026-06-09"
    );
  });

  test("makes weekends available by default and weekdays unavailable by default", () => {
    expect(getDayStatus(new Date("2026-06-06"), [])).toBe("available");
    expect(getDayStatus(new Date("2026-06-07"), [])).toBe("available");
    expect(getDayStatus(new Date("2026-06-09"), [])).toBe("unavailable");
  });

  test("lets explicit availability override weekday defaults", () => {
    expect(
      getDayStatus(new Date("2026-06-09"), [
        entry({ date: "2026-06-09", status: "available" }),
      ])
    ).toBe("available");
  });

  test("lets explicit unavailable override weekend defaults", () => {
    expect(
      getDayStatus(new Date("2026-06-07"), [
        entry({ date: "2026-06-07", status: "unavailable" }),
      ])
    ).toBe("unavailable");
  });

  test("treats booked entries and entries with clients as booked", () => {
    const client: CalendarClient = {
      hairStyle: normalizeHairStyle(),
      name: "Ada",
      startTime: "10:00",
    };

    expect(
      getDayStatus(new Date("2026-06-09"), [
        entry({ date: "2026-06-09", status: "booked" }),
      ])
    ).toBe("booked");
    expect(
      getDayStatus(new Date("2026-06-09"), [
        entry({
          clients: [client],
          date: "2026-06-09",
          status: "available",
        }),
      ])
    ).toBe("booked");
  });

  test("normalizes legacy entry clients with fallback start time and default hair style", () => {
    const clients = getEntryClients([
      entry({
        clients: [
          {
            hairStyle: {
              style: "boho",
              size: "small",
              length: "waist",
            },
            name: "Ada",
          },
          {
            hairStyle: normalizeHairStyle(),
            name: "   ",
          },
        ],
        date: "2026-06-09",
        startTime: "09:30",
        status: "booked",
      }),
    ]);

    expect(clients).toHaveLength(1);
    expect(clients[0]).toEqual(
      expect.objectContaining({
        hairStyle: {
          additionalDetails: "",
          length: "waist",
          size: "small",
          style: "boho",
        },
        name: "Ada",
        startTime: "09:30",
      })
    );
  });

  test("selects booked entry as the primary entry", () => {
    const available = entry({
      date: "2026-06-09",
      id: "available-entry",
      status: "available",
    });
    const booked = entry({
      date: "2026-06-09",
      id: "booked-entry",
      status: "booked",
    });

    expect(getPrimaryEntry([available, booked])).toBe(booked);
    expect(getPrimaryEntry([available])).toBe(available);
  });

  test("builds clients by trimming names/details, dropping blanks, and applying defaults", () => {
    expect(
      buildClients([
        {
          hairStyle: {
            additionalDetails: "  curls at the end  ",
            length: "waist",
            size: "small",
            style: "boho",
          },
          name: "  Ada  ",
          startTime: "10:00",
        },
        {
          hairStyle: normalizeHairStyle(),
          name: "   ",
          startTime: "11:00",
        },
      ])
    ).toEqual([
      {
        hairStyle: {
          additionalDetails: "curls at the end",
          length: "waist",
          size: "small",
          style: "boho",
        },
        id: "generated-id",
        name: "Ada",
        startTime: "10:00",
      },
    ]);
  });

  test("formats client labels for calendar cells and detail rows", () => {
    const client: CalendarClient = {
      hairStyle: {
        additionalDetails: "",
        length: "bra",
        size: "medium",
        style: "knotless",
      },
      name: "Ada",
      startTime: "10:00",
    };

    expect(formatHairStyle(client.hairStyle)).toBe("medium knotless, bra");
    expect(formatClientCell(client)).toBe("10:00 Ada - medium knotless");
    expect(formatCompactClientCell(client)).toBe("10:00 Ada");
  });
});
