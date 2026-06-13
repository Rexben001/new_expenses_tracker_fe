export type TaskPriority = "low" | "medium" | "high";

export type SubTask = {
  id: string;
  title: string;
  completed?: boolean;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  group?: string;
  tags?: string[];
  subtasks?: SubTask[];
  dueDate?: string;
  dueTime?: string;
  reminderOffsetMinutes?: number;
  completed?: boolean;
  priority?: TaskPriority;
  updatedAt: string;
  createdAt?: string;
};
