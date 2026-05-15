import type { TaskPriority } from "../types/tasks";

type ParsedVoiceTask = {
  title: string;
  tags: string[];
  dueDate?: string;
  dueTime?: string;
  priority?: TaskPriority;
};

export type VoiceTaskCommand =
  | { type: "open-create" }
  | { type: "create"; task: ParsedVoiceTask }
  | { type: "complete"; query: string }
  | { type: "add-tag"; query: string; tag: string }
  | { type: "update-time"; query: string; value: string }
  | { type: "update-date"; query: string; value: string }
  | { type: "update-priority"; query: string; priority: TaskPriority }
  | { type: "update-description"; query: string; description: string }
  | { type: "open-description"; query: string }
  | { type: "unknown"; transcript: string };

const priorityWords: TaskPriority[] = ["high", "medium", "low"];
const priorityAliases: Record<string, TaskPriority> = {
  high: "high",
  hi: "high",
  medium: "medium",
  mid: "medium",
  low: "low",
  know: "low",
};
const priorityAliasPattern = Object.keys(priorityAliases).join("|");
const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const monthPattern = monthNames.join("|");
const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const numberWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};
const spokenHourPattern = Object.keys(numberWords).join("|");
const timePrefixPattern = "(?:at|by)";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function getWeekdayDate(
  targetDay: number,
  modifier?: "this" | "next"
) {
  const date = new Date();
  const currentDay = date.getDay();
  let diff = (targetDay + 7 - currentDay) % 7;

  if (modifier === "next") diff = diff || 7;
  else if (modifier !== "this") diff = diff || 7;

  date.setDate(date.getDate() + diff);
  return toDateInputValue(date);
}

function getUpcomingSpokenDate(
  dayValue: string,
  monthValue: string,
  yearValue?: string
) {
  const day = Number(dayValue);
  const month = monthNames.indexOf(monthValue.toLowerCase());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = yearValue ? Number(yearValue) : today.getFullYear();
  let date = new Date(year, month, day);

  const isValidDate =
    month >= 0 &&
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day;
  if (!isValidDate) return undefined;

  if (!yearValue && date < today) {
    date = new Date(year + 1, month, day);
  }

  return toDateInputValue(date);
}

