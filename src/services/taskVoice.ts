import type { TaskPriority } from "../types/tasks";

type ParsedVoiceTask = {
  title: string;
  tags: string[];
  dueDate?: string;
  priority?: TaskPriority;
};

const priorityWords: TaskPriority[] = ["high", "medium", "low"];

function toDateInputValue(date: Date) {
  return date.toISOString().split("T")[0];
}

function getNextWeekday(targetDay: number) {
  const date = new Date();
  const currentDay = date.getDay();
  const diff = (targetDay + 7 - currentDay) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return toDateInputValue(date);
}

function extractDueDate(text: string) {
  const lower = text.toLowerCase();
  const date = new Date();

  if (/\b(today|due today)\b/.test(lower)) {
    return { dueDate: toDateInputValue(date), match: /\b(due\s+)?today\b/i };
  }

  if (/\b(tomorrow|due tomorrow)\b/.test(lower)) {
    date.setDate(date.getDate() + 1);
    return { dueDate: toDateInputValue(date), match: /\b(due\s+)?tomorrow\b/i };
  }

  if (/\b(next week|due next week)\b/.test(lower)) {
    date.setDate(date.getDate() + 7);
    return {
      dueDate: toDateInputValue(date),
      match: /\b(due\s+)?next\s+week\b/i,
    };
  }

  const weekdayMatch = lower.match(
    /\b(?:due\s+)?(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
  );
  if (weekdayMatch?.[1]) {
    const weekdays = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return {
      dueDate: getNextWeekday(weekdays.indexOf(weekdayMatch[1])),
      match: /\b(?:due\s+)?(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    };
  }

  return { dueDate: undefined, match: undefined };
}

function extractTextField(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return {
    value: match?.[1]?.trim(),
    match: match?.[0],
  };
}

function extractTags(value?: string) {
  if (!value) return [];
  return value
    .split(/,|\band\b/i)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function parseVoiceTask(transcript: string): ParsedVoiceTask {
  let working = transcript
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(add|create|new|make)\s+(a\s+)?task\s+(to\s+)?/i, "");

  const due = extractDueDate(working);
  if (due.match) working = working.replace(due.match, "").trim();

  const group = extractTextField(
    working,
    /\b(?:in\s+group|group|project|list)\s+(.+?)(?=\s+(?:with\s+)?tags?\b|\s+tagged\b|\s+priority\b|$)/i
  );
  if (group.match) working = working.replace(group.match, "").trim();

  const tags = extractTextField(
    working,
    /\b(?:with\s+)?(?:tag|tags|tagged)\s+(.+?)(?=\s+(?:in\s+group|group|project|list|priority)\b|$)/i
  );
  if (tags.match) working = working.replace(tags.match, "").trim();

  const priority = priorityWords.find((word) =>
    new RegExp(`\\b(priority\\s+)?${word}\\b`, "i").test(working)
  );
  if (priority) {
    working = working
      .replace(new RegExp(`\\bpriority\\s+${priority}\\b`, "i"), "")
      .replace(new RegExp(`\\b${priority}\\s+priority\\b`, "i"), "")
      .trim();
  }

  return {
    title: working || transcript.trim(),
    tags: [...extractTags(tags.value), ...(group.value ? [group.value] : [])],
    dueDate: due.dueDate,
    priority,
  };
}
