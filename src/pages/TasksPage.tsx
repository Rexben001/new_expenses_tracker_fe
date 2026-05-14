import { Link, useLocation } from "react-router-dom";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfMonth,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiCheckCircle,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCircle,
  FiFilter,
  FiList,
  FiMic,
  FiPlus,
  FiSearch,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";
import SwipeShell from "../components/SwipeShell";
import { useItemContext } from "../hooks/useItemContext";
import { useTaskSearch } from "../hooks/useTasksSearch";
import { createTask, deleteTask, updateTask } from "../services/api";
import type { Task, TaskPriority } from "../types/tasks";
import { AddNewItem } from "../components/NoItem";
import { TaskBox } from "../components/TaskBox";

type TabKey = "OPEN" | "DONE" | "ALL";
type GroupMode = "DAY" | "TAG";
type ViewMode = "LIST" | "CALENDAR";
type PriorityFilter = "ALL" | TaskPriority;
type TaskSection = {
  key: string;
  label: string;
  sortValue: number;
  tasks: Task[];
};

const priorityRank: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const priorityFilters: Array<{ key: PriorityFilter; label: string }> = [
  { key: "ALL", label: "All priorities" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

function uniqueValues(values: (string | undefined)[]) {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b));
}

function getTaskTags(task: Task) {
  return Array.from(
    new Set([...(task.tags ?? []), task.group].filter(Boolean) as string[])
  );
}