export function parseVoiceDueDate(text: string) {
  const relativeDates = [
    {
      pattern:
        /\b(?:due\s+)?(?:on\s+)?(?:next\s+tomorrow|day\s+after\s+tomorrow)\b/i,
      days: 2,
    },
    {
      pattern: /\b(?:due\s+)?(?:on\s+)?tomorrow\b/i,
      days: 1,
    },
    {
      pattern: /\b(?:due\s+)?(?:on\s+)?(?:today|tonight)\b/i,
      days: 0,
    },
  ];
  for (const relativeDate of relativeDates) {
    const match = text.match(relativeDate.pattern);
    if (match) {
      return { dueDate: addDays(relativeDate.days), match: match[0] };
    }
  }

  const inDurationMatch = text.match(
    /\b(?:due\s+)?in\s+(\d+)\s+(day|days|week|weeks)\b/i
  );
  if (inDurationMatch?.[1] && inDurationMatch[2]) {
    const amount = Number(inDurationMatch[1]);
    const unit = inDurationMatch[2].toLowerCase();
    return {
      dueDate: addDays(unit.startsWith("week") ? amount * 7 : amount),
      match: inDurationMatch[0],
    };
  }

  const nextWeekMatch = text.match(/\b(?:due\s+)?next\s+week\b/i);
  if (nextWeekMatch) {
    return {
      dueDate: addDays(7),
      match: nextWeekMatch[0],
    };
  }

  const dayFirstPattern = new RegExp(
    `\\b(?:due\\s+)?(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthPattern})(?:\\s+(\\d{4}))?\\b`,
    "i"
  );
  const dayFirstMatch = text.match(dayFirstPattern);
  if (dayFirstMatch?.[1] && dayFirstMatch[2]) {
    const dueDate = getUpcomingSpokenDate(
      dayFirstMatch[1],
      dayFirstMatch[2],
      dayFirstMatch[3]
    );
    if (dueDate) return { dueDate, match: dayFirstMatch[0] };
  }

  const monthFirstPattern = new RegExp(
    `\\b(?:due\\s+)?(?:on\\s+)?(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`,
    "i"
  );
  const monthFirstMatch = text.match(monthFirstPattern);
  if (monthFirstMatch?.[1] && monthFirstMatch[2]) {
    const dueDate = getUpcomingSpokenDate(
      monthFirstMatch[2],
      monthFirstMatch[1],
      monthFirstMatch[3]
    );
    if (dueDate) return { dueDate, match: monthFirstMatch[0] };
  }

  const weekdayMatch = text.match(
    /\b(?:due\s+)?(?:on\s+)?(?:(this|next)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
  );
  if (weekdayMatch?.[2]) {
    return {
      dueDate: getWeekdayDate(
        weekdays.indexOf(weekdayMatch[2].toLowerCase()),
        weekdayMatch[1]?.toLowerCase() as "this" | "next" | undefined
      ),
      match: weekdayMatch[0],
    };
  }

  return { dueDate: undefined, match: undefined };
}

function toTimeInputValue(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )}`;
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function inferNextClockOccurrence(
  hourValue: number,
  minuteValue: number,
  dueDate?: string
) {
  const now = new Date();
  const baseDate = dueDate ? parseDateInputValue(dueDate) : new Date(now);
  const candidateHours =
    hourValue === 12 ? [0, 12] : [hourValue, hourValue + 12];
  const candidates = candidateHours
    .map((hour) => {
      const date = new Date(baseDate);
      date.setHours(hour, minuteValue, 0, 0);
      return date;
    })
    .sort((a, b) => a.getTime() - b.getTime());

  if (dueDate) {
    return candidates[0];
  }

  const nextToday = candidates.find((candidate) => candidate > now);
  if (nextToday) return nextToday;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(candidateHours[0], minuteValue, 0, 0);
  return tomorrow;
}

function inferNextExactOccurrence(
  hourValue: number,
  minuteValue: number,
  dueDate?: string
) {
  const now = new Date();
  const candidate = dueDate ? parseDateInputValue(dueDate) : new Date(now);
  candidate.setHours(hourValue, minuteValue, 0, 0);

  if (!dueDate && candidate <= now) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

function parseSpokenHour(value: string) {
  return numberWords[value.toLowerCase()] ?? Number(value);
}

function cleanWorkingText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/^[,.!?]+|[,.!?]+$/g, "")
    .trim();
}

export function parseVoiceDueTime(text: string, dueDate?: string) {
  const namedTimeMatch = text.match(
    new RegExp(
      `\\b(?:${timePrefixPattern}\\s+)?(noon|midday|midnight)\\b`,
      "i"
    )
  );
  if (namedTimeMatch?.[1]) {
    const hour = namedTimeMatch[1].toLowerCase() === "midnight" ? 0 : 12;
    const inferredDate = inferNextExactOccurrence(hour, 0, dueDate);
    return {
      dueDate: toDateInputValue(inferredDate),
      dueTime: toTimeInputValue(hour, 0),
      match: namedTimeMatch[0],
    };
  }

  const meridiemMatch = text.match(
    new RegExp(
      `\\b(?:${timePrefixPattern}\\s+)?(\\d{1,2}|${spokenHourPattern})(?::(\\d{2}))?\\s*(a\\.?\\s*m\\.?|p\\.?\\s*m\\.?)(?=\\s|$|[,!?])`,
      "i"
    )
  );
  if (meridiemMatch) {
    const [, hourValue, minuteValue = "00", meridiemValue] = meridiemMatch;
    let hour = parseSpokenHour(hourValue);
    const minute = Number(minuteValue);
    const meridiem = meridiemValue.replace(/\s|\./g, "").toLowerCase();

    if (hour < 1 || hour > 12 || minute > 59) {
      return { dueDate: undefined, dueTime: undefined, match: undefined };
    }

    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    const inferredDate = inferNextExactOccurrence(hour, minute, dueDate);
    return {
      dueDate: toDateInputValue(inferredDate),
      dueTime: toTimeInputValue(hour, minute),
      match: meridiemMatch[0],
    };
  }

  const numericClockMatch = text.match(
    new RegExp(
      `\\b(?:${timePrefixPattern}\\s+)?([01]?\\d|2[0-3]):([0-5]\\d)\\b`,
      "i"
    )
  );
  if (numericClockMatch) {
    const [, clockHourValue, clockMinuteValue] = numericClockMatch;
    const hour = Number(clockHourValue);
    const minute = Number(clockMinuteValue);

    if (hour > 12 || hour === 0) {
      const inferredDate = inferNextExactOccurrence(hour, minute, dueDate);
      return {
        dueDate: toDateInputValue(inferredDate),
        dueTime: toTimeInputValue(hour, minute),
        match: numericClockMatch[0],
      };
    }

    const inferredDate = inferNextClockOccurrence(hour, minute, dueDate);
    return {
      dueDate: toDateInputValue(inferredDate),
      dueTime: toTimeInputValue(
        inferredDate.getHours(),
        inferredDate.getMinutes()
      ),
      match: numericClockMatch[0],
    };
  }

  const clockMatch = text.match(
    new RegExp(
      `\\b(?:${timePrefixPattern}\\s+)?(\\d{1,2}|${spokenHourPattern})(?::(\\d{2}))?\\s*o(?:['’]|\\s)?clock\\b`,
      "i"
    )
  );
  if (clockMatch) {
    const [, clockHourValue, clockMinuteValue = "00"] = clockMatch;
    const hour = parseSpokenHour(clockHourValue);
    const minute = Number(clockMinuteValue);

    if (hour < 1 || hour > 12 || minute > 59) {
      return { dueDate: undefined, dueTime: undefined, match: undefined };
    }

    const inferredDate = inferNextClockOccurrence(hour, minute, dueDate);

    return {
      dueDate: toDateInputValue(inferredDate),
      dueTime: toTimeInputValue(
        inferredDate.getHours(),
        inferredDate.getMinutes()
      ),
      match: clockMatch[0],
    };
  }

  const atHourMatch = text.match(
    new RegExp(
      `\\b${timePrefixPattern}\\s+(\\d{1,2}|${spokenHourPattern})\\b`,
      "i"
    )
  );
  if (atHourMatch?.[1]) {
    const hour = parseSpokenHour(atHourMatch[1]);
    if (hour >= 1 && hour <= 12) {
      const inferredDate = inferNextClockOccurrence(hour, 0, dueDate);
      return {
        dueDate: toDateInputValue(inferredDate),
        dueTime: toTimeInputValue(
          inferredDate.getHours(),
          inferredDate.getMinutes()
        ),
        match: atHourMatch[0],
      };
    }
  }

  return { dueDate: undefined, dueTime: undefined, match: undefined };
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
    .replace(
      /^(add|create|new|make)(?:\s+(?:a\s+)?task)?(?:\s+to)?\s+/i,
      ""
    );

  const due = parseVoiceDueDate(working);
  if (due.match) working = cleanWorkingText(working.replace(due.match, ""));

  const time = parseVoiceDueTime(working, due.dueDate);
  if (time.match) working = cleanWorkingText(working.replace(time.match, ""));

  const group = extractTextField(
    working,
    /\b(?:in\s+group|group|project|list)\s+(.+?)(?=\s+(?:with\s+)?tags?\b|\s+tagged\b|\s+priority\b|$)/i
  );
  if (group.match) working = cleanWorkingText(working.replace(group.match, ""));

  const tags = extractTextField(
    working,
    /\b(?:with\s+)?(?:tag|tags|tagged)\s+(.+?)(?=\s+(?:in\s+group|group|project|list|priority)\b|$)/i
  );
  if (tags.match) working = cleanWorkingText(working.replace(tags.match, ""));

  const priority = priorityWords.find((word) =>
    new RegExp(`\\b(priority\\s+)?${word}\\b`, "i").test(working)
  );
  if (priority) {
    working = working
      .replace(new RegExp(`\\bpriority\\s+${priority}\\b`, "i"), "")
      .replace(new RegExp(`\\b${priority}\\s+priority\\b`, "i"), "");
    working = cleanWorkingText(working);
  }

  return {
    title: working || transcript.trim(),
    tags: [...extractTags(tags.value), ...(group.value ? [group.value] : [])],
    dueDate:
      time.dueDate ??
      due.dueDate ??
      (time.dueTime ? toDateInputValue(new Date()) : undefined),
    dueTime: time.dueTime,
    priority,
  };
}

