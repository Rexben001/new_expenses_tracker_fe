import {
  isToday,
  isYesterday,
  format,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  differenceInYears,
  parseISO,
  subMonths,
  getMonth as getMonthFn,
  getYear as getYearFn,
} from "date-fns";

export function formatRelativeDate(date?: string): string {
  if (!date) return "";
  const now = new Date();

  if (isToday(date)) {
    return `Today`;
  }

  if (isYesterday(date)) {
    return `Yesterday`;
  }

  const weeksDiff = differenceInCalendarWeeks(now, date);
  if (weeksDiff === 1) {
    return `Last week`;
  }

  const monthsDiff = differenceInCalendarMonths(now, date);
  if (monthsDiff === 1) {
    return `Last month`;
  }

  const yearsDiff = differenceInYears(now, date);
  if (yearsDiff === 1) {
    return `Last year`;
  }

  if (yearsDiff >= 2) {
    return `${format(date, "MMM d, yyyy")}`;
  }

  return `${format(date, "MMM d")}`;
}

export function getMonth(userBudgetStartDay = 1) {
  const date = parseISO(new Date().toISOString());

  if (userBudgetStartDay > 1) {
    const previousMonthDate = subMonths(date, 1);

    return `${format(previousMonthDate, "MMM")} - ${format(date, "MMM")}`;
  }

  return format(date, "MMMM");
}

export function getTimeOfTheDay() {
  const hour = new Date().getHours();

  let timeOfDay = "Night";
  if (hour >= 5 && hour < 12) timeOfDay = "Morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "Afternoon";
  else if (hour >= 17 && hour < 22) timeOfDay = "Evening";

  return timeOfDay;
}

export function getYear() {
  const date = parseISO(new Date().toISOString());

  return format(date, "yyyy");
}

export function getMonthAndYear(date: string) {
  const parseDate = new Date(date);

  return format(parseDate, "MMM yyyy");
}

export function getDefaultBudgetMonthYear(budgetStartDay = 23) {
  const now = new Date();
  const ref = now.getDate() < budgetStartDay ? subMonths(now, 1) : now;

  return {
    month: String(getMonthFn(ref) + 1),
    year: String(getYearFn(ref)),
  };
}
