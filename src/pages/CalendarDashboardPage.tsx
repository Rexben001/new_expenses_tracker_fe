import {
  addMonths,
  format,
  getMonth,
  getYear,
  parseISO,
  startOfMonth,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
  FiBarChart2,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import { useItemContext } from "../hooks/useItemContext";
import {
  getCalendarClientsByMonth,
  getCalendarDailyStats,
  getCalendarRevenueByMonth,
  getClientPrice,
  getEntryClients,
  normalizeHairStyle,
} from "../services/calendarRules";
import { formatCurrency } from "../services/formatCurrency";

export function CalendarDashboardPage() {
  const { calendarEntries, fetchCalendarEntries } = useItemContext();
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date())
  );

  useEffect(() => {
    void fetchCalendarEntries();
  }, [fetchCalendarEntries]);

  const calendarYear = getYear(calendarMonth);
  const calendarMonthIndex = getMonth(calendarMonth);
  const monthlyRevenueTotals = useMemo(
    () => getCalendarRevenueByMonth(calendarEntries, calendarYear),
    [calendarEntries, calendarYear]
  );
  const monthlyClientTotals = useMemo(
    () => getCalendarClientsByMonth(calendarEntries, calendarYear),
    [calendarEntries, calendarYear]
  );
  const dailyStats = useMemo(
    () =>
      getCalendarDailyStats(
        calendarEntries,
        calendarYear,
        calendarMonthIndex
      ),
    [calendarEntries, calendarMonthIndex, calendarYear]
  );
  const styleStats = useMemo(() => {
    const stats = new Map<string, { clients: number; revenue: number }>();

    calendarEntries.forEach((entry) => {
      const date = parseISO(entry.date);
      if (getYear(date) !== calendarYear || getMonth(date) !== calendarMonthIndex) {
        return;
      }

      getEntryClients([entry]).forEach((client) => {
        const style = normalizeHairStyle(client.hairStyle).style;
        const current = stats.get(style) ?? { clients: 0, revenue: 0 };
        stats.set(style, {
          clients: current.clients + 1,
          revenue: current.revenue + getClientPrice(client),
        });
      });
    });

    return [...stats.entries()]
      .map(([style, totals]) => ({ style, ...totals }))
      .sort((a, b) => b.revenue - a.revenue || b.clients - a.clients);
  }, [calendarEntries, calendarMonthIndex, calendarYear]);

  const monthRevenue = monthlyRevenueTotals[calendarMonthIndex] ?? 0;
  const yearRevenue = monthlyRevenueTotals.reduce((total, value) => total + value, 0);
  const monthClientCount = monthlyClientTotals[calendarMonthIndex] ?? 0;
  const yearClientCount = monthlyClientTotals.reduce((total, value) => total + value, 0);
  const averagePerClient = monthClientCount ? monthRevenue / monthClientCount : 0;
  const bookedDays = dailyStats.filter((day) => day.clients > 0).length;
  const bestDay = dailyStats.reduce(
    (best, day) => (day.revenue > best.revenue ? day : best),
    { clients: 0, date: "", revenue: 0 }
  );
  const maxDayRevenue = Math.max(...dailyStats.map((day) => day.revenue), 1);
  const maxStyleRevenue = Math.max(...styleStats.map((style) => style.revenue), 1);

  return (
    <SwipeShell toRight="/calendar" refresh={fetchCalendarEntries}>
      <HeaderComponent title="Calendar Dashboard">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold leading-tight">
              <FiBarChart2 className="h-5 w-5 text-emerald-600" />
              Calendar Stats
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(calendarMonth, "MMMM yyyy")}
            </p>
          </div>
          <Link
            to="/calendar"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
          >
            <FiCalendar className="h-3.5 w-3.5" />
            Calendar
          </Link>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCalendarMonth((month) => addMonths(month, -1))}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-gray-950 dark:text-gray-50">
            {format(calendarMonth, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCalendarMonth((month) => addMonths(month, 1))}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
        </div>
      </HeaderComponent>

      <main className="mx-auto mt-36 min-h-screen max-w-md px-4 pb-32 dark:text-white">
        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-100">
              <FiDollarSign className="h-3.5 w-3.5" />
              Month revenue
            </p>
            <p className="mt-1 truncate text-lg font-bold text-emerald-900 dark:text-emerald-50">
              {formatCurrency(monthRevenue)}
            </p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-100">
              <FiUsers className="h-3.5 w-3.5" />
              Month clients
            </p>
            <p className="mt-1 truncate text-lg font-bold text-blue-900 dark:text-blue-50">
              {monthClientCount}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Year revenue
            </p>
            <p className="mt-1 truncate text-lg font-bold text-gray-950 dark:text-gray-50">
              {formatCurrency(yearRevenue)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Year clients
            </p>
            <p className="mt-1 truncate text-lg font-bold text-gray-950 dark:text-gray-50">
              {yearClientCount}
            </p>
          </div>
        </section>

        <section className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Booked days
            </p>
            <p className="mt-1 text-base font-bold text-gray-950 dark:text-gray-50">
              {bookedDays}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Avg/client
            </p>
            <p className="mt-1 truncate text-base font-bold text-gray-950 dark:text-gray-50">
              {formatCurrency(averagePerClient, "EUR", false)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Best day
            </p>
            <p className="mt-1 truncate text-base font-bold text-gray-950 dark:text-gray-50">
              {bestDay.date ? format(parseISO(bestDay.date), "d MMM") : "-"}
            </p>
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-950 dark:text-gray-50">
              Monthly Summary
            </h2>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {calendarYear}
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-[3.25rem_1fr_3.5rem_4.5rem] gap-2 bg-gray-50 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <span>Month</span>
              <span>Revenue</span>
              <span className="text-right">Clients</span>
              <span className="text-right">Avg</span>
            </div>
            {monthlyRevenueTotals.map((revenue, monthIndex) => {
              const clients = monthlyClientTotals[monthIndex] ?? 0;
              const average = clients ? revenue / clients : 0;
              const active = monthIndex === calendarMonthIndex;

              return (
                <div
                  key={monthIndex}
                  className={`grid grid-cols-[3.25rem_1fr_3.5rem_4.5rem] items-center gap-2 border-t border-gray-100 px-2 py-2 text-xs dark:border-gray-800 ${
                    active
                      ? "bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  <span className="font-semibold">
                    {format(new Date(calendarYear, monthIndex, 1), "MMM")}
                  </span>
                  <span className="truncate font-semibold text-emerald-700 dark:text-emerald-100">
                    {formatCurrency(revenue, "EUR", false)}
                  </span>
                  <span className="text-right font-semibold">{clients}</span>
                  <span className="truncate text-right font-semibold">
                    {formatCurrency(average, "EUR", false)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-950 dark:text-gray-50">
            Daily Breakdown
          </h2>
          {dailyStats.length ? (
            <div className="space-y-2">
              {dailyStats.map((day) => {
                const width = `${(day.revenue / maxDayRevenue) * 100}%`;

                return (
                  <div
                    key={day.date}
                    className="rounded-lg border border-gray-100 p-2 dark:border-gray-800"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {format(parseISO(day.date), "EEE, d MMM")}
                      </span>
                      <span className="shrink-0 font-semibold text-gray-700 dark:text-gray-200">
                        {formatCurrency(day.revenue)}
                      </span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <span className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <span
                          className="block h-full rounded-full bg-emerald-500"
                          style={{ width }}
                        />
                      </span>
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-200">
                        {day.clients} client{day.clients === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg bg-gray-50 p-3 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              No booked clients for this month.
            </p>
          )}
        </section>

        <section className="mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-950 dark:text-gray-50">
            Style Mix
          </h2>
          {styleStats.length ? (
            <div className="space-y-2">
              {styleStats.map((style) => {
                const width = `${(style.revenue / maxStyleRevenue) * 100}%`;

                return (
                  <div
                    key={style.style}
                    className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2 text-xs"
                  >
                    <span className="truncate font-semibold capitalize text-gray-700 dark:text-gray-200">
                      {style.style}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <span
                        className="block h-full rounded-full bg-blue-500"
                        style={{ width }}
                      />
                    </span>
                    <span className="truncate text-right font-semibold text-gray-700 dark:text-gray-200">
                      {style.clients} / {formatCurrency(style.revenue, "EUR", false)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg bg-gray-50 p-3 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              No styles booked for this month.
            </p>
          )}
        </section>
      </main>

      <FooterNav />
    </SwipeShell>
  );
}
