// Adapted from interior.dev/inline-validation — motion/Tailwind removed.
// Zero-dependency port: same exported API, CSS transitions replace springs.
// Source: https://www.interior.dev/docs/inline-validation

import { useCallback, useEffect, useId, useRef, useState } from "react";
import "./inline-validation.css";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

const LINE = 16;

export type ValidationStatus = "idle" | "pending" | "valid" | "invalid";

export type Validator = (value: string) => string | null;

export type UseInlineValidationOptions = {
  value: string;
  validate: Validator;
  debounce?: number;
};

export type UseInlineValidationReturn = {
  status: ValidationStatus;
  error: string | null;
  message: string;
  touched: boolean;
  commit: () => void;
  reset: () => void;
  fieldProps: {
    onBlur: () => void;
    "aria-invalid": boolean;
  };
};

type Settled = {
  status: ValidationStatus;
  error: string | null;
  message: string;
};

const CLEAN: Settled = { status: "idle", error: null, message: "" };

export function useInlineValidation({
  value,
  validate,
  debounce = 400,
}: UseInlineValidationOptions): UseInlineValidationReturn {
  const [touched, setTouched] = useState(false);
  const [settled, setSettled] = useState<Settled>(CLEAN);

  const check = useRef(validate);
  const latest = useRef(value);

  useEffect(() => {
    check.current = validate;
    latest.current = value;
  });

  useEffect(() => {
    if (!touched) return;

    const next = check.current(value);
    const resolved: ValidationStatus = value.length > 0 ? "valid" : "idle";

    if (next === null) {
      setSettled((prev) =>
        prev.status === resolved && prev.error === null
          ? prev
          : { status: resolved, error: null, message: prev.message },
      );
      return;
    }

    setSettled((prev) =>
      prev.status === "invalid"
        ? prev
        : { status: "pending", error: null, message: prev.message },
    );

    const t = setTimeout(() => {
      setSettled((prev) =>
        prev.error === next
          ? prev
          : { status: "invalid", error: next, message: next },
      );
    }, debounce);

    return () => clearTimeout(t);
  }, [value, touched, debounce]);

  const commit = useCallback(() => {
    setTouched(true);
    const v = latest.current;
    const next = check.current(v);
    setSettled((prev) =>
      next === null
        ? {
            status: v.length > 0 ? "valid" : "idle",
            error: null,
            message: prev.message,
          }
        : { status: "invalid", error: next, message: next },
    );
  }, []);

  const reset = useCallback(() => {
    setTouched(false);
    setSettled(CLEAN);
  }, []);

  return {
    status: settled.status,
    error: settled.error,
    message: settled.message,
    touched,
    commit,
    reset,
    fieldProps: {
      onBlur: commit,
      "aria-invalid": settled.status === "invalid",
    },
  };
}

export type InlineValidationProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validate: Validator;
  hint?: string;
  id?: string;
  name?: string;
  type?: "text" | "email" | "password" | "tel" | "url" | "search";
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.ComponentProps<"input">["inputMode"];
  debounce?: number;
  reserveLines?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function InlineValidation({
  label,
  value,
  onChange,
  validate,
  hint,
  id,
  name,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  debounce = 400,
  reserveLines = 1,
  disabled = false,
  required = false,
  className = "",
}: InlineValidationProps) {
  const reduced = useReducedMotion();

  const auto = useId();
  const fieldId = id ?? `${auto}-field`;
  const hintId = `${auto}-hint`;
  const errorId = `${auto}-error`;

  const { status, error, message, fieldProps } = useInlineValidation({
    value,
    validate,
    debounce,
  });

  const invalid = status === "invalid";
  const valid = status === "valid";

  const described = [hint ? hintId : null, invalid ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const clamp = {
    display: "-webkit-box" as const,
    WebkitBoxOrient: "vertical" as const,
    WebkitLineClamp: reserveLines,
    overflow: "hidden" as const,
  };

  return (
    <div className={`iv ${className}`}>
      <label htmlFor={fieldId} className="iv-label">
        {label}
      </label>

      <div className="iv-field">
        <input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          required={required}
          aria-required={required || undefined}
          aria-describedby={described || undefined}
          onChange={(e) => onChange(e.target.value)}
          {...fieldProps}
          className={`iv-input${invalid ? " invalid" : ""}`}
        />

        <span className="iv-icons" aria-hidden>
          <svg
            viewBox="0 0 12 12"
            width="14"
            height="14"
            fill="none"
            className="iv-icon iv-valid"
            data-on={valid || undefined}
          >
            <path
              d="M2 6.3 4.7 9 10 3.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            viewBox="0 0 12 12"
            width="14"
            height="14"
            fill="none"
            className="iv-icon iv-bad"
            data-on={invalid || undefined}
          >
            <path
              d="M6 2v4.4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <rect
              x="5.15"
              y="8.4"
              width="1.7"
              height="1.7"
              rx="0.5"
              fill="currentColor"
            />
          </svg>
        </span>
      </div>

      <div
        className="iv-msgs"
        style={{ height: reserveLines * LINE }}
      >
        {hint ? (
          <p
            aria-hidden
            style={clamp}
            className="iv-hint"
            data-on={!invalid || undefined}
          >
            {hint}
          </p>
        ) : null}

        <p
          aria-hidden
          style={clamp}
          className="iv-error"
          data-on={invalid || undefined}
        >
          {error ?? message}
        </p>

        {hint ? (
          <span id={hintId} className="iv-sr">
            {hint}
          </span>
        ) : null}

        <span
          id={errorId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="iv-sr"
        >
          {error ?? ""}
        </span>
      </div>
    </div>
  );
}
