import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  type ActionPerformed,
  type LocalNotificationSchema,
} from "@capacitor/local-notifications";
import type { Task } from "../types/tasks";

export const TASK_REMINDER_EVENT = "task-reminders-changed";

const REMINDERS_ENABLED_KEY = "task-reminders-enabled";
const NOTIFIED_REMINDERS_KEY = "task-reminders-notified";
const DISMISSED_REMINDERS_KEY = "task-reminders-dismissed";
const NATIVE_REMINDER_IDS_KEY = "task-reminders-native-ids";
const NATIVE_SNOOZE_IDS_KEY = "task-reminders-native-snooze-ids";
const NATIVE_REMINDER_CHANNEL_ID = "task-reminders";
const NATIVE_REMINDER_ACTION_TYPE = "TASK_REMINDER_ACTIONS";
const TAP_ACTION = "tap";
const SNOOZE_ACTION_PREFIX = "snooze-";
const DISMISS_ACTION = "dismiss";
const DEFAULT_REMINDER_OFFSET_MINUTES = 10;
const NOTIFICATION_WINDOW_MS = 60 * 1000;
const MAX_NOTIFIED_KEYS = 200;
const MAX_DISMISSED_KEYS = 200;
const MIN_LATE_REMINDER_LEAD_MS = 60 * 1000;
export const TASK_REMINDER_OFFSET_OPTIONS = [
  { label: "1 minute before", value: 1 },
  { label: "5 minutes before", value: 5 },
  { label: "10 minutes before", value: 10 },
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "1 day before", value: 1440 },
] as const;

export type TaskNotificationStatus =
  | "unsupported"
  | NotificationPermission
  | "prompt"
  | "prompt-with-rationale"
  | "disabled";

function emitReminderChange() {
  window.dispatchEvent(new Event(TASK_REMINDER_EVENT));
}

export function isNativeTaskReminderPlatform() {
  return Capacitor.isNativePlatform();
}

export function isTaskReminderEnabled() {
  return localStorage.getItem(REMINDERS_ENABLED_KEY) === "true";
}

export function setTaskReminderEnabled(enabled: boolean) {
  localStorage.setItem(REMINDERS_ENABLED_KEY, String(enabled));
  emitReminderChange();
}

function isValidReminderOffset(minutes: number) {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440;
}

export function getTaskReminderOffsetMinutes(
  task?: Pick<Task, "reminderOffsetMinutes">
) {
  const taskOffset = Number(task?.reminderOffsetMinutes);
  if (isValidReminderOffset(taskOffset)) return taskOffset;

  return DEFAULT_REMINDER_OFFSET_MINUTES;
}

export function getTaskReminderOffsetMs(
  task?: Pick<Task, "reminderOffsetMinutes">
) {
  return getTaskReminderOffsetMinutes(task) * 60 * 1000;
}

export function getTaskNotificationStatus(): TaskNotificationStatus {
  if (isNativeTaskReminderPlatform()) {
    return isTaskReminderEnabled() ? "granted" : "disabled";
  }

  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (!isTaskReminderEnabled()) return "disabled";
  return Notification.permission;
}

export async function getTaskNotificationStatusAsync() {
  if (isNativeTaskReminderPlatform()) {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display === "denied") return "denied" as const;
    if (!isTaskReminderEnabled()) return "disabled" as const;

    return permission.display;
  }

  return getTaskNotificationStatus();
}

export async function requestTaskReminderPermission() {
  if (isNativeTaskReminderPlatform()) {
    const permission = await LocalNotifications.requestPermissions();
    setTaskReminderEnabled(permission.display === "granted");
    return permission.display;
  }

  if (!("Notification" in window)) return "unsupported" as const;

  const permission = await Notification.requestPermission();
  setTaskReminderEnabled(permission === "granted");
  return permission;
}

