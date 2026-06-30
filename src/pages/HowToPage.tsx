import { useEffect, useMemo, useState, type ReactNode } from "react";
import { EditorContent, useEditor, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  FiBold,
  FiArrowLeft,
  FiCalendar,
  FiCopy,
  FiCreditCard,
  FiEdit3,
  FiExternalLink,
  FiEye,
  FiItalic,
  FiKey,
  FiLink,
  FiList,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import {
  createHowToEntry,
  deleteHowToEntry,
  getErrorMessage,
  getHowToEntry,
  listHowToEntries,
  revealHowToSecrets,
  updateHowToEntry,
  type HowToEntry,
  type HowToEntryPayload,
  type HowToSecret,
} from "../services/api";

type SecretDraft = {
  id?: string;
  label: string;
  value: string;
};

type HowToFormState = {
  title: string;
  category: string;
  tagsText: string;
  keywordsText: string;
  summary: string;
  contentJson: unknown;
  loginUrl: string;
  loginEmail: string;
  loginUsername: string;
  loginNotes: string;
  paymentTotalAmount: string;
  paymentCurrency: string;
  paymentDeductionDay: string;
  paymentNotes: string;
  secrets: SecretDraft[];
  secretsTouched: boolean;
};

const PAGE_LIMIT = 20;
const HOW_TO_SHELL_CLASS = "sm:max-w-2xl lg:max-w-6xl";
const EMPTY_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900";
const textareaClass =
  "min-h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900";
const iconButtonClass =
  "grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:text-blue-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

function splitList(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function joinList(values?: string[]) {
  return (values ?? []).join(", ");
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatAmount(amount?: number | null, currency = "EUR") {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "EUR"} ${amount.toFixed(2)}`;
  }
}

function ensureHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function linkifyText(value: string) {
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,}[^\s]*)/gi;
  const parts = value.split(urlPattern);

  return parts.map((part, index) => {
    const isUrl =
      /^https?:\/\//i.test(part) ||
      /^www\./i.test(part) ||
      /^[a-z0-9.-]+\.[a-z]{2,}/i.test(part);
    if (!isUrl) return part;

    return (
      <a
        key={`${part}-${index}`}
        href={ensureHref(part)}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 underline underline-offset-2 dark:text-blue-300"
      >
        {part}
      </a>
    );
  });
}

function createEmptyForm(): HowToFormState {
  return {
    title: "",
    category: "",
    tagsText: "",
    keywordsText: "",
    summary: "",
    contentJson: EMPTY_CONTENT,
    loginUrl: "",
    loginEmail: "",
    loginUsername: "",
    loginNotes: "",
    paymentTotalAmount: "",
    paymentCurrency: "EUR",
    paymentDeductionDay: "",
    paymentNotes: "",
    secrets: [],
    secretsTouched: true,
  };
}

function formFromEntry(entry: HowToEntry): HowToFormState {
  return {
    title: entry.title,
    category: entry.category,
    tagsText: joinList(entry.tags),
    keywordsText: joinList(entry.keywords),
    summary: entry.summary,
    contentJson: entry.contentJson ?? EMPTY_CONTENT,
    loginUrl: entry.loginDetails?.url ?? "",
    loginEmail: entry.loginDetails?.email ?? "",
    loginUsername: entry.loginDetails?.username ?? "",
    loginNotes: entry.loginDetails?.notes ?? "",
    paymentTotalAmount:
      entry.paymentDetails?.totalAmount === null ||
      entry.paymentDetails?.totalAmount === undefined
        ? ""
        : String(entry.paymentDetails.totalAmount),
    paymentCurrency: entry.paymentDetails?.currency || "EUR",
    paymentDeductionDay: entry.paymentDetails?.monthlyDeductionDay
      ? String(entry.paymentDetails.monthlyDeductionDay)
      : "",
    paymentNotes: entry.paymentDetails?.notes ?? "",
    secrets: [],
    secretsTouched: false,
  };
}

function buildPayload(form: HowToFormState, includeSecrets: boolean) {
  const totalAmount = Number(form.paymentTotalAmount);
  const monthlyDeductionDay = Number(form.paymentDeductionDay);
  const payload: HowToEntryPayload = {
    title: form.title.trim(),
    category: form.category.trim(),
    tags: splitList(form.tagsText),
    keywords: splitList(form.keywordsText),
    summary: form.summary.trim(),
    contentJson: form.contentJson,
    loginDetails: {
      url: form.loginUrl.trim(),
      email: form.loginEmail.trim(),
      username: form.loginUsername.trim(),
      notes: form.loginNotes.trim(),
    },
    paymentDetails: {
      totalAmount:
        form.paymentTotalAmount.trim() && Number.isFinite(totalAmount)
          ? totalAmount
          : null,
      currency: form.paymentCurrency.trim().toUpperCase() || "EUR",
      monthlyDeductionDay:
        form.paymentDeductionDay.trim() &&
        Number.isInteger(monthlyDeductionDay) &&
        monthlyDeductionDay >= 1 &&
        monthlyDeductionDay <= 31
          ? monthlyDeductionDay
          : null,
      notes: form.paymentNotes.trim(),
    },
  };

  if (includeSecrets) {
    payload.secrets = form.secrets
      .map((secret) => ({
        id: secret.id,
        label: secret.label.trim(),
        value: secret.value,
      }))
      .filter((secret) => secret.label && secret.value);
  }

  return payload;
}

function copyText(value: string) {
  void navigator.clipboard?.writeText(value);
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value as Content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  const toolbarButton = (active: boolean) =>
    `grid h-8 w-8 place-items-center rounded-md border text-sm ${
      active
        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200"
        : "border-gray-200 bg-white text-gray-600 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
    }`;

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-950">
        <button
          type="button"
          className={toolbarButton(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <FiBold />
        </button>
        <button
          type="button"
          className={toolbarButton(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <FiItalic />
        </button>
        <button
          type="button"
          className={toolbarButton(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bulleted list"
        >
          <FiList />
        </button>
        <button
          type="button"
          className={toolbarButton(editor.isActive("heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Heading"
        >
          H
        </button>
      </div>
      <EditorContent editor={editor} className="how-to-editor" />
    </div>
  );
}

function renderRichContent(value: unknown) {
  const root = value && typeof value === "object" ? value : EMPTY_CONTENT;
  const content = Array.isArray((root as { content?: unknown }).content)
    ? ((root as { content: unknown[] }).content)
    : [];

  if (!content.length) {
    return <p className="text-sm text-gray-500">No content added.</p>;
  }

  return (
    <div className="space-y-3 text-sm leading-6 text-gray-800 dark:text-gray-100">
      {content.map((node, index) => renderBlock(node, index))}
    </div>
  );
}

function renderBlock(node: unknown, index: number): ReactNode {
  if (!node || typeof node !== "object") return null;
  const record = node as {
    type?: string;
    attrs?: Record<string, unknown>;
    content?: unknown[];
    text?: string;
  };
  const children = renderInline(record.content ?? []);

  if (record.type === "heading") {
    return (
      <h2 key={index} className="text-base font-semibold">
        {children}
      </h2>
    );
  }

  if (record.type === "bulletList") {
    return (
      <ul key={index} className="list-disc space-y-1 pl-5">
        {(record.content ?? []).map((child, childIndex) => (
          <li key={childIndex}>{renderInline((child as { content?: unknown[] }).content ?? [])}</li>
        ))}
      </ul>
    );
  }

  if (record.type === "orderedList") {
    return (
      <ol key={index} className="list-decimal space-y-1 pl-5">
        {(record.content ?? []).map((child, childIndex) => (
          <li key={childIndex}>{renderInline((child as { content?: unknown[] }).content ?? [])}</li>
        ))}
      </ol>
    );
  }

  return <p key={index}>{children}</p>;
}

function renderInline(nodes: unknown[]): ReactNode {
  return nodes.map((node, index) => {
    if (!node || typeof node !== "object") return null;
    const record = node as {
      type?: string;
      text?: string;
      marks?: Array<{ type?: string }>;
      content?: unknown[];
    };

    if (record.type === "hardBreak") return <br key={index} />;
    if (record.content) return renderInline(record.content);

    let child: ReactNode = linkifyText(record.text ?? "");
    for (const mark of record.marks ?? []) {
      if (mark.type === "bold") child = <strong>{child}</strong>;
      if (mark.type === "italic") child = <em>{child}</em>;
      if (mark.type === "code") {
        child = (
          <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
            {child}
          </code>
        );
      }
    }

    return <span key={index}>{child}</span>;
  });
}

export function HowToPage() {
  const navigate = useNavigate();
  const { howToId } = useParams<{ howToId?: string }>();
  const isDetailRoute = Boolean(howToId);
  const [entries, setEntries] = useState<HowToEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<HowToEntry | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready.");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HowToEntry | null>(null);
  const [form, setForm] = useState<HowToFormState>(createEmptyForm);
  const [revealedSecrets, setRevealedSecrets] = useState<
    Record<string, HowToSecret[]>
  >({});
  const [revealing, setRevealing] = useState(false);

  const categories = useMemo(
    () =>
      Array.from(new Set(entries.map((entry) => entry.category).filter(Boolean))).sort(
        (left, right) => left.localeCompare(right)
      ),
    [entries]
  );
  const tags = useMemo(
    () =>
      Array.from(
        new Set(entries.flatMap((entry) => entry.tags ?? []).filter(Boolean))
      ).sort((left, right) => left.localeCompare(right)),
    [entries]
  );

  const loadEntries = async ({
    append = false,
    cursor = null,
  }: {
    append?: boolean;
    cursor?: string | null;
  } = {}) => {
    setLoading(true);
    setError("");

    try {
      const response = await listHowToEntries({
        query: query.trim(),
        category: categoryFilter,
        tag: tagFilter,
        limit: PAGE_LIMIT,
        cursor,
      });
      setEntries((current) =>
        append ? [...current, ...response.items] : response.items
      );
      setNextCursor(response.nextCursor ?? null);
      setStatusMessage(
        `Loaded ${response.count} of ${response.total} How-To item(s).`
      );
      if (!isDetailRoute && !append) setActiveEntry(null);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load How-To items."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!howToId) {
      setActiveEntry(null);
      return;
    }

    let mounted = true;
    setDetailLoading(true);
    setError("");

    getHowToEntry(howToId)
      .then((detail) => {
        if (!mounted) return;
        setActiveEntry(detail);
        setStatusMessage(`Opened ${detail.title}.`);
      })
      .catch((openError) => {
        if (!mounted) return;
        setActiveEntry(null);
        setError(getErrorMessage(openError, "Could not open How-To item."));
      })
      .finally(() => {
        if (mounted) setDetailLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [howToId]);

  const openEntry = (entry: HowToEntry) => {
    navigate(`/how-to/${entry.id}`);
  };

  const openCreate = () => {
    setEditingEntry(null);
    setForm(createEmptyForm());
    setFormOpen(true);
  };

  const openEdit = (entry: HowToEntry) => {
    setEditingEntry(entry);
    setForm(formFromEntry(entry));
    setFormOpen(true);
  };

  const saveEntry = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = buildPayload(form, !editingEntry || form.secretsTouched);
      const response = editingEntry
        ? await updateHowToEntry(editingEntry.id, payload)
        : await createHowToEntry(payload);

      setStatusMessage(response.message);
      setActiveEntry(response.item);
      setFormOpen(false);
      setEditingEntry(null);
      await loadEntries();
      navigate(`/how-to/${response.item.id}`);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save How-To item."));
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (entry: HowToEntry) => {
    const confirmed = window.confirm(`Delete "${entry.title}"?`);
    if (!confirmed) return;

    setLoading(true);
    setError("");
    try {
      await deleteHowToEntry(entry.id);
      setStatusMessage("How-To item deleted.");
      setActiveEntry(null);
      navigate("/how-to");
      await loadEntries();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete How-To item."));
    } finally {
      setLoading(false);
    }
  };

  const revealSecrets = async (entry: HowToEntry) => {
    setRevealing(true);
    setError("");
    try {
      const response = await revealHowToSecrets(entry.id);
      setRevealedSecrets((current) => ({
        ...current,
        [entry.id]: response.secrets,
      }));
    } catch (revealError) {
      setError(getErrorMessage(revealError, "Could not reveal secrets."));
    } finally {
      setRevealing(false);
    }
  };

  const updateSecret = (index: number, patch: Partial<SecretDraft>) => {
    setForm((current) => ({
      ...current,
      secretsTouched: true,
      secrets: current.secrets.map((secret, secretIndex) =>
        secretIndex === index ? { ...secret, ...patch } : secret
      ),
    }));
  };

  const removeSecret = (index: number) => {
    setForm((current) => ({
      ...current,
      secretsTouched: true,
      secrets: current.secrets.filter((_, secretIndex) => secretIndex !== index),
    }));
  };

  const renderDetailContent = () => {
    if (detailLoading) {
      return (
        <div className="grid h-full min-h-72 place-items-center text-sm text-gray-500">
          Loading How-To details...
        </div>
      );
    }

    if (!activeEntry) {
      return (
        <div className="grid h-full min-h-72 place-items-center text-sm text-gray-500">
          Select a How-To item.
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">{activeEntry.title}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Updated {formatDate(activeEntry.updatedAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className={iconButtonClass}
              onClick={() => openEdit(activeEntry)}
              aria-label="Edit How-To item"
            >
              <FiEdit3 />
            </button>
            <button
              type="button"
              className={iconButtonClass}
              onClick={() => removeEntry(activeEntry)}
              aria-label="Delete How-To item"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>

        {activeEntry.summary && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-100">
            {activeEntry.summary}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {activeEntry.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-100">
              <FiTag />
              {activeEntry.category}
            </span>
          )}
          {activeEntry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
            >
              {tag}
            </span>
          ))}
        </div>

        {(activeEntry.paymentDetails?.totalAmount !== null &&
          activeEntry.paymentDetails?.totalAmount !== undefined) ||
        activeEntry.paymentDetails?.monthlyDeductionDay ||
        activeEntry.paymentDetails?.notes ? (
          <div className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30 sm:grid-cols-2">
            {activeEntry.paymentDetails?.totalAmount !== null &&
              activeEntry.paymentDetails?.totalAmount !== undefined && (
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                    Total amount
                  </p>
                  <p className="mt-1 font-semibold text-emerald-950 dark:text-emerald-50">
                    {formatAmount(
                      activeEntry.paymentDetails.totalAmount,
                      activeEntry.paymentDetails.currency
                    )}
                  </p>
                </div>
              )}
            {activeEntry.paymentDetails?.monthlyDeductionDay && (
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                  Monthly deduction
                </p>
                <p className="mt-1 font-semibold text-emerald-950 dark:text-emerald-50">
                  Day {activeEntry.paymentDetails.monthlyDeductionDay}
                </p>
              </div>
            )}
            {activeEntry.paymentDetails?.notes && (
              <p className="text-emerald-900 dark:text-emerald-100 sm:col-span-2">
                {activeEntry.paymentDetails.notes}
              </p>
            )}
          </div>
        ) : null}

        {(activeEntry.loginDetails?.url ||
          activeEntry.loginDetails?.email ||
          activeEntry.loginDetails?.username ||
          activeEntry.loginDetails?.notes) && (
          <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950">
            {activeEntry.loginDetails.url && (
              <a
                href={ensureHref(activeEntry.loginDetails.url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-2 text-blue-600 dark:text-blue-300"
              >
                <FiExternalLink className="shrink-0" />
                <span className="truncate">{activeEntry.loginDetails.url}</span>
              </a>
            )}
            {activeEntry.loginDetails.email && (
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{activeEntry.loginDetails.email}</span>
                <button
                  type="button"
                  className="text-gray-500 hover:text-blue-600"
                  onClick={() => copyText(activeEntry.loginDetails.email ?? "")}
                  aria-label="Copy login email"
                >
                  <FiCopy />
                </button>
              </div>
            )}
            {activeEntry.loginDetails.username && (
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{activeEntry.loginDetails.username}</span>
                <button
                  type="button"
                  className="text-gray-500 hover:text-blue-600"
                  onClick={() => copyText(activeEntry.loginDetails.username ?? "")}
                  aria-label="Copy username"
                >
                  <FiCopy />
                </button>
              </div>
            )}
            {activeEntry.loginDetails.notes && (
              <p className="text-gray-600 dark:text-gray-300">
                {activeEntry.loginDetails.notes}
              </p>
            )}
          </div>
        )}

        {activeEntry.hasSecrets && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-100">
                <FiKey className="shrink-0" />
                <span className="truncate">
                  {activeEntry.secretLabels.length} saved secret(s)
                </span>
              </div>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-medium text-white disabled:opacity-60"
                onClick={() => revealSecrets(activeEntry)}
                disabled={revealing}
              >
                <FiEye />
                Reveal
              </button>
            </div>
            {(revealedSecrets[activeEntry.id] ??
              activeEntry.secretLabels.map((secret) => ({
                ...secret,
                value: "••••••••",
              }))).map((secret) => (
              <div
                key={secret.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm dark:bg-gray-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{secret.label}</p>
                  <p className="truncate text-gray-500 dark:text-gray-400">
                    {secret.value}
                  </p>
                </div>
                {"value" in secret && secret.value !== "••••••••" && (
                  <button
                    type="button"
                    className="text-gray-500 hover:text-blue-600"
                    onClick={() => copyText(secret.value)}
                    aria-label={`Copy ${secret.label}`}
                  >
                    <FiCopy />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div>{renderRichContent(activeEntry.contentJson)}</div>
      </div>
    );
  };

  return (
    <SwipeShell refresh={() => loadEntries()} toRight="/">
      <HeaderComponent className={`${HOW_TO_SHELL_CLASS} sm:px-4`} title="How-To">
        {isDetailRoute ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-300"
                onClick={() => navigate("/how-to")}
              >
                <FiArrowLeft />
                Back
              </button>
              <h1 className="truncate text-xl font-bold">
                {activeEntry?.title || "How-To details"}
              </h1>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {detailLoading ? "Loading..." : statusMessage}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white shadow-sm disabled:opacity-60"
              onClick={openCreate}
            >
              <FiPlus />
              New
            </button>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold">How-To</h1>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {entries.length} shown · {statusMessage}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className={iconButtonClass}
                  onClick={() => loadEntries()}
                  disabled={loading}
                  aria-label="Refresh How-To items"
                >
                  <FiRefreshCw className={loading ? "animate-spin" : ""} />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white shadow-sm disabled:opacity-60"
                  onClick={openCreate}
                >
                  <FiPlus />
                  New
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_10rem_10rem_auto]">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void loadEntries();
                  }}
                  placeholder="Search"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className={inputClass}
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                className={inputClass}
                aria-label="Filter by tag"
              >
                <option value="">All tags</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white dark:bg-white dark:text-gray-950"
                onClick={() => loadEntries()}
              >
                <FiSearch />
                Search
              </button>
            </div>
          </>
        )}
      </HeaderComponent>

      <main
        className={`mx-auto grid min-h-screen grid-cols-1 gap-4 px-4 pb-28 pt-4 dark:text-white ${
          isDetailRoute
            ? "mt-28 max-w-md sm:max-w-2xl lg:max-w-3xl"
            : "mt-44 max-w-md sm:max-w-2xl lg:max-w-6xl"
        }`}
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {isDetailRoute ? (
          <section className="min-h-[24rem] rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {renderDetailContent()}
          </section>
        ) : (
          <section className="space-y-3">
            {loading && entries.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                Loading...
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                No How-To items found.
              </div>
            ) : (
              entries.map((entry) => {
                const active = howToId === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`w-full rounded-xl border p-4 text-left shadow-sm transition ${
                      active
                        ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                        : "border-gray-200 bg-white hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900"
                    }`}
                    onClick={() => openEntry(entry)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold">
                          {entry.title}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                          {entry.snippet || entry.summary || entry.contentPlainText}
                        </p>
                      </div>
                      {entry.hasSecrets && (
                        <FiKey className="h-4 w-4 shrink-0 text-amber-500" />
                      )}
                    </div>
                    {entry.paymentDetails?.totalAmount !== null &&
                      entry.paymentDetails?.totalAmount !== undefined && (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                          <FiCreditCard />
                          {formatAmount(
                            entry.paymentDetails.totalAmount,
                            entry.paymentDetails.currency
                          )}
                          {entry.paymentDetails.monthlyDeductionDay
                            ? ` · day ${entry.paymentDetails.monthlyDeductionDay}`
                            : ""}
                        </div>
                      )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {entry.category && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                          {entry.category}
                        </span>
                      )}
                      {entry.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-50 px-2 py-1 text-[11px] text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}

            {nextCursor && (
              <button
                type="button"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                onClick={() => loadEntries({ append: true, cursor: nextCursor })}
                disabled={loading}
              >
                Load more
              </button>
            )}
          </section>
        )}
      </main>

      {formOpen && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-gray-950 dark:text-white">
          <div className="mx-auto max-w-5xl space-y-4 pb-8">
            <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-gray-200 bg-slate-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">
                  {editingEntry ? "Edit How-To" : "New How-To"}
                </h2>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {editingEntry?.title || "Create knowledge base entry"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className={iconButtonClass}
                  onClick={() => setFormOpen(false)}
                  aria-label="Close editor"
                >
                  <FiX />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white shadow-sm disabled:opacity-60"
                  onClick={saveEntry}
                  disabled={saving}
                >
                  <FiSave />
                  Save
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Summary
                  </label>
                  <textarea
                    value={form.summary}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        summary: event.target.value,
                      }))
                    }
                    className={textareaClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Content
                  </label>
                  <RichTextEditor
                    key={editingEntry?.id ?? "new"}
                    value={form.contentJson}
                    onChange={(contentJson) =>
                      setForm((current) => ({ ...current, contentJson }))
                    }
                  />
                </div>
              </section>

              <aside className="space-y-4">
                <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Category
                    </label>
                    <input
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Tags
                    </label>
                    <input
                      value={form.tagsText}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          tagsText: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Keywords
                    </label>
                    <input
                      value={form.keywordsText}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          keywordsText: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                </section>

                <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FiCalendar />
                    Payment
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
                    <input
                      value={form.paymentTotalAmount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          paymentTotalAmount: event.target.value,
                        }))
                      }
                      placeholder="Total amount"
                      inputMode="decimal"
                      className={inputClass}
                    />
                    <input
                      value={form.paymentCurrency}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          paymentCurrency: event.target.value
                            .toUpperCase()
                            .slice(0, 8),
                        }))
                      }
                      placeholder="EUR"
                      className={inputClass}
                    />
                  </div>
                  <input
                    value={form.paymentDeductionDay}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        paymentDeductionDay: event.target.value.replace(
                          /\D+/g,
                          ""
                        ).slice(0, 2),
                      }))
                    }
                    placeholder="Deduction day each month"
                    inputMode="numeric"
                    className={inputClass}
                  />
                  <textarea
                    value={form.paymentNotes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        paymentNotes: event.target.value,
                      }))
                    }
                    placeholder="Payment notes"
                    className={textareaClass}
                  />
                </section>

                <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FiLink />
                    Login
                  </div>
                  <input
                    value={form.loginUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        loginUrl: event.target.value,
                      }))
                    }
                    placeholder="URL"
                    className={inputClass}
                  />
                  <input
                    value={form.loginEmail}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        loginEmail: event.target.value,
                      }))
                    }
                    placeholder="Email"
                    className={inputClass}
                  />
                  <input
                    value={form.loginUsername}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        loginUsername: event.target.value,
                      }))
                    }
                    placeholder="Username"
                    className={inputClass}
                  />
                  <textarea
                    value={form.loginNotes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        loginNotes: event.target.value,
                      }))
                    }
                    placeholder="Notes"
                    className={textareaClass}
                  />
                </section>

                <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <FiKey />
                      Secrets
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-600"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          secretsTouched: true,
                          secrets: [
                            ...current.secrets,
                            { label: "", value: "" },
                          ],
                        }))
                      }
                    >
                      Add
                    </button>
                  </div>

                  {editingEntry && !form.secretsTouched ? (
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      {editingEntry.secretLabels.length > 0 ? (
                        editingEntry.secretLabels.map((secret) => (
                          <div
                            key={secret.id}
                            className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-950"
                          >
                            {secret.label}
                          </div>
                        ))
                      ) : (
                        <p>No saved secrets.</p>
                      )}
                      <button
                        type="button"
                        className="text-xs font-medium text-blue-600"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            secretsTouched: true,
                            secrets: editingEntry.secretLabels.map((secret) => ({
                              id: secret.id,
                              label: secret.label,
                              value: "",
                            })),
                          }))
                        }
                      >
                        Replace saved secrets
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.secrets.map((secret, index) => (
                        <div
                          key={`${secret.id ?? "secret"}-${index}`}
                          className="space-y-2 rounded-lg border border-gray-200 p-2 dark:border-gray-800"
                        >
                          <input
                            value={secret.label}
                            onChange={(event) =>
                              updateSecret(index, { label: event.target.value })
                            }
                            placeholder="Label"
                            className={inputClass}
                          />
                          <input
                            value={secret.value}
                            onChange={(event) =>
                              updateSecret(index, { value: event.target.value })
                            }
                            placeholder="Value"
                            type="password"
                            className={inputClass}
                          />
                          <button
                            type="button"
                            className="text-xs font-medium text-red-600"
                            onClick={() => removeSecret(index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {form.secrets.length === 0 && (
                        <p className="text-sm text-gray-500">No secrets.</p>
                      )}
                    </div>
                  )}
                </section>
              </aside>
            </div>
          </div>
        </div>
      )}

      <FooterNav className={HOW_TO_SHELL_CLASS} />
    </SwipeShell>
  );
}
