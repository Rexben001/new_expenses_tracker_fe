import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import type { Task } from "../types/tasks";
import { TaskBox } from "./TaskBox";

const task: Task = {
  assignedTo: "Ada",
  completed: false,
  createdAt: "2026-06-11T09:00:00.000Z",
  description: "Get everything ready before the appointment.",
  dueDate: "2026-06-12",
  dueTime: "10:00",
  id: "task-1",
  priority: "high",
  reminderOffsetMinutes: 10,
  subtasks: [],
  tags: ["client"],
  title: "Prepare braiding hair",
  updatedAt: "2026-06-11T09:00:00.000Z",
};

function renderTaskBox(overrides: Partial<Task> = {}) {
  render(
    <MemoryRouter>
      <TaskBox
        task={{ ...task, ...overrides }}
        removeTask={vi.fn()}
        updateCompletion={vi.fn()}
        updateSubtask={vi.fn()}
        duplicateTask={vi.fn()}
      />
    </MemoryRouter>
  );
}

describe("TaskBox", () => {
  test("renders the assigned person", () => {
    renderTaskBox();

    expect(screen.getByText("Prepare braiding hair")).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  test("does not render an assignee chip when the task is unassigned", () => {
    renderTaskBox({ assignedTo: undefined });

    expect(screen.queryByText("Ada")).not.toBeInTheDocument();
  });
});