export function parseTaskDueAt(task: Pick<Task, "dueDate" | "dueTime">) {
  if (!task.dueDate || !task.dueTime) return undefined;

  const [year, month, day] = task.dueDate.split("-").map(Number);
  const [hours, minutes] = task.dueTime.split(":").map(Number);
  if (
    [year, month, day, hours, minutes].some((value) => Number.isNaN(value))
  ) {
    return undefined;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function hasSchedulableTaskReminder(tasks: Task[]) {
  const now = Date.now();
  return tasks.some((task) => {
    if (task.completed) return false;
    const dueAt = parseTaskDueAt(task);
    return dueAt ? dueAt.getTime() > now : false;
  });
}

function getNotifiedKeys() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(NOTIFIED_REMINDERS_KEY) ?? "[]"
    );
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function saveNotifiedKey(key: string) {
  const keys = [...getNotifiedKeys(), key].slice(-MAX_NOTIFIED_KEYS);
  localStorage.setItem(NOTIFIED_REMINDERS_KEY, JSON.stringify(keys));
}

function getDismissedKeys() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(DISMISSED_REMINDERS_KEY) ?? "[]"
    );
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function saveDismissedKey(key: string) {
  const keys = [...getDismissedKeys(), key].slice(-MAX_DISMISSED_KEYS);
  localStorage.setItem(DISMISSED_REMINDERS_KEY, JSON.stringify(keys));
  emitReminderChange();
}

function getReminderKey(task: Task) {
  return `${task.id}:${task.dueDate ?? ""}:${task.dueTime ?? ""}:${
    task.updatedAt ?? ""
  }`;
}

function getNativeNotificationId(task: Task) {
  const key = getReminderKey(task);
  return getNativeIdFromKey(key);
}

function getNativeIdFromKey(key: string) {
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) | 0;
  }

  return Math.max(1, Math.abs(hash % 2147483647));
}

function getNativeIds(storageKey: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => Number.isInteger(id))
      : [];
  } catch {
    return [];
  }
}

function saveNativeIds(storageKey: string, ids: number[]) {
  localStorage.setItem(storageKey, JSON.stringify(ids));
}

function getNativeReminderIds() {
  return getNativeIds(NATIVE_REMINDER_IDS_KEY);
}

function saveNativeReminderIds(ids: number[]) {
  saveNativeIds(NATIVE_REMINDER_IDS_KEY, ids);
}

function getNativeSnoozeIds() {
  return getNativeIds(NATIVE_SNOOZE_IDS_KEY);
}

function saveNativeSnoozeIds(ids: number[]) {
  saveNativeIds(NATIVE_SNOOZE_IDS_KEY, ids);
}

