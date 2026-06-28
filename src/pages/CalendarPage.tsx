import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiPlus,
  FiShare2,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import { Modal } from "../components/Modal";
import SwipeShell from "../components/SwipeShell";
import { useItemContext } from "../hooks/useItemContext";
import {
  createCalendarEntry,
  deleteCalendarEntry,
  updateCalendarEntry,
} from "../services/api";
import {
  canvasToBlob,
  downloadBlob,
  drawCalendarPng,
} from "../services/calendarScreenshot";
import {
  type CalendarFormData,
  type CalendarView,
  buildClients,
  createBlankClient,
  createClientId,
  formatCompactClientCell,
  formatHairStyle,
  getDayStatus,
  getEntryClients,
  getPrimaryEntry,
  isBooked,
  normalizeHairStyle,
  toDateKey,
} from "../services/calendarRules";
import type {
  CalendarClient,
  CalendarEntry,
  CalendarStatus,
  HairLengthOption,
  HairSizeOption,
  HairStyle,
  HairStyleOption,
} from "../types/calendar";

type ShareNavigator = Navigator & {
  canShare?: (data: {
    files?: File[];
    text?: string;
    title?: string;
  }) => boolean;
  share?: (data: {
    files?: File[];
    text?: string;
    title?: string;
  }) => Promise<void>;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white p-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900";

const hairStyleOptions: { value: HairStyleOption; label: string }[] = [
  { value: "knotless", label: "Knotless" },
  { value: "kinky", label: "Kinky" },
  { value: "boho", label: "Boho" },
  { value: "ghana weaving", label: "Ghana weaving" },
  { value: "jayda wayda", label: "Jayda Wayda" },
];

const hairSizeOptions: { value: HairSizeOption; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "smedium", label: "Smedium" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const hairLengthOptions: { value: HairLengthOption; label: string }[] = [
  { value: "shoulder", label: "Shoulder" },
  { value: "bra", label: "Bra" },
  { value: "waist", label: "Waist" },
];

export function CalendarPage() {
  const {
    calendarEntries,
    fetchCalendarEntries,
    setCalendarEntries,
    getSubAccountId,
  } = useItemContext();
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date())
  );
  const [calendarView, setCalendarView] = useState<CalendarView>("STATUS");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [formError, setFormError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [formData, setFormData] = useState<CalendarFormData>({
    status: "booked",
    clients: [createBlankClient()],
    notes: "",
  });

  useEffect(() => {
    void fetchCalendarEntries();
  }, [fetchCalendarEntries]);

  const entriesByDate = useMemo(() => {
    return calendarEntries.reduce<Map<string, CalendarEntry[]>>(
      (entries, entry) => {
        const currentEntries = entries.get(entry.date) ?? [];
        entries.set(entry.date, [...currentEntries, entry]);
        return entries;
      },
      new Map()
    );
  }, [calendarEntries]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);

    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
    });
  }, [calendarMonth]);

  const monthDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(calendarMonth),
      end: endOfMonth(calendarMonth),
    });
  }, [calendarMonth]);

  const bookedDaysInMonth = monthDays.filter((day) =>
    isBooked(entriesByDate.get(toDateKey(day)) ?? [])
  ).length;
  const availableDaysInMonth = monthDays.filter(
    (day) => getDayStatus(day, entriesByDate.get(toDateKey(day)) ?? []) === "available"
  ).length;

  const selectedDate = parseISO(selectedDateKey);
  const selectedEntries = entriesByDate.get(selectedDateKey) ?? [];
  const selectedClients = getEntryClients(selectedEntries);
  const selectedEntry = getPrimaryEntry(selectedEntries);
  const selectedStatus = getDayStatus(selectedDate, selectedEntries);
  const selectedDateLabel = format(selectedDate, "EEEE, MMM d");

  const selectDay = (day: Date) => {
    setSelectedDateKey(toDateKey(day));
    setCalendarMonth(startOfMonth(day));
  };

  const openEditor = (status: CalendarStatus = "booked") => {
    const clients =
      status === "booked"
        ? selectedClients.length
          ? selectedClients
          : [createBlankClient()]
        : [];

    setFormError("");
    setFormData({
      status,
      clients,
      notes: selectedEntry?.notes ?? "",
    });
    setIsEditorOpen(true);
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const status = event.target.value as CalendarStatus;
    setFormData((current) => ({
      ...current,
      status,
      clients:
        status === "booked"
          ? current.clients.length
            ? current.clients
            : [createBlankClient()]
          : [],
    }));
  };

  const updateClient = (
    index: number,
    fields: Partial<Omit<CalendarClient, "hairStyle">>
  ) => {
    setFormData((current) => ({
      ...current,
      clients: current.clients.map((client, clientIndex) =>
        clientIndex === index ? { ...client, ...fields } : client
      ),
    }));
  };

  const updateClientHairStyle = (
    index: number,
    fields: Partial<HairStyle>
  ) => {
    setFormData((current) => ({
      ...current,
      clients: current.clients.map((client, clientIndex) =>
        clientIndex === index
          ? {
              ...client,
              hairStyle: {
                ...normalizeHairStyle(client.hairStyle),
                ...fields,
              },
            }
          : client
      ),
    }));
  };

  const addClient = () => {
    setFormData((current) => ({
      ...current,
      clients: [...current.clients, createBlankClient()],
    }));
  };

  const removeClient = (index: number) => {
    setFormData((current) => ({
      ...current,
      clients: current.clients.filter((_, clientIndex) => clientIndex !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const clients = buildClients(formData.clients);

    if (formData.status === "booked" && clients.length === 0) {
      setFormError("Add at least one client for a booked date.");
      return;
    }

    if (
      formData.status === "booked" &&
      clients.some((client) => !client.startTime)
    ) {
      setFormError("Each booked client needs a start time.");
      return;
    }

    const body = {
      date: selectedDateKey,
      status: formData.status,
      clients: formData.status === "booked" ? clients : [],
      startTime: "",
      endTime: "",
      notes: formData.notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    setFormError("");

    try {
      const subId = await getSubAccountId();
      if (selectedEntry) {
        await updateCalendarEntry(selectedEntry.id, body, subId);
      } else {
        await createCalendarEntry(body, subId);
      }
      await fetchCalendarEntries();
      setIsEditorOpen(false);
    } catch {
      setFormError("Could not save this date.");
    } finally {
      setIsSaving(false);
    }
  };

  const markSelectedAvailable = async () => {
    const body = {
      date: selectedDateKey,
      status: "available",
      clients: [],
      startTime: "",
      endTime: "",
      notes: "",
      updatedAt: new Date().toISOString(),
    };

    try {
      const subId = await getSubAccountId();

      if (selectedEntry) {
        setCalendarEntries(
          calendarEntries.map((entry) =>
            entry.date === selectedDateKey
              ? {
                  ...entry,
                  status: "available",
                  clients: [],
                  startTime: "",
                  endTime: "",
                  notes: "",
                  updatedAt: body.updatedAt,
                }
              : entry
          )
        );

        await Promise.all(
          selectedEntries.map((entry, index) =>
            index === 0
              ? updateCalendarEntry(entry.id, body, subId)
              : deleteCalendarEntry(entry.id, subId)
          )
        );
      } else {
        await createCalendarEntry(body, subId);
      }

      await fetchCalendarEntries();
    } catch {
      await fetchCalendarEntries();
    }
  };

  const markSelectedUnavailable = async () => {
    const body = {
      date: selectedDateKey,
      status: "unavailable" as const,
      clients: [],
      startTime: "",
      endTime: "",
      notes: "",
      updatedAt: new Date().toISOString(),
    };
    const optimisticEntry: CalendarEntry = {
      ...(selectedEntry ?? {
        id: createClientId(),
        createdAt: body.updatedAt,
      }),
      ...body,
    };

    setCalendarEntries([
      ...calendarEntries.filter((entry) => entry.date !== selectedDateKey),
      optimisticEntry,
    ]);

    try {
      const subId = await getSubAccountId();

      if (selectedEntry) {
        await Promise.all(
          selectedEntries.map((entry, index) =>
            index === 0
              ? updateCalendarEntry(entry.id, body, subId)
            : deleteCalendarEntry(entry.id, subId)
          )
        );
      } else {
        await createCalendarEntry(body, subId);
      }

      await fetchCalendarEntries();
    } catch {
      await fetchCalendarEntries();
    }
  };

  const deleteSelectedEntries = async () => {
    if (!selectedEntries.length) return;

    setCalendarEntries(
      calendarEntries.filter((entry) => entry.date !== selectedDateKey)
    );

    try {
      const subId = await getSubAccountId();
      await Promise.all(
        selectedEntries.map((entry) => deleteCalendarEntry(entry.id, subId))
      );
      await fetchCalendarEntries();
    } catch {
      await fetchCalendarEntries();
    }
  };

  const shareCalendarScreenshot = async () => {
    setIsSharing(true);
    setShareMessage("");

    try {
      const canvas = drawCalendarPng({
        calendarDays,
        calendarMonth,
        calendarView,
        entriesByDate,
      });
      const blob = await canvasToBlob(canvas);
      const fileName = `calendar-${format(calendarMonth, "yyyy-MM")}.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      const shareNavigator = navigator as ShareNavigator;
      const shareData = {
        files: [file],
        text: `Calendar availability for ${format(
          calendarMonth,
          "MMMM yyyy"
        )}`,
        title: "Calendar availability",
      };

      if (shareNavigator.share && shareNavigator.canShare?.(shareData)) {
        await shareNavigator.share(shareData);
        setShareMessage("Screenshot shared.");
      } else {
        downloadBlob(blob, fileName);
        setShareMessage("Screenshot downloaded.");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setShareMessage("Could not create the screenshot.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SwipeShell toLeft="/settings" toRight="/tasks" refresh={fetchCalendarEntries}>
      <HeaderComponent>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold leading-tight">
              <FiCalendar className="h-5 w-5 text-blue-600" />
              Calendar
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {availableDaysInMonth} available, {bookedDaysInMonth} booked
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={shareCalendarScreenshot}
              disabled={isSharing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-60 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
            >
              <FiShare2 className="h-3.5 w-3.5" />
              {isSharing ? "Creating" : "Share"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(startOfMonth(new Date()));
                setSelectedDateKey(toDateKey(new Date()));
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              Today
            </button>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
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

        <div className="grid grid-cols-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {(
            [
              { key: "STATUS", label: "Availability" },
              { key: "DETAILS", label: "Details" },
            ] as { key: CalendarView; label: string }[]
          ).map(({ key, label }) => {
            const active = calendarView === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCalendarView(key)}
                className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </HeaderComponent>

      <main className="mx-auto mt-48 min-h-screen max-w-md px-4 pb-32 dark:text-white">
        {shareMessage && (
          <p className="mx-1 mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
            {shareMessage}
          </p>
        )}

        <section className="mx-1 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-gray-400">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day) => {
              const dayKey = toDateKey(day);
              const entries = entriesByDate.get(dayKey) ?? [];
              const clients = getEntryClients(entries);
              const status = getDayStatus(day, entries);
              const selected = selectedDateKey === dayKey;
              const inMonth = isSameMonth(day, calendarMonth);
              const visibleClients = clients.slice(0, 1);
              const hiddenClientCount = clients.length - visibleClients.length;
              const tone = !inMonth
                ? "border-gray-100 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-600"
                : status === "booked"
                ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                : status === "available"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                : "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400";

              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`flex min-h-[3.9rem] min-w-0 flex-col rounded-md border p-0.5 text-left transition hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-900 ${tone} ${
                    selected
                      ? "ring-2 ring-blue-600 ring-offset-1 ring-offset-white dark:ring-blue-300 dark:ring-offset-gray-950"
                      : ""
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${
                      isToday(day)
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {inMonth && calendarView === "STATUS" && (
                    <span
                      className={`mt-auto truncate text-[9px] font-semibold capitalize ${
                        status === "booked"
                          ? "text-red-700 dark:text-red-100"
                          : status === "available"
                          ? "text-emerald-700 dark:text-emerald-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {status}
                    </span>
                  )}

                  {inMonth && calendarView === "DETAILS" && status === "booked" && (
                    <span className="mt-auto flex min-w-0 flex-col gap-0.5">
                      {visibleClients.map((client) => (
                        <span
                          key={`${dayKey}-${client.id ?? client.name}`}
                          className="block max-w-full truncate rounded bg-white/70 px-0.5 py-px text-[8px] font-semibold leading-3 text-red-700 dark:bg-red-900/40 dark:text-red-100"
                        >
                          {formatCompactClientCell(client)}
                        </span>
                      ))}
                      {hiddenClientCount > 0 && (
                        <span className="text-[8px] font-semibold leading-3 text-red-700 dark:text-red-100">
                          +{hiddenClientCount}
                        </span>
                      )}
                    </span>
                  )}

                  {inMonth && calendarView === "DETAILS" && status !== "booked" && (
                    <span
                      className={`mt-auto truncate text-[9px] font-semibold capitalize ${
                        status === "available"
                          ? "text-emerald-700 dark:text-emerald-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {status}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mx-1 mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-gray-950 dark:text-gray-50">
                {selectedDateLabel}
              </h2>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                {format(selectedDate, "yyyy-MM-dd")}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                selectedStatus === "booked"
                  ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-100"
                  : selectedStatus === "available"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {selectedStatus}
            </span>
          </div>

          {selectedStatus === "booked" ? (
            <div className="space-y-2">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                <FiUsers className="h-4 w-4 text-red-500" />
                Clients
              </div>
              {selectedClients.map((client) => (
                <div
                  key={client.id ?? client.name}
                  className="rounded-lg border border-red-100 bg-red-50 p-2 text-xs dark:border-red-900 dark:bg-red-950/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate font-semibold text-red-800 dark:text-red-100">
                      {client.name}
                    </p>
                    {client.startTime && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-100">
                        <FiClock className="h-3 w-3" />
                        {client.startTime}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium capitalize text-red-700 dark:text-red-100">
                    {formatHairStyle(client.hairStyle)}
                  </p>
                  {client.hairStyle?.additionalDetails && (
                    <p className="mt-1 line-clamp-2 text-xs text-red-700 dark:text-red-100">
                      {client.hairStyle.additionalDetails}
                    </p>
                  )}
                </div>
              ))}

              {selectedEntry?.notes && (
                <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {selectedEntry.notes}
                </p>
              )}
            </div>
          ) : selectedStatus === "available" ? (
            <p className="rounded-lg bg-emerald-50 p-2 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100">
              Available for bookings.
            </p>
          ) : (
            <p className="rounded-lg bg-gray-50 p-2 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              Unavailable by default. Set this date available if you want to take
              clients.
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            {selectedStatus === "unavailable" ? (
              <button
                type="button"
                onClick={markSelectedAvailable}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Set Available
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  openEditor(selectedStatus === "booked" ? "booked" : "available")
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
              >
                <FiEdit2 className="h-4 w-4" />
                Edit
              </button>
            )}

            {selectedStatus === "booked" ? (
              <button
                type="button"
                onClick={markSelectedAvailable}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Mark Available
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openEditor("booked")}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              >
                Book Date
              </button>
            )}
          </div>

          {selectedStatus !== "unavailable" && (
            <button
              type="button"
              onClick={markSelectedUnavailable}
              className="mt-2 w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
            >
              Set Unavailable
            </button>
          )}

          {selectedEntries.length > 0 && (
            <button
              type="button"
              onClick={deleteSelectedEntries}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              <FiTrash2 className="h-4 w-4" />
              Delete Date Details
            </button>
          )}
        </section>

        <div className="fixed bottom-24 inset-x-0 z-50">
          <div className="relative mx-auto flex max-w-md justify-end px-4">
            <button
              type="button"
              aria-label="Add booking"
              onClick={() => openEditor("booked")}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-transform focus:outline-none"
            >
              <FiPlus className="text-2xl" />
            </button>
          </div>
        </div>
      </main>

      <Modal
        open={isEditorOpen}
        onClose={() => {
          if (!isSaving) setIsEditorOpen(false);
        }}
        title={`${selectedDateLabel} Details`}
      >
        <form className="max-h-[76vh] space-y-4 overflow-y-auto pr-1" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-gray-500 dark:text-white">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleStatusChange}
              className={inputClass}
            >
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {formData.status === "booked" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm text-gray-500 dark:text-white">
                  Clients
                </label>
                <button
                  type="button"
                  onClick={addClient}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <FiPlus className="h-3.5 w-3.5" />
                  Client
                </button>
              </div>

              {formData.clients.map((client, index) => (
                <div
                  key={client.id ?? index}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                      Client {index + 1}
                    </p>
                    {formData.clients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeClient(index)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label="Remove client"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500 dark:text-gray-300">
                        Start time
                      </label>
                      <input
                        type="time"
                        value={client.startTime ?? ""}
                        onChange={(event) =>
                          updateClient(index, { startTime: event.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500 dark:text-gray-300">
                        Name
                      </label>
                      <input
                        value={client.name}
                        onChange={(event) =>
                          updateClient(index, { name: event.target.value })
                        }
                        placeholder="Client name"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500 dark:text-gray-300">
                        Style
                      </label>
                      <select
                        value={normalizeHairStyle(client.hairStyle).style}
                        onChange={(event) =>
                          updateClientHairStyle(index, {
                            style: event.target.value as HairStyleOption,
                          })
                        }
                        className={inputClass}
                      >
                        {hairStyleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500 dark:text-gray-300">
                        Size
                      </label>
                      <select
                        value={normalizeHairStyle(client.hairStyle).size}
                        onChange={(event) =>
                          updateClientHairStyle(index, {
                            size: event.target.value as HairSizeOption,
                          })
                        }
                        className={inputClass}
                      >
                        {hairSizeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500 dark:text-gray-300">
                        Length
                      </label>
                      <select
                        value={normalizeHairStyle(client.hairStyle).length}
                        onChange={(event) =>
                          updateClientHairStyle(index, {
                            length: event.target.value as HairLengthOption,
                          })
                        }
                        className={inputClass}
                      >
                        {hairLengthOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-300">
                      Additional details
                    </label>
                    <textarea
                      value={
                        normalizeHairStyle(client.hairStyle).additionalDetails ??
                        ""
                      }
                      onChange={(event) =>
                        updateClientHairStyle(index, {
                          additionalDetails: event.target.value,
                        })
                      }
                      rows={2}
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-gray-500 dark:text-white">
              Date notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={3}
              className={inputClass}
            />
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-100">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              disabled={isSaving}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <FooterNav />
    </SwipeShell>
  );
}
