import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useItemContext } from "../hooks/useItemContext";
import { useTaskNotifications } from "../hooks/useTaskNotifications";

export function TaskNotificationLayer() {
  const { tasks } = useItemContext();
  const navigate = useNavigate();
  const openTaskScreen = useCallback(
    (taskId?: string) => {
      navigate("/tasks", {
        state: {
          refresh: true,
          notificationTaskId: taskId,
        },
      });
    },
    [navigate]
  );

  useTaskNotifications(tasks, openTaskScreen);
  return null;
}