function formatDueLabel(dueAt: Date) {
  const dateLabel = dueAt.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = dueAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${dateLabel} at ${timeLabel}`;
}

function getTaskTags(task: Task) {
  return Array.from(
    new Set([...(task.tags ?? []), task.group].filter(Boolean) as string[])
  );
}

function formatPriority(task: Task) {
  const priority = task.priority ?? "medium";
  return `${priority.charAt(0).toUpperCase()}${priority.slice(1)} priority`;
}

function getSubtaskSummary(task: Task) {
  const subtasks = task.subtasks ?? [];
  if (!subtasks.length) return "";

  const completed = subtasks.filter((subtask) => subtask.completed).length;
  return `${completed}/${subtasks.length} subtasks done`;
}

function getNotificationContent(task: Task, dueAt: Date) {
  const tags = getTaskTags(task);
  const subtaskSummary = getSubtaskSummary(task);
  const detailLines = [
    `Reminder ${getLeadTimeLabel(task)} before due`,
    `Due ${formatDueLabel(dueAt)}`,
    formatPriority(task),
    tags.length ? `Tags: ${tags.join(", ")}` : "",
    subtaskSummary,
    task.description ? `Note: ${task.description}` : "",
  ].filter(Boolean);

  return {
    title: `Task reminder: ${task.title}`,
    body: detailLines.slice(0, 3).join(" • "),
    largeBody: [`${task.title}`, ...detailLines].join("\n"),
    summaryText: detailLines.slice(0, 2).join(" • "),
    inboxList: detailLines.slice(0, 5),
  };
}

function getLeadTimeLabel(task: Task) {
  const minutes = getTaskReminderOffsetMinutes(task);
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes === 60) return "1 hour";
  if (minutes < 1440) return `${minutes / 60} hours`;
  return "1 day";
}

function getNotificationTitle(task: Task) {
  return `Task reminder: ${task.title}`;
}

function getNotificationExtra(task: Task, dueAt: Date) {
  const content = getNotificationContent(task, dueAt);
  const reminderOffsetMinutes = getTaskReminderOffsetMinutes(task);

  return {
    taskId: task.id,
    reminderKey: getReminderKey(task),
    taskTitle: task.title,
    dueAt: dueAt.toISOString(),
    reminderOffsetMinutes,
    title: content.title,
    body: content.body,
    largeBody: content.largeBody,
    summaryText: content.summaryText,
    inboxList: content.inboxList,
  };
}

async function ensureNativeReminderChannel() {
  if (Capacitor.getPlatform() !== "android") return;

  await LocalNotifications.createChannel({
    id: NATIVE_REMINDER_CHANNEL_ID,
    name: "Task reminders",
    description: "Reminders before tasks are due",
    importance: 4,
    visibility: 1,
  });
}

const registeredNativeActionTypes = new Set<string>();

function getSnoozeOptions(reminderOffsetMinutes: number) {
  if (reminderOffsetMinutes <= 1) return [];
  if (reminderOffsetMinutes <= 5) return [1];
  if (reminderOffsetMinutes <= 10) return [5];
  if (reminderOffsetMinutes <= 30) return [10, 5];
  if (reminderOffsetMinutes <= 60) return [30, 10];
  if (reminderOffsetMinutes <= 120) return [60, 30];
  return [120, 60];
}

function formatSnoozeActionTitle(minutes: number) {
  if (minutes < 60) return `Snooze ${minutes}m`;
  return `Snooze ${minutes / 60}h`;
}

function getNativeReminderActionTypeId(reminderOffsetMinutes: number) {
  return `${NATIVE_REMINDER_ACTION_TYPE}_${reminderOffsetMinutes}`;
}

async function ensureNativeReminderActions(reminderOffsetMinutes?: number) {
  if (!isNativeTaskReminderPlatform()) return;

  const offsets =
    reminderOffsetMinutes === undefined
      ? TASK_REMINDER_OFFSET_OPTIONS.map((option) => option.value)
      : [reminderOffsetMinutes];

  const types = offsets
    .filter((offset) => !registeredNativeActionTypes.has(getNativeReminderActionTypeId(offset)))
    .map((offset) => ({
      id: getNativeReminderActionTypeId(offset),
      iosCustomDismissAction: true,
      actions: [
        ...getSnoozeOptions(offset).map((minutes) => ({
          id: `${SNOOZE_ACTION_PREFIX}${minutes}`,
          title: formatSnoozeActionTitle(minutes),
        })),
        { id: DISMISS_ACTION, title: "Dismiss", destructive: true },
      ],
    }));

  if (!types.length) return;

  await LocalNotifications.registerActionTypes({ types });
  types.forEach((type) => registeredNativeActionTypes.add(type.id));
}

async function cancelNativeTaskReminders() {
  const ids = getNativeReminderIds();
  if (!ids.length) return;

  await LocalNotifications.cancel({
    notifications: ids.map((id) => ({ id })),
  });
  saveNativeReminderIds([]);
}

function showTaskNotification(task: Task, dueAt: Date) {
  const content = getNotificationContent(task, dueAt);

  const notification = new Notification(content.title, {
    body: content.largeBody,
    tag: `task-reminder-${task.id}`,
    requireInteraction: task.priority === "high",
  });
  notification.onclose = () => saveDismissedKey(getReminderKey(task));
}

export function checkTaskReminders(tasks: Task[]) {
  if (!("Notification" in window)) return;
  if (!isTaskReminderEnabled() || Notification.permission !== "granted") return;

  const now = Date.now();
  const notifiedKeys = new Set(getNotifiedKeys());

  tasks.forEach((task) => {
    if (task.completed) return;

    const dueAt = parseTaskDueAt(task);
    if (!dueAt) return;

    const reminderOffsetMs = getTaskReminderOffsetMs(task);
    const reminderAt = dueAt.getTime() - reminderOffsetMs;
    const dueTime = dueAt.getTime();
    const remainingMs = dueTime - now;
    const isInReminderWindow =
      now >= reminderAt &&
      remainingMs >= MIN_LATE_REMINDER_LEAD_MS &&
      now - reminderAt <= reminderOffsetMs + NOTIFICATION_WINDOW_MS;
    if (!isInReminderWindow) return;

    const reminderKey = getReminderKey(task);
    if (getDismissedKeys().includes(reminderKey)) return;
    if (notifiedKeys.has(reminderKey)) return;

    showTaskNotification(task, dueAt);
    saveNotifiedKey(reminderKey);
  });
}

async function scheduleNativeNotification(notification: LocalNotificationSchema) {
  await ensureNativeReminderChannel();
  await ensureNativeReminderActions(
    Number(notification.extra?.reminderOffsetMinutes) ||
      DEFAULT_REMINDER_OFFSET_MINUTES
  );
  await LocalNotifications.schedule({ notifications: [notification] });
}

async function scheduleSnooze(action: ActionPerformed, minutes: number) {
  const extra = action.notification.extra ?? {};
  const reminderKey = String(extra.reminderKey ?? "");
  if (!reminderKey) return;

  saveNotifiedKey(reminderKey);

  const title = String(extra.title ?? action.notification.title);
  const body = String(extra.body ?? action.notification.body);
  const largeBody = String(extra.largeBody ?? body);
  const summaryText = String(extra.summaryText ?? body);
  const inboxList = Array.isArray(extra.inboxList)
    ? (extra.inboxList as string[])
    : undefined;
  const dueAtMs = Date.parse(String(extra.dueAt ?? ""));
  const requestedAtMs = Date.now() + minutes * 60 * 1000;
  const scheduleAtMs = Number.isNaN(dueAtMs)
    ? requestedAtMs
    : Math.min(requestedAtMs, dueAtMs - MIN_LATE_REMINDER_LEAD_MS);
  if (scheduleAtMs <= Date.now()) return;

  const reminderOffsetMinutes =
    Number(extra.reminderOffsetMinutes) || DEFAULT_REMINDER_OFFSET_MINUTES;
  const id = getNativeIdFromKey(`${reminderKey}:snooze:${Date.now()}`);

  await scheduleNativeNotification({
    id,
    title: `${title} (snoozed)`,
    body,
    largeBody,
    summaryText,
    inboxList,
    schedule: {
      at: new Date(scheduleAtMs),
      allowWhileIdle: true,
    },
    autoCancel: true,
    actionTypeId: getNativeReminderActionTypeId(reminderOffsetMinutes),
    channelId: NATIVE_REMINDER_CHANNEL_ID,
    group: "task-reminders",
    threadIdentifier: "task-reminders",
    extra,
  });

  saveNativeSnoozeIds([...getNativeSnoozeIds(), id].slice(-MAX_NOTIFIED_KEYS));
}

async function handleNativeNotificationAction(
  action: ActionPerformed,
  onOpenTask?: (taskId?: string) => void
) {
  const reminderKey = String(action.notification.extra?.reminderKey ?? "");
  const taskId = String(action.notification.extra?.taskId ?? "");

  if (action.actionId === TAP_ACTION) {
    onOpenTask?.(taskId || undefined);
    return;
  }

  if (action.actionId === DISMISS_ACTION) {
    if (reminderKey) {
      saveNotifiedKey(reminderKey);
      saveDismissedKey(reminderKey);
    }
    return;
  }

  if (action.actionId.startsWith(SNOOZE_ACTION_PREFIX)) {
    const minutes = Number(action.actionId.replace(SNOOZE_ACTION_PREFIX, ""));
    if (Number.isInteger(minutes) && minutes > 0) {
      await scheduleSnooze(action, minutes);
    }
  }
}

export async function registerTaskNotificationHandlers(
  onOpenTask?: (taskId?: string) => void
) {
  if (!isNativeTaskReminderPlatform()) return undefined;

  await ensureNativeReminderActions();
  const actionListener = await LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (action) => void handleNativeNotificationAction(action, onOpenTask)
  );

  return () => {
    void actionListener.remove();
  };
}

export async function syncTaskReminders(tasks: Task[]) {
  if (!isNativeTaskReminderPlatform()) {
    checkTaskReminders(tasks);
    return;
  }

  if (!isTaskReminderEnabled()) {
    await cancelNativeTaskReminders();
    return;
  }

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") {
    await cancelNativeTaskReminders();
    return;
  }

  const now = Date.now();
  const notifiedKeys = new Set(getNotifiedKeys());
  const dismissedKeys = new Set(getDismissedKeys());
  const notifications = tasks
    .filter((task) => !task.completed)
    .map((task) => {
      const dueAt = parseTaskDueAt(task);
      if (!dueAt) return undefined;

      const dueTime = dueAt.getTime();
      const remainingMs = dueTime - now;
      if (remainingMs < MIN_LATE_REMINDER_LEAD_MS) return undefined;

      const reminderKey = getReminderKey(task);
      if (dismissedKeys.has(reminderKey)) return undefined;

      const reminderOffsetMs = getTaskReminderOffsetMs(task);
      const reminderOffsetMinutes = getTaskReminderOffsetMinutes(task);
      const reminderTime = dueTime - reminderOffsetMs;
      const shouldRemindNow = reminderTime <= now;
      if (shouldRemindNow && notifiedKeys.has(reminderKey)) return undefined;

      const content = getNotificationContent(task, dueAt);

      return {
        id: getNativeNotificationId(task),
        title: getNotificationTitle(task),
        body: content.body,
        largeBody: content.largeBody,
        summaryText: content.summaryText,
        inboxList: content.inboxList,
        actionTypeId: getNativeReminderActionTypeId(reminderOffsetMinutes),
        ...(shouldRemindNow
          ? {}
          : {
              schedule: {
                at: new Date(reminderTime),
                allowWhileIdle: true,
              },
            }),
        autoCancel: true,
        channelId: NATIVE_REMINDER_CHANNEL_ID,
        group: "task-reminders",
        threadIdentifier: "task-reminders",
        extra: getNotificationExtra(task, dueAt),
      };
    })
    .filter((notification) => notification !== undefined);

  await cancelNativeTaskReminders();

  if (!notifications.length) return;

  await ensureNativeReminderChannel();
  await Promise.all(
    Array.from(
      new Set(
        notifications.map(
          (notification) =>
            Number(notification.extra?.reminderOffsetMinutes) ||
            DEFAULT_REMINDER_OFFSET_MINUTES
        )
      )
    ).map((offset) => ensureNativeReminderActions(offset))
  );
  const result = await LocalNotifications.schedule({ notifications });
  const immediateReminderKeys = notifications
    .filter((notification) => !notification.schedule)
    .map((notification) => String(notification.extra?.reminderKey ?? ""))
    .filter(Boolean);
  immediateReminderKeys.forEach(saveNotifiedKey);

  const scheduledNotificationIds = notifications
    .filter((notification) => Boolean(notification.schedule))
    .map((notification) => notification.id);
  saveNativeReminderIds(
    result.notifications
      .map((notification) => notification.id)
      .filter((id) => scheduledNotificationIds.includes(id))
  );
}
