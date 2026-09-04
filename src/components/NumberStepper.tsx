import { useEffect, useState } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  ariaLabel,
  className = "",
}: {
  value: number;
  onChange(value: number): void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel: string;
  className?: string;
}) {
  const minimum = Math.ceil(min);
  const maximum = max === undefined ? undefined : Math.floor(max);
  const wholeStep = Math.max(1, Math.round(step));

  const clamp = (next: number) => {
    const safeNext = Number.isFinite(next) ? next : minimum;
    return Math.min(
      maximum ?? Number.POSITIVE_INFINITY,
      Math.max(minimum, Math.round(safeNext)),
    );
  };

  const [draft, setDraft] = useState(String(clamp(value)));

  useEffect(() => {
    setDraft(String(clamp(value)));
  }, [value, min, max]);

  const displayedValue = Number(draft);
  const currentValue = Number.isFinite(displayedValue) && draft.trim() !== ""
      ? displayedValue
      : Number.isFinite(value)
      ? clamp(value)
      : minimum;

  const commit = (next: number) => {
    const committed = clamp(next);
    setDraft(String(committed));
    onChange(committed);
  };

  return <div className={`flex items-center rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900 ${className}`}>
    <button type="button" disabled={currentValue <= minimum} onClick={() => commit(currentValue - wholeStep)} aria-label={`Decrease ${ariaLabel}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-100 disabled:opacity-30 dark:bg-gray-800"><FiMinus /></button>
    <input
      type="number"
      inputMode="numeric"
      min={minimum}
      max={maximum}
      step={wholeStep}
      value={draft}
      onChange={(event) => {
        const nextDraft = event.target.value;
        if (nextDraft.trim() === "") {
          setDraft("");
          return;
        }
        const next = Number(nextDraft);
        if (Number.isFinite(next)) {
          commit(next);
        }
      }}
      onBlur={() => commit(Number(draft))}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          commit(currentValue + wholeStep);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          commit(currentValue - wholeStep);
        }
      }}
      aria-label={ariaLabel}
      className="min-w-0 flex-1 bg-transparent px-1 text-center font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
    <button type="button" disabled={maximum !== undefined && currentValue >= maximum} onClick={() => commit(currentValue + wholeStep)} aria-label={`Increase ${ariaLabel}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white disabled:opacity-30"><FiPlus /></button>
  </div>;
}