function getDueDate(task: Task) {
  if (!task.dueDate) return undefined;
  const date = parseISO(task.dueDate);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

function getDaySection(task: Task) {
  const dueDate = getDueDate(task);

  if (!dueDate) {
    return {
      key: "no-due-date",
      label: "No due date",
      sortValue: Number.MAX_SAFE_INTEGER,
    };
  }

  const day = startOfDay(dueDate);

  return {
    key: format(day, "yyyy-MM-dd"),
    label: formatDayLabel(day),
    sortValue: day.getTime(),
  };
}

function getDayKey(task: Task) {
  const dueDate = getDueDate(task);
  return dueDate ? format(startOfDay(dueDate), "yyyy-MM-dd") : "";
}

function getTagSection(task: Task) {
  const primaryTag = getTaskTags(task)[0] ?? "Untagged";

  return {
    key: primaryTag,
    label: primaryTag,
    sortValue: primaryTag === "Untagged" ? Number.MAX_SAFE_INTEGER : 0,
  };
}

function groupTasks(tasks: Task[], groupMode: GroupMode): TaskSection[] {
  const sections = new Map<string, TaskSection>();
  const sortedTasks = [...tasks].sort((a, b) => {
    const aDate = getDaySection(a).sortValue;
    const bDate = getDaySection(b).sortValue;
    const aPriority = priorityRank[a.priority ?? "medium"];
    const bPriority = priorityRank[b.priority ?? "medium"];

    if (groupMode === "DAY" && aDate !== bDate) return aDate - bDate;
    if (aPriority !== bPriority) return aPriority - bPriority;
    if (groupMode !== "DAY" && aDate !== bDate) return aDate - bDate;
    if (Boolean(a.completed) !== Boolean(b.completed)) {
      return Number(Boolean(a.completed)) - Number(Boolean(b.completed));
    }
    return a.title.localeCompare(b.title);
  });

  sortedTasks.forEach((task) => {
    const section =
      groupMode === "DAY" ? getDaySection(task) : getTagSection(task);
    const existing = sections.get(section.key);

    if (existing) {
      existing.tasks.push(task);
    } else {
      sections.set(section.key, { ...section, tasks: [task] });
    }
  });

  return Array.from(sections.values()).sort((a, b) => {
    if (groupMode === "DAY") return a.sortValue - b.sortValue;
    if (a.sortValue !== b.sortValue) return a.sortValue - b.sortValue;
    return a.label.localeCompare(b.label);
  });
}

export function TasksPage() {
  const location = useLocation();
  const auth = useAuth();
  const { tasks, setTasks, fetchTasks, getSubAccountId } = useItemContext();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("OPEN");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedPriority, setSelectedPriority] =
    useState<PriorityFilter>("ALL");
  const [groupMode, setGroupMode] = useState<GroupMode>("DAY");
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [openMenu, setOpenMenu] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.state?.refresh) fetchTasks();
  }, [fetchTasks, location.state]);

  useEffect(() => {
    window.history.replaceState({}, document.title);
  }, []);

  const searchedTasks = useTaskSearch(query, tasks);

  const tags = useMemo(
    () => uniqueValues(tasks.flatMap(getTaskTags)),
    [tasks]
  );

  const baseFilteredTasks = searchedTasks.filter((task) => {
    const matchesTab =
      tab === "ALL" ? true : tab === "DONE" ? task.completed : !task.completed;
    const matchesTag = selectedTag
      ? getTaskTags(task).includes(selectedTag)
      : true;
    const matchesPriority =
      selectedPriority === "ALL"
        ? true
        : (task.priority ?? "medium") === selectedPriority;
    return matchesTab && matchesTag && matchesPriority;
  });

  const filteredTasks = selectedDayKey
    ? baseFilteredTasks.filter((task) => getDayKey(task) === selectedDayKey)
    : baseFilteredTasks;

  const taskSections = groupTasks(filteredTasks, groupMode);

  const selectedDayLabel = selectedDayKey
    ? formatDayLabel(parseISO(selectedDayKey))
    : "";

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(endOfMonth(monthStart)),
    });
  }, [calendarMonth]);

  const taskCountByDay = useMemo(() => {
    return baseFilteredTasks.reduce<Map<string, number>>((counts, task) => {
      const dayKey = getDayKey(task);
      if (!dayKey) return counts;
      counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);
      return counts;
    }, new Map());
  }, [baseFilteredTasks]);

  const counts: Record<TabKey, number> = {
    OPEN: searchedTasks.filter((task) => !task.completed).length,
    DONE: searchedTasks.filter((task) => task.completed).length,
    ALL: searchedTasks.length,
  };
  const highPriorityCount = searchedTasks.filter(
    (task) => !task.completed && (task.priority ?? "medium") === "high"
  ).length;

  const selectCalendarDay = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    setSelectedDayKey(dayKey);
    setCalendarMonth(startOfMonth(day));
    setGroupMode("DAY");

    window.setTimeout(() => {
      listRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const removeTask = async (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));

    try {
      const subId = await getSubAccountId();
      await deleteTask(id, subId);
      await fetchTasks();
    } catch {
      await fetchTasks();
    }
  };

  const updateCompletion = async (id: string, completed: boolean) => {
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, completed } : task))
    );

    try {
      const subId = await getSubAccountId();
      await updateTask(
        id,
        {
          completed,
          updatedAt: new Date().toISOString(),
        },
        subId
      );
      await fetchTasks();
    } catch {
      await fetchTasks();
    }
  };

  const updateSubtask = async (
    task: Task,
    subtaskId: string,
    completed: boolean
  ) => {
    const subtasks = (task.subtasks ?? []).map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, completed } : subtask
    );

    setTasks(
      tasks.map((currentTask) =>
        currentTask.id === task.id ? { ...currentTask, subtasks } : currentTask
      )
    );

    try {
      const subId = await getSubAccountId();
      await updateTask(
        task.id,
        {
          subtasks,
          updatedAt: new Date().toISOString(),
        },
        subId
      );
      await fetchTasks();
    } catch {
      await fetchTasks();
    }
  };

  const duplicateTask = async (task: Task) => {
    const subId = await getSubAccountId();
    const tags = getTaskTags(task);

    await createTask(
      {
        title: task.title,
        ...(task.description ? { description: task.description } : {}),
        tags,
        dueDate: task.dueDate,
        priority: task.priority ?? "medium",
        completed: Boolean(task.completed),
        subtasks: (task.subtasks ?? []).map((subtask) => ({
          ...subtask,
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        })),
        updatedAt: new Date().toISOString(),
      },
      subId
    );
    await fetchTasks();
  };

  if (!auth?.ready) return null;

  return (
    <SwipeShell toLeft="/settings" toRight="/budgets" refresh={fetchTasks}>
      <HeaderComponent>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold leading-tight">
              Tasks{" "}
              <span className="text-blue-500">({filteredTasks.length})</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {counts.OPEN} open, {counts.DONE} done
              {highPriorityCount > 0 ? `, ${highPriorityCount} high` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(query ||
              selectedTag ||
              selectedDayKey ||
              selectedPriority !== "ALL") && (
              <button
                type="button"
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 shadow-sm transition hover:text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                onClick={() => {
                  setSelectedTag("");
                  setQuery("");
                  setSelectedDayKey("");
                  setSelectedPriority("ALL");
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              aria-label="Toggle task filters"
              className={`rounded-full border p-2 shadow-sm transition ${
                filtersOpen
                  ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-gray-200 bg-white text-gray-500 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              }`}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <FiFilter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-3 rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {(
            [
              { key: "OPEN", label: "Open", icon: FiCircle },
              { key: "DONE", label: "Done", icon: FiCheckCircle },
              { key: "ALL", label: "All", icon: FiFilter },
            ] as const
          ).map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-2 py-2 text-sm transition ${
                  active
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                <span className={active ? "text-white" : "text-blue-500"}>
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {filtersOpen && (
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search tasks by title or tag"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="block w-full overflow-hidden rounded-xl border border-gray-200 bg-white px-9 py-2.5 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        )}

        {filtersOpen && tags.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedTag("")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                selectedTag
                  ? "bg-white text-gray-600 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700"
                  : "bg-blue-600 text-white"
              }`}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  selectedTag === tag
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {filtersOpen && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {priorityFilters.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPriority(key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  selectedPriority === key
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <span className="pl-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              View
            </span>
            <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              {(
                [
                  { key: "LIST", label: "List", icon: FiList },
                  { key: "CALENDAR", label: "Calendar", icon: FiCalendar },
                ] as const
              ).map(({ key, label, icon: Icon }) => {
                const active = viewMode === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setViewMode(key);
                      if (key === "CALENDAR" && !selectedDayKey) {
                        setSelectedDayKey(format(new Date(), "yyyy-MM-dd"));
                      }
                    }}
                    className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-white text-blue-600 shadow-sm dark:bg-gray-950 dark:text-blue-300"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <span className="pl-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              Group by
            </span>
            <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              {(
                [
                  { key: "DAY", label: "Day" },
                  { key: "TAG", label: "Tag" },
                ] as const
              ).map(({ key, label }) => {
                const active = groupMode === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGroupMode(key)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-white text-blue-600 shadow-sm dark:bg-gray-950 dark:text-blue-300"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </HeaderComponent>

      <div
        className={`relative mx-auto min-h-screen max-w-md px-4 pt-4 dark:text-white ${
          filtersOpen ? (tags.length > 0 ? "mt-[23rem]" : "mt-80") : "mt-52"
        }`}
      >
        {viewMode === "CALENDAR" && (
          <section className="mx-1 mb-3 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setCalendarMonth((month) => addMonths(month, -1))}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-semibold text-gray-950 dark:text-gray-50">
                {format(calendarMonth, "MMMM yyyy")}
              </h2>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setCalendarMonth((month) => addMonths(month, 1))}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-gray-400">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const count = taskCountByDay.get(dayKey) ?? 0;
                const selected = selectedDayKey === dayKey;
                const inMonth = isSameMonth(day, calendarMonth);

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => selectCalendarDay(day)}
                    className={`flex min-h-9 flex-col items-center justify-center rounded-md border text-[11px] transition ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : `border-transparent hover:border-blue-200 hover:bg-blue-50 dark:hover:border-blue-900 dark:hover:bg-blue-950/30 ${
                            inMonth
                              ? "text-gray-800 dark:text-gray-100"
                              : "text-gray-300 dark:text-gray-600"
                          }`
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        isToday(day) && !selected
                          ? "bg-blue-50 font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
                          : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {count > 0 && (
                      <span
                        className={`mt-px rounded-full px-1 text-[9px] font-semibold leading-3 ${
                          selected
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div ref={listRef} />

        {selectedDayKey && (
          <div className="mx-1 mb-3 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
            <span className="font-medium">{selectedDayLabel}</span>
            <button
              type="button"
              onClick={() => setSelectedDayKey("")}
              className="text-xs font-semibold"
            >
              Clear day
            </button>
          </div>
        )}

        {taskSections.length ? (
          taskSections.map((section) => (
            <section key={section.key} className="mx-1 mb-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="flex min-w-0 items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <FiChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">{section.label}</span>
                </h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                  {section.tasks.length}
                </span>
              </div>
              {section.tasks.map((task) => (
                <TaskBox
                  key={task.id}
                  task={task}
                  removeTask={removeTask}
                  updateCompletion={updateCompletion}
                  updateSubtask={updateSubtask}
                  duplicateTask={duplicateTask}
                />
              ))}
            </section>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            <AddNewItem
              url="/tasks/new"
              type="task"
              text="You don't have any tasks here"
            />
          </div>
        )}

        <div className="fixed bottom-24 inset-x-0 z-50">
          <div className="relative mx-auto flex max-w-md justify-end px-4">
            {openMenu && (
              <div className="absolute bottom-16 right-5 flex flex-col items-end space-y-3">
                <Link
                  to="/tasks/new?voice=1"
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-lg hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                  onClick={() => setOpenMenu(false)}
                >
                  <FiMic />
                  <span>Add by Voice</span>
                </Link>
                <Link
                  to="/tasks/new"
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-lg hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                  onClick={() => setOpenMenu(false)}
                >
                  <FiPlus />
                  <span>Add Manually</span>
                </Link>
              </div>
            )}
            <button
              type="button"
              aria-label="Add a task"
              onClick={() => setOpenMenu((open) => !open)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-transform focus:outline-none"
            >
              <FiPlus
                className={`text-2xl transition-transform ${
                  openMenu ? "rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      <FooterNav />
    </SwipeShell>
  );
}