export function parseVoiceCommand(transcript: string): VoiceTaskCommand {
  const normalized = transcript.trim().replace(/\s+/g, " ");

  if (/^(add|create|new task)$/i.test(normalized)) {
    return { type: "open-create" };
  }

  const addTagMatch = normalized.match(
    /^(?:add|apply)\s+(.+?)\s+tags?\s+to\s+(.+)$/i
  );
  if (addTagMatch?.[1] && addTagMatch[2]) {
    return {
      type: "add-tag",
      tag: cleanWorkingText(addTagMatch[1]),
      query: cleanWorkingText(addTagMatch[2]),
    };
  }

  const updateTimeMatch = normalized.match(
    /^(?:update|change|set)\s+(?:the\s+)?time\s+(?:of|for)\s+(.+?)\s+to\s+(.+)$/i
  );
  if (updateTimeMatch?.[1] && updateTimeMatch[2]) {
    return {
      type: "update-time",
      query: cleanWorkingText(updateTimeMatch[1]),
      value: cleanWorkingText(updateTimeMatch[2]),
    };
  }

  const updateDateMatch = normalized.match(
    /^(?:update|change|set)\s+(?:the\s+)?date\s+(?:of|for)\s+(.+?)\s+to\s+(.+)$/i
  );
  if (updateDateMatch?.[1] && updateDateMatch[2]) {
    return {
      type: "update-date",
      query: cleanWorkingText(updateDateMatch[1]),
      value: cleanWorkingText(updateDateMatch[2]),
    };
  }

  const updatePriorityMatch =
    normalized.match(
      new RegExp(
        `^(?:update|change|set)\\s+(?:the\\s+)?priorit(?:y|ies)\\s+(?:of|for)\\s+(.+?)\\s+to\\s+(${priorityAliasPattern})$`,
        "i"
      )
    ) ??
    normalized.match(
      new RegExp(
        `^(?:update|change|set)\\s+(.+?)\\s+priorit(?:y|ies)\\s+to\\s+(${priorityAliasPattern})$`,
        "i"
      )
    ) ??
    normalized.match(
      new RegExp(
        `^(?:update|change|set)\\s+(?:the\\s+)?priorit(?:y|ies)\\s+to\\s+(${priorityAliasPattern})\\s+(?:of|for)\\s+(.+?)$`,
        "i"
      )
    );
  if (updatePriorityMatch?.[1] && updatePriorityMatch[2]) {
    const isValueFirstPattern = Boolean(
      priorityAliases[updatePriorityMatch[1].toLowerCase()]
    );
    const rawPriority = isValueFirstPattern
      ? updatePriorityMatch[1]
      : updatePriorityMatch[2];
    const query = isValueFirstPattern
      ? updatePriorityMatch[2]
      : updatePriorityMatch[1];

    return {
      type: "update-priority",
      query: cleanWorkingText(query),
      priority: priorityAliases[rawPriority.toLowerCase()],
    };
  }

  const addDescriptionMatch = normalized.match(
    /^(?:add|update|set)\s+(?:the\s+)?description\s+(.+?)\s+to\s+(.+)$/i
  );
  if (addDescriptionMatch?.[1] && addDescriptionMatch[2]) {
    return {
      type: "update-description",
      description: cleanWorkingText(addDescriptionMatch[1]),
      query: cleanWorkingText(addDescriptionMatch[2]),
    };
  }

  const openDescriptionMatch = normalized.match(
    /^(?:add|update|set)\s+(?:the\s+)?description\s+(?:of|for|to)\s+(.+)$/i
  );
  if (openDescriptionMatch?.[1]) {
    return {
      type: "open-description",
      query: cleanWorkingText(openDescriptionMatch[1]),
    };
  }

  const completeMatch = normalized.match(
    /^(?:complete|finish|mark)\s+(?:task\s+)?(.+?)(?:\s+as\s+done)?$/i
  );
  if (completeMatch?.[1]) {
    return { type: "complete", query: completeMatch[1].trim() };
  }

  if (/^(?:add|create|new|make)\b/i.test(normalized)) {
    return { type: "create", task: parseVoiceTask(normalized) };
  }

  return { type: "unknown", transcript: normalized };
}

export function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}
