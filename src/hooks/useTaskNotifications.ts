import { useEffect, useRef } from "react";
import type { Task } from "../types/tasks";
import {
  isNativeTaskReminderPlatform,
  registerTaskNotificationHandlers,
  syncTaskReminders,
  TASK_REMINDER_EVENT,
} from "../services/taskNotifications";

const CHECK_INTERVAL_MS = 30 * 1000;

export function useTaskNotifications(
  tasks: Task[],
  onOpenTask?: (taskId?: string) => void
) {
  const tasksRef = useRef(tasks);

  useEffect(() => {
    tasksRef.current = tasks;
    void syncTaskReminders(tasks).catch((error) => {
      console.warn("Failed to sync task reminders", error);
    });
  }, [tasks]);

  useEffect(() => {
    let cleanupNotificationHandlers: (() => void) | undefined;
    let disposed = false;
    void registerTaskNotificationHandlers(onOpenTask).then((cleanup) => {
      if (disposed) {
        cleanup?.();
        return;
      }
      cleanupNotificationHandlers = cleanup;
    });

    const check = () =>
      void syncTaskReminders(tasksRef.current).catch((error) => {
        console.warn("Failed to sync task reminders", error);
      });

    check();
    const intervalId = isNativeTaskReminderPlatform()
      ? undefined
      : window.setInterval(check, CHECK_INTERVAL_MS);
    window.addEventListener(TASK_REMINDER_EVENT, check);
    document.addEventListener("visibilitychange", check);

    return () => {
      disposed = true;
      if (intervalId) window.clearInterval(intervalId);
      cleanupNotificationHandlers?.();
      window.removeEventListener(TASK_REMINDER_EVENT, check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [onOpenTask]);
}
