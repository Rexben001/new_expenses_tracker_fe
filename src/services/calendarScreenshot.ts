import { format, isSameMonth, isToday } from "date-fns";
import type { CalendarEntry } from "../types/calendar";
import {
  type CalendarView,
  formatClientCell,
  getDayStatus,
  getEntryClients,
  toDateKey,
} from "./calendarRules";

function fillRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
  context.fill();
}

function strokeRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
  context.stroke();
}

function drawTextFit(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
) {
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return;
  }

  let truncated = text;
  while (
    truncated.length > 1 &&
    context.measureText(`${truncated}...`).width > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  context.fillText(`${truncated}...`, x, y);
}

function getScreenshotPalette() {
  const darkMode = document.documentElement.classList.contains("dark");

  if (darkMode) {
    return {
      page: "#020617",
      title: "#f8fafc",
      subtitle: "#cbd5e1",
      weekday: "#94a3b8",
      date: "#f8fafc",
      today: "#3b82f6",
      todayText: "#ffffff",
      outsideBg: "#0f172a",
      outsideBorder: "#1f2937",
      outsideText: "#475569",
      bookedBg: "#450a0a",
      bookedBorder: "#991b1b",
      bookedText: "#fecaca",
      bookedPillBg: "#7f1d1d",
      bookedPillText: "#fee2e2",
      availableBg: "#052e16",
      availableBorder: "#166534",
      availableText: "#bbf7d0",
      unavailableBg: "#111827",
      unavailableBorder: "#374151",
      unavailableText: "#94a3b8",
    };
  }

  return {
    page: "#f8fafc",
    title: "#0f172a",
    subtitle: "#475569",
    weekday: "#64748b",
    date: "#0f172a",
    today: "#2563eb",
    todayText: "#ffffff",
    outsideBg: "#f1f5f9",
    outsideBorder: "#e2e8f0",
    outsideText: "#94a3b8",
    bookedBg: "#fee2e2",
    bookedBorder: "#fecaca",
    bookedText: "#b91c1c",
    bookedPillBg: "#ffffff",
    bookedPillText: "#b91c1c",
    availableBg: "#dcfce7",
    availableBorder: "#bbf7d0",
    availableText: "#15803d",
    unavailableBg: "#f8fafc",
    unavailableBorder: "#e2e8f0",
    unavailableText: "#64748b",
  };
}

export function drawCalendarPng({
  calendarDays,
  calendarMonth,
  calendarView,
  entriesByDate,
}: {
  calendarDays: Date[];
  calendarMonth: Date;
  calendarView: CalendarView;
  entriesByDate: Map<string, CalendarEntry[]>;
}) {
  const width = 1200;
  const padding = 64;
  const gap = 10;
  const weekdayTop = 154;
  const gridTop = 194;
  const cellWidth = (width - padding * 2 - gap * 6) / 7;
  const cellHeight = calendarView === "DETAILS" ? 150 : 120;
  const rows = Math.ceil(calendarDays.length / 7);
  const height = gridTop + rows * cellHeight + (rows - 1) * gap + 80;
  const scale = 2;
  const palette = getScreenshotPalette();
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create screenshot canvas");
  }

  context.scale(scale, scale);
  context.fillStyle = palette.page;
  context.fillRect(0, 0, width, height);

  context.fillStyle = palette.title;
  context.font =
    "700 42px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText(
    calendarView === "DETAILS" ? "Calendar Details" : "Calendar Availability",
    padding,
    74
  );

  context.fillStyle = palette.subtitle;
  context.font =
    "500 22px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText(format(calendarMonth, "MMMM yyyy"), padding, 112);

  context.fillStyle = palette.weekday;
  context.textAlign = "center";
  context.font =
    "700 18px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((day, index) => {
    const x = padding + index * (cellWidth + gap) + cellWidth / 2;
    context.fillText(day, x, weekdayTop);
  });
  context.textAlign = "left";

  calendarDays.forEach((day, index) => {
    const dayKey = toDateKey(day);
    const row = Math.floor(index / 7);
    const col = index % 7;
    const x = padding + col * (cellWidth + gap);
    const y = gridTop + row * (cellHeight + gap);
    const entries = entriesByDate.get(dayKey) ?? [];
    const clients = getEntryClients(entries);
    const status = getDayStatus(day, entries);
    const inMonth = isSameMonth(day, calendarMonth);

    context.fillStyle = !inMonth
      ? palette.outsideBg
      : status === "booked"
      ? palette.bookedBg
      : status === "available"
      ? palette.availableBg
      : palette.unavailableBg;
    fillRoundRect(context, x, y, cellWidth, cellHeight, 18);
    context.strokeStyle = !inMonth
      ? palette.outsideBorder
      : status === "booked"
      ? palette.bookedBorder
      : status === "available"
      ? palette.availableBorder
      : palette.unavailableBorder;
    context.lineWidth = 2;
    strokeRoundRect(context, x, y, cellWidth, cellHeight, 18);

    if (isToday(day)) {
      context.fillStyle = palette.today;
      fillRoundRect(context, x + 14, y + 12, 36, 30, 15);
      context.fillStyle = palette.todayText;
    } else {
      context.fillStyle = inMonth ? palette.date : palette.outsideText;
    }
    context.font =
      "700 22px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText(format(day, "d"), x + 24, y + 35);

    if (!inMonth) return;

    if (calendarView === "STATUS") {
      context.fillStyle =
        status === "booked"
          ? palette.bookedText
          : status === "available"
          ? palette.availableText
          : palette.unavailableText;
      context.font =
        "700 18px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      context.fillText(
        status === "booked"
          ? "Booked"
          : status === "available"
          ? "Available"
          : "Unavailable",
        x + 16,
        y + cellHeight - 24
      );
      return;
    }

    if (status === "booked") {
      context.font =
        "700 15px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      clients.slice(0, 3).forEach((client, clientIndex) => {
        const pillY = y + 52 + clientIndex * 28;
        context.fillStyle = palette.bookedPillBg;
        fillRoundRect(context, x + 12, pillY, cellWidth - 24, 23, 8);
        context.fillStyle = palette.bookedPillText;
        drawTextFit(
          context,
          formatClientCell(client),
          x + 22,
          pillY + 16,
          cellWidth - 44
        );
      });

      if (clients.length > 3) {
        context.fillStyle = palette.bookedText;
        context.fillText(`+${clients.length - 3} more`, x + 18, y + 142);
      }
    } else {
      context.fillStyle =
        status === "available" ? palette.availableText : palette.unavailableText;
      context.font =
        "700 17px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      context.fillText(
        status === "available" ? "Available" : "Unavailable",
        x + 16,
        y + cellHeight - 20
      );
    }
  });

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create screenshot"));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
