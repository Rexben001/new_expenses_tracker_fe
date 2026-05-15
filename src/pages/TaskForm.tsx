import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import Select, { type MultiValue, type StylesConfig } from "react-select";
import { FiChevronLeft, FiPlus, FiMic, FiSquare, FiTrash2 } from "react-icons/fi";
import { HeaderComponent } from "../components/HeaderComponent";
import { FooterNav } from "../components/FooterNav";
import SwipeShell from "../components/SwipeShell";
import { createTask, updateTask } from "../services/api";
import { useItemContext } from "../hooks/useItemContext";
import type { SubTask, Task, TaskPriority } from "../types/tasks";
import { getSpeechRecognition, parseVoiceTask } from "../services/taskVoice";

type TaskFormData = {
  title: string;
  description: string;
  tags: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  completed: string;
};

type SelectOption = {
  value: string;
  label: string;
};

const DEFAULT_TASK_GROUPS = ["Work", "Personal", "Home", "Errands"];
const DEFAULT_TASK_TAGS = ["urgent", "calls", "admin", "finance"];
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white p-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900";

const selectStyles: StylesConfig<SelectOption, true> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "var(--task-select-bg, #ffffff)",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    minHeight: "50px",
    borderRadius: "0.75rem",
    fontSize: "16px",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#e5e7eb" : "white",
    color: "#111827",
    fontSize: "16px",
  }),
  multiValue: (base) => ({
    ...base,
    borderRadius: "9999px",
    backgroundColor: "#dbeafe",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#1d4ed8",
    paddingLeft: "8px",
  }),
  multiValueRemove: (base) => ({
    ...base,
    borderRadius: "9999px",
    color: "#1d4ed8",
    ":hover": {
      backgroundColor: "#bfdbfe",
      color: "#1e3a8a",
    },
  }),
};

function todayInputValue() {
  return new Date().toISOString().split("T")[0];
}

function tagsToString(tags?: string[]) {
  return tags?.join(", ") ?? "";
}

function mergedTaskTags(task?: Partial<Task> | null) {
  return Array.from(
    new Set([...(task?.tags ?? []), task?.group].filter(Boolean) as string[])
  );
}

function splitTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function uniqueOptions(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  )
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

function createSubtaskId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function normalizeSubtasks(subtasks?: SubTask[]) {
  return (subtasks ?? [])
    .map((subtask) => ({
      id: subtask.id || createSubtaskId(),
      title: subtask.title.trim(),
      completed: Boolean(subtask.completed),
    }))
    .filter((subtask) => subtask.title);
}

