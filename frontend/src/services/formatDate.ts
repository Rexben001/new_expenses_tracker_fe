import {
  isToday,
  isYesterday,
  format,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  differenceInYears,
} from "date-fns";
import { parseISO } from "date-fns";

export function formatRelativeDate(date?: string): string {
  if (!date) return "";
  const now = new Date();

  const time = format(new Date(date), "h:mmaaa").toLowerCase(); // e.g. '4:30pm'

  if (isToday(date)) {
    return `Today, ${time}`;
  }

  if (isYesterday(date)) {
    return `Yesterday, ${time}`;
  }

  const weeksDiff = differenceInCalendarWeeks(now, date);
  if (weeksDiff === 1) {
    return `Last week, ${time}`;
  }

  const monthsDiff = differenceInCalendarMonths(now, date);
  if (monthsDiff === 1) {
    return `Last month, ${time}`;
  }

  const yearsDiff = differenceInYears(now, date);
  if (yearsDiff === 1) {
    return `Last year, ${time}`;
  }

  if (yearsDiff >= 2) {
    return `${format(date, "MMM d, yyyy")}, ${time}`;
  }

  return `${format(date, "MMM d")}, ${time}`;
}

export function getMonth() {
  const date = parseISO(new Date().toISOString());

  return format(date, "MMMM"); // 👉 "June"
}

export function getTimeOfTheDay() {
  const hour = new Date().getHours();

  let timeOfDay = "Night";
  if (hour >= 5 && hour < 12) timeOfDay = "Morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "Afternoon";
  else if (hour >= 17 && hour < 22) timeOfDay = "Evening";

  return timeOfDay;
}
