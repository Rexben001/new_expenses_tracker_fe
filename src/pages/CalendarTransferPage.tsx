import { useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClipboard,
  FiSend,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import { useItemContext } from "../hooks/useItemContext";
import {
  acceptCalendarTransfer,
  createCalendarTransfer,
  getErrorMessage,
  previewCalendarTransfer,
  type CalendarTransferCode,
  type CalendarTransferConflictPolicy,
  type CalendarTransferMode,
  type CalendarTransferPreview,
  type CalendarTransferResult,
} from "../services/api";
import { isAdminEmail } from "../services/admin";
import { tokenStore } from "../services/tokenStore";

const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900";
const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60";

export function CalendarTransferPage() {
  const { user, fetchUser, getSubAccountId } = useItemContext();
  const navigate = useNavigate();
  const canSend = isAdminEmail(user.email) || Boolean(user.calendarEnabled);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [mode, setMode] = useState<CalendarTransferMode>("copy");
  const [conflictPolicy, setConflictPolicy] =
    useState<CalendarTransferConflictPolicy>("merge");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [transferCode, setTransferCode] = useState<CalendarTransferCode>();
  const [acceptCode, setAcceptCode] = useState("");
  const [preview, setPreview] = useState<CalendarTransferPreview>();
  const [accepted, setAccepted] = useState<CalendarTransferResult>();
  const [sending, setSending] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const sendTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError("");
    setTransferCode(undefined);
    try {
      const subId = await getSubAccountId();
      const result = await createCalendarTransfer(
        {
          recipientEmail: recipientEmail.trim(),
          mode,
          conflictPolicy,
          ...(dateFrom ? { dateFrom } : {}),
          ...(dateTo ? { dateTo } : {}),
        },
        subId
      );
      setTransferCode(result);
    } catch (value) {
      setError(getErrorMessage(value, "Could not create the transfer."));
    } finally {
      setSending(false);
    }
  };

  const reviewTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    setReviewing(true);
    setError("");
    setAccepted(undefined);
    try {
      setPreview(await previewCalendarTransfer(acceptCode.trim()));
    } catch (value) {
      setPreview(undefined);
      setError(getErrorMessage(value, "Could not review the transfer."));
    } finally {
      setReviewing(false);
    }
  };

  const receiveTransfer = async () => {
    setAccepting(true);
    setError("");
    try {
      const result = await acceptCalendarTransfer(acceptCode.trim());
      if (user.accountType === "Sub") {
        await tokenStore.remove("subAccountId");
      }
      await fetchUser();
      setAccepted(result);
      setPreview(undefined);
      setAcceptCode("");
    } catch (value) {
      setError(getErrorMessage(value, "Could not accept the transfer."));
    } finally {
      setAccepting(false);
    }
  };

  const copyCode = async () => {
    if (!transferCode) return;
    try {
      await navigator.clipboard.writeText(transferCode.code);
      setCopyMessage("Code copied.");
    } catch {
      setCopyMessage("Copy the code shown above.");
    }
  };

  return (
    <SwipeShell toRight="/settings" refresh={Promise.resolve}>
      <HeaderComponent>
        <div className="flex items-center gap-3 pb-2">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-bold">Transfer calendar</h1>
            <p className="text-xs text-gray-500">Between registered accounts</p>
          </div>
        </div>
      </HeaderComponent>

      <main className="mx-auto min-h-screen max-w-md space-y-4 px-4 pb-32 pt-[calc(var(--app-header-height,6rem)+1rem)] dark:text-white">
        {error && (
          <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {canSend && (
          <section className={cardClass}>
            <div className="mb-4">
              <h2 className="font-semibold">Send calendar</h2>
              <p className="mt-1 text-sm text-gray-500">
                The code only works for the recipient email and expires after 48 hours.
              </p>
            </div>

            <form className="space-y-4" onSubmit={sendTransfer}>
              <label className="block text-sm font-medium">
                Recipient’s registered email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  className={inputClass}
                  placeholder="name@example.com"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Action
                  <select value={mode} onChange={(event) => setMode(event.target.value as CalendarTransferMode)} className={inputClass}>
                    <option value="copy">Copy</option>
                    <option value="move">Move</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Duplicate dates
                  <select value={conflictPolicy} onChange={(event) => setConflictPolicy(event.target.value as CalendarTransferConflictPolicy)} className={inputClass}>
                    <option value="merge">Merge</option>
                    <option value="skip">Skip</option>
                    <option value="replace">Replace</option>
                  </select>
                </label>
              </div>

              {mode === "move" && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  Move removes successfully transferred entries from this account after the recipient accepts.
                </p>
              )}

              <details className="rounded-xl border border-gray-200 dark:border-gray-700">
                <summary className="cursor-pointer px-3 py-3 text-sm font-medium">Optional date range</summary>
                <div className="grid grid-cols-2 gap-3 border-t border-gray-200 p-3 dark:border-gray-700">
                  <label className="text-xs font-medium">From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className={inputClass} /></label>
                  <label className="text-xs font-medium">To<input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className={inputClass} /></label>
                </div>
              </details>

              <button type="submit" disabled={sending} className={`${buttonClass} w-full`}>
                <FiSend /> {sending ? "Creating…" : `Create ${mode} code`}
              </button>
            </form>

            {transferCode && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">One-time transfer code</p>
                <p className="my-2 break-all font-mono text-xl font-bold tracking-wider text-emerald-950 dark:text-emerald-50">{transferCode.code}</p>
                <p className="text-xs text-emerald-800 dark:text-emerald-200">
                  {transferCode.entryCount} entries · for {transferCode.recipientEmail}
                </p>
                <button type="button" onClick={copyCode} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm dark:bg-gray-900 dark:text-emerald-100">
                  <FiClipboard /> Copy code
                </button>
                {copyMessage && <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">{copyMessage}</p>}
              </div>
            )}
          </section>
        )}

        <section className={cardClass}>
          <div className="mb-4">
            <h2 className="font-semibold">Receive calendar</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sign in with the invited email, then enter the sender’s code.
            </p>
          </div>
          <form className="space-y-3" onSubmit={reviewTransfer}>
            <label className="block text-sm font-medium">
              Transfer code
              <input
                required
                autoCapitalize="characters"
                autoComplete="one-time-code"
                value={acceptCode}
                onChange={(event) => {
                  setAcceptCode(event.target.value.toUpperCase());
                  setPreview(undefined);
                  setAccepted(undefined);
                }}
                className={`${inputClass} font-mono uppercase tracking-wider`}
                placeholder="XXXX-XXXX-XXXX"
              />
            </label>
            <button type="submit" disabled={reviewing} className={`${buttonClass} w-full`}>
              <FiCheckCircle /> {reviewing ? "Checking…" : "Review transfer"}
            </button>
          </form>

          {preview && (
            <div className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Transfer details</p>
                <p className="mt-1 font-semibold">From {preview.sourceEmail}</p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-blue-600 dark:text-blue-300">Entries</dt><dd className="font-semibold">{preview.entryCount}</dd></div>
                <div><dt className="text-blue-600 dark:text-blue-300">Action</dt><dd className="font-semibold capitalize">{preview.mode}</dd></div>
                <div><dt className="text-blue-600 dark:text-blue-300">Duplicate dates</dt><dd className="font-semibold capitalize">{preview.conflictPolicy}</dd></div>
                <div><dt className="text-blue-600 dark:text-blue-300">Date range</dt><dd className="font-semibold">{preview.dateFrom || "All"}{preview.dateTo ? ` – ${preview.dateTo}` : ""}</dd></div>
              </dl>
              {preview.conflictPolicy === "replace" && (
                <p className="rounded-lg bg-red-100 p-2 text-xs font-medium text-red-800 dark:bg-red-950/60 dark:text-red-100">
                  Replace will delete your existing entries on matching dates.
                </p>
              )}
              <button type="button" onClick={() => void receiveTransfer()} disabled={accepting} className={`${buttonClass} w-full`}>
                <FiCheckCircle /> {accepting ? "Accepting…" : `Accept and ${preview.mode}`}
              </button>
            </div>
          )}

          {accepted && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
              <p className="font-semibold">{accepted.message}</p>
              <p className="mt-1 text-xs">
                {accepted.copiedCount} transferred{accepted.skippedCount ? ` · ${accepted.skippedCount} skipped` : ""}
              </p>
              <Link to="/calendar" className="mt-3 inline-flex rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">
                Open calendar
              </Link>
            </div>
          )}
        </section>

        <p className="px-2 text-xs text-gray-500">
          Calendar transfers may include client names, contact information, prices, and appointment notes. Only share a code with its intended recipient.
        </p>
      </main>
      <FooterNav />
    </SwipeShell>
  );
}