export function TaskForm() {
  const { taskId } = useParams();
  const isEditMode = Boolean(taskId);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as Partial<Task> | null;
  const { tasks, fetchTasks, getSubAccountId } = useItemContext();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const existingTask = tasks.find((task) => task.id === taskId);
  const task = state ?? existingTask;
  const defaultDueDate = todayInputValue();

  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    tags: "",
    dueDate: defaultDueDate,
    dueTime: "",
    priority: "medium",
    completed: "false",
  });
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const voiceSupported = Boolean(getSpeechRecognition());

  useEffect(() => {
    if (!isEditMode || !task) return;
    setFormData({
      title: task.title ?? "",
      description: task.description ?? "",
      tags: tagsToString(mergedTaskTags(task)),
      dueDate: task.dueDate?.split("T")[0] ?? defaultDueDate,
      dueTime: task.dueTime ?? "",
      priority: task.priority ?? "medium",
      completed: task.completed ? "true" : "false",
    });
    setSubtasks(normalizeSubtasks(task.subtasks));
  }, [defaultDueDate, isEditMode, task]);

  const tagOptions = useMemo(
    () =>
      uniqueOptions([
        ...DEFAULT_TASK_GROUPS,
        ...DEFAULT_TASK_TAGS,
        ...tasks.flatMap((task) => mergedTaskTags(task)),
        ...splitTags(formData.tags),
      ]),
    [formData.tags, tasks]
  );

  const selectedTagOptions = useMemo(() => {
    const selectedTags = splitTags(formData.tags);
    return tagOptions.filter((option) => selectedTags.includes(option.value));
  }, [formData.tags, tagOptions]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const applyTranscript = useCallback((transcript: string) => {
    const parsed = parseVoiceTask(transcript);
    setFormData((current) => ({
      ...current,
      title: parsed.title || current.title,
      tags: parsed.tags.length ? parsed.tags.join(", ") : current.tags,
      dueDate: parsed.dueDate ?? current.dueDate,
      dueTime: parsed.dueTime ?? current.dueTime,
      priority: parsed.priority ?? current.priority,
    }));
  }, []);

  const startVoiceCapture = useCallback(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceError("Voice input is not supported in this browser.");
      return;
    }

    setVoiceError("");
    setVoiceTranscript("");

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => {
      setVoiceError("Could not capture your voice. Try again or type the task.");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const results = Array.from(
        { length: event.results.length },
        (_, index) => event.results[index]
      );
      const transcript = results
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      setVoiceTranscript(transcript);

      if (event.results[event.results.length - 1]?.isFinal) {
        applyTranscript(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [applyTranscript]);

  useEffect(() => {
    if (searchParams.get("voice") === "1" && !isEditMode) {
      startVoiceCapture();
    }

    return () => recognitionRef.current?.abort();
  }, [isEditMode, searchParams, startVoiceCapture]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleAddSubtask = () => {
    const title = subtaskTitle.trim();
    if (!title) return;

    setSubtasks((current) => [
      ...current,
      { id: createSubtaskId(), title, completed: false },
    ]);
    setSubtaskTitle("");
  };

  const handleSubtaskTitleChange = (id: string, title: string) => {
    setSubtasks((current) =>
      current.map((subtask) =>
        subtask.id === id ? { ...subtask, title } : subtask
      )
    );
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((current) =>
      current.map((subtask) =>
        subtask.id === id
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      )
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((current) => current.filter((subtask) => subtask.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const description = formData.description.trim();
    const tags = splitTags(formData.tags);
    const body = {
      title: formData.title.trim(),
      ...(description || isEditMode ? { description } : {}),
      tags,
      dueDate: formData.dueDate || undefined,
      dueTime: formData.dueTime || undefined,
      priority: formData.priority,
      completed: formData.completed === "true",
      subtasks: normalizeSubtasks(subtasks),
      updatedAt: new Date().toISOString(),
    };

    const subId = await getSubAccountId();

    if (isEditMode) await updateTask(taskId!, body, subId);
    else await createTask(body, subId);

    await fetchTasks();
    navigate("/tasks", { state: { refresh: true } });
  };

  return (
    <SwipeShell refresh={async () => {}}>
      <HeaderComponent>
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/tasks")}
            className="text-gray-600 hover:text-black dark:text-white"
          >
            <FiChevronLeft className="text-2xl" />
          </button>
          <h1 className="text-xl font-bold">
            {isEditMode ? "Edit Task" : "Create New Task"}
          </h1>
        </div>
      </HeaderComponent>

      <div className="mx-auto mt-14 min-h-screen max-w-md px-4 pt-6 pb-36 dark:text-white">
        <form id="task-form" className="space-y-5" onSubmit={handleSubmit}>
          {!isEditMode && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Voice task
                  </p>
                  {voiceTranscript && (
                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      {voiceTranscript}
                    </p>
                  )}
                  {voiceError && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                      {voiceError}
                    </p>
                  )}
                  {!voiceSupported && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Voice input is not available in this browser.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!voiceSupported}
                  onClick={() =>
                    isListening
                      ? recognitionRef.current?.stop()
                      : startVoiceCapture()
                  }
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm disabled:opacity-50 ${
                    isListening ? "bg-red-600" : "bg-blue-600"
                  }`}
                >
                  {isListening ? <FiSquare /> : <FiMic />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-gray-500 dark:text-white">
              Task Name
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task"
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-500 dark:text-white">
                Due Date
              </label>
              <input
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500 dark:text-white">
                Time{" "}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Optional
                </span>
              </label>
              <input
                name="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-500 dark:text-white">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-500 dark:text-white">
                Status
              </label>
              <select
                name="completed"
                value={formData.completed}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="false">Open</option>
                <option value="true">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500 dark:text-white">
              Description{" "}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Optional
              </span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details"
              rows={3}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500 dark:text-white">
              Tags{" "}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Optional
              </span>
            </label>
            <Select
              isMulti
              name="tags"
              options={tagOptions}
              value={selectedTagOptions}
              onChange={(selected: MultiValue<SelectOption>) => {
                setFormData((current) => ({
                  ...current,
                  tags: selected.map((option) => option.value).join(", "),
                }));
              }}
              className="text-sm"
              classNamePrefix="react-select"
              closeMenuOnSelect={false}
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
              menuPlacement="auto"
              styles={selectStyles}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-500 dark:text-white">
              Subtasks{" "}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Optional
              </span>
            </label>

            <div className="flex gap-2">
              <input
                value={subtaskTitle}
                onChange={(event) => setSubtaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add a subtask"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                aria-label="Add subtask"
              >
                <FiPlus className="h-5 w-5" />
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="mt-3 space-y-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(subtask.completed)}
                      onChange={() => handleToggleSubtask(subtask.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <input
                      value={subtask.title}
                      onChange={(event) =>
                        handleSubtaskTitleChange(subtask.id, event.target.value)
                      }
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(subtask.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      aria-label="Remove subtask"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
      <div className="fixed inset-x-0 bottom-16 z-50 mx-auto max-w-md border-t border-gray-200 bg-slate-50/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <button
          type="submit"
          form="task-form"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting
            ? isEditMode
              ? "Updating..."
              : "Adding..."
            : isEditMode
            ? "Update Task"
            : "Add Task"}
        </button>
      </div>
      <FooterNav />
    </SwipeShell>
  );
}
