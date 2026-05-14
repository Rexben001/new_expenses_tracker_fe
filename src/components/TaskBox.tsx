import { format, parseISO } from "date-fns";
import { useEffect, useRef, useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiCircle,
  FiCopy,
  FiEdit2,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import { HiDotsVertical } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import type { Task } from "../types/tasks";

type TaskBoxProps = {
  task: Task;
  removeTask(id: string): Promise<void>;
  updateCompletion(id: string, completed: boolean): Promise<void>;
  updateSubtask(
    task: Task,
    subtaskId: string,
    completed: boolean
  ): Promise<void>;
  duplicateTask(task: Task): Promise<void>;
};

const priorityClass: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900",
  medium:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900",
  high: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900",
};

function formatTaskDate(date?: string) {
  if (!date) return "No due date";
  const parsedDate = parseISO(date);
  if (Number.isNaN(parsedDate.getTime())) return "No due date";
  return format(parsedDate, "MMM d");
}

function getTaskTags(task: Task) {
  return Array.from(
    new Set([...(task.tags ?? []), task.group].filter(Boolean) as string[])
  );
}

export function TaskBox({
  task,
  removeTask,
  updateCompletion,
  updateSubtask,
  duplicateTask,
}: TaskBoxProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const completed = Boolean(task.completed);
  const priority = task.priority ?? "medium";
  const taskTags = getTaskTags(task);
  const visibleTags = taskTags.slice(0, 2);
  const hiddenTagCount = taskTags.length - visibleTags.length;
  const subtasks = task.subtasks ?? [];
  const completedSubtasks = subtasks.filter((subtask) => subtask.completed);
  const visibleSubtasks = subtasks.slice(0, 3);
  const hiddenSubtaskCount = subtasks.length - visibleSubtasks.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div
      ref={menuRef}
      className={`relative mb-2 rounded-xl border bg-white p-3 shadow-sm transition dark:border-gray-800 dark:bg-gray-900 ${
        completed
          ? "border-gray-100 opacity-75 dark:border-gray-800"
          : "border-gray-200"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        setShowMenu(false);
      }}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          aria-label={completed ? "Mark task incomplete" : "Complete task"}
          onClick={(e) => {
            e.stopPropagation();
            updateCompletion(task.id, !completed);
          }}
          className={`mt-0.5 shrink-0 rounded-full transition ${
            completed
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-300"
          }`}
        >
          {completed ? (
            <FiCheckCircle className="h-5 w-5" />
          ) : (
            <FiCircle className="h-5 w-5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={`truncate text-sm font-semibold leading-5 text-gray-950 dark:text-gray-50 ${
                  completed
                    ? "text-gray-400 line-through dark:text-gray-500"
                    : ""
                }`}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  {task.description}
                </p>
              )}
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Task actions"
                className="-mr-1 -mt-1 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((open) => !open);
                }}
              >
                <HiDotsVertical className="h-5 w-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-100 w-36 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                  <ul className="text-sm text-gray-700 dark:text-white">
                    <li>
                      <button
                        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          navigate(`/tasks/${task.id}/edit`, { state: task });
                        }}
                      >
                        <FiEdit2 />
                        Edit
                      </button>
                    </li>
                    <li>
                      <button
                        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={async () => {
                          await duplicateTask(task);
                          setShowMenu(false);
                        }}
                      >
                        <FiCopy />
                        Duplicate
                      </button>
                    </li>
                    <li>
                      <button
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={async () => {
                          await removeTask(task.id);
                          setShowMenu(false);
                        }}
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 font-medium capitalize ring-1 ${
                priorityClass[priority] ?? priorityClass.medium
              }`}
            >
              {priority}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
              <FiCalendar className="h-3.5 w-3.5" />
              {formatTaskDate(task.dueDate)}
            </span>
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex min-w-0 max-w-[8rem] items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
              >
                <FiTag className="h-3.5 w-3.5" />
                <span className="truncate">{tag}</span>
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                +{hiddenTagCount}
              </span>
            )}
          </div>

          {subtasks.length > 0 && (
            <div className="mt-2 space-y-1.5 rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60">
              <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
                <span>Subtasks</span>
                <span>
                  {completedSubtasks.length}/{subtasks.length}
                </span>
              </div>
              {visibleSubtasks.map((subtask) => (
                <button
                  key={subtask.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    updateSubtask(task, subtask.id, !subtask.completed);
                  }}
                  className="flex w-full min-w-0 items-center gap-2 text-left text-xs text-gray-700 dark:text-gray-200"
                >
                  {subtask.completed ? (
                    <FiCheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  ) : (
                    <FiCircle className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  )}
                  <span
                    className={`truncate ${
                      subtask.completed
                        ? "text-gray-400 line-through dark:text-gray-500"
                        : ""
                    }`}
                  >
                    {subtask.title}
                  </span>
                </button>
              ))}
              {hiddenSubtaskCount > 0 && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  +{hiddenSubtaskCount} more
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
