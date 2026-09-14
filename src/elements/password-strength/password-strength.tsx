// Adapted from interior.dev/password-strength — motion/Tailwind removed.
// Zero-dependency port: same exported API, CSS transitions replace springs.
// Source: https://www.interior.dev/docs/password-strength

import { useEffect, useId, useMemo, useState } from "react";
import "./password-strength.css";

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

const COMMON =
  /^(?:password|passw0rd|qwerty|letmein|welcome|admin|iloveyou|monkey|dragon|abc123|111111|123123|123456)/i;
const RUN = /(.)\1{3,}/;
const RUN_UP =
  /(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|qwer|wert|erty|asdf)/i;
const SYMBOL = /[!-/:-@[-`{-~]/;

export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export type EvaluatedRule = PasswordRule & { met: boolean };

export type UsePasswordStrengthOptions = {
  rules?: readonly PasswordRule[];
  labels?: readonly string[];
  announceDelay?: number;
};

export type PasswordStrengthState = {
  score: number;
  max: number;
  label: string;
  rules: EvaluatedRule[];
  guessable: boolean;
  announcement: string;
};

export const defaultPasswordRules: readonly PasswordRule[] = [
  { id: "length", label: "12 characters or more", test: (v) => v.length >= 12 },
  {
    id: "case",
    label: "Upper and lower case",
    test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  { id: "digit", label: "A number", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "A symbol", test: (v) => SYMBOL.test(v) },
];

const defaultLabels = ["Empty", "Weak", "Fair", "Good", "Strong"] as const;

export function usePasswordStrength(
  value: string,
  {
    rules = defaultPasswordRules,
    labels = defaultLabels,
    announceDelay = 700,
  }: UsePasswordStrengthOptions = {},
): PasswordStrengthState {
  const state = useMemo(() => {
    const evaluated = rules.map((rule) => ({ ...rule, met: rule.test(value) }));
    const passed = evaluated.reduce((n, r) => n + (r.met ? 1 : 0), 0);
    const guessable =
      value.length > 0 &&
      (COMMON.test(value) || RUN.test(value) || RUN_UP.test(value));

    const score =
      value.length === 0
        ? 0
        : guessable
          ? 1
          : Math.min(rules.length, Math.max(1, passed));

    const label = labels[Math.min(score, labels.length - 1)] ?? "";
    const unmet = evaluated.filter((r) => !r.met);

    const announcement =
      value.length === 0
        ? ""
        : [
              `Password strength ${label.toLowerCase()}.`,
              guessable ? "This is a commonly guessed pattern." : "",
              unmet.length === 0
                ? "All requirements met."
                : `Still needed: ${unmet
                    .map((r) => r.label.toLowerCase())
                    .join(", ")}.`,
            ]
              .filter(Boolean)
              .join(" ");

    return {
      score,
      max: rules.length,
      label,
      rules: evaluated,
      guessable,
      announcement,
    };
  }, [value, rules, labels]);

  const [settled, setSettled] = useState("");

  useEffect(() => {
    if (state.announcement === "") {
      setSettled("");
      return;
    }
    const id = setTimeout(() => setSettled(state.announcement), announceDelay);
    return () => clearTimeout(id);
  }, [state.announcement, announceDelay]);

  return { ...state, announcement: settled };
}

export type PasswordStrengthProps = {
  value: string;
  rules?: readonly PasswordRule[];
  labels?: readonly string[];
  announceDelay?: number;
  showRules?: boolean;
  className?: string;
};

function RuleList({ evaluated }: { evaluated: readonly EvaluatedRule[] }) {
  return (
    <ul className="ps-rules">
      {evaluated.map((rule) => (
        <li key={rule.id} className="ps-rule">
          <span className="ps-box">
            <span className="ps-fill" data-on={rule.met || undefined} />
            <svg
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden
              className="ps-check"
              data-on={rule.met || undefined}
            >
              <path
                d="M2 6.2 4.7 8.9 10 3.3"
                stroke="currentColor"
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className={`ps-rule-label${rule.met ? " met" : ""}`}>
            {rule.label}
          </span>
          <span className="ps-sr">{rule.met ? "met" : "not met"}</span>
        </li>
      ))}
    </ul>
  );
}

type Tone = "none" | "danger" | "caution" | "safe";

function toneFor(score: number, max: number): Tone {
  if (score === 0) return "none";
  const ratio = score / max;
  if (ratio <= 0.34) return "danger";
  if (ratio <= 0.67) return "caution";
  return "safe";
}

export function PasswordStrength({
  value,
  rules = defaultPasswordRules,
  labels = defaultLabels,
  announceDelay = 700,
  showRules = true,
  className = "",
}: PasswordStrengthProps) {
  const {
    score,
    max,
    label,
    rules: evaluated,
    guessable,
    announcement,
  } = usePasswordStrength(value, { rules, labels, announceDelay });
  const reduced = useReducedMotion();
  const tone = toneFor(score, max);

  return (
    <div className={`ps${reduced ? " reduced" : ""} ${className}`}>
      <div
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={score}
        aria-valuetext={label}
        className="ps-meter"
        style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: max }, (_, i) => (
          <div key={i} className="ps-track">
            <span
              className={`ps-seg ps-${tone}`}
              style={{
                transform: `scaleX(${i < score ? 1 : 0})`,
                transitionDelay: i < score ? `${i * 30}ms` : "0ms",
              }}
            />
          </div>
        ))}
      </div>

      <div className="ps-row">
        <span className="ps-labels">
          {labels.map((text, i) => (
            <span
              key={text}
              aria-hidden
              className={`ps-label ps-text-${tone}`}
              data-on={i === Math.min(score, labels.length - 1) || undefined}
            >
              {text}
            </span>
          ))}
        </span>

        <span
          aria-hidden
          className="ps-guess"
          data-on={guessable || undefined}
        >
          Commonly guessed
        </span>
      </div>

      {showRules && <RuleList evaluated={evaluated} />}

      <p aria-live="polite" className="ps-sr">
        {announcement}
      </p>
    </div>
  );
}

export type PasswordInfoProps = {
  value: string;
  rules?: readonly PasswordRule[];
  className?: string;
};

/**
 * An (i) button meant to sit inside the right side of a password field
 * (.ps-field > .ps-input + <PasswordInfo/>). The requirement checklist
 * appears in a popover on hover or keyboard focus, and checks off live.
 */
export function PasswordInfo({
  value,
  rules = defaultPasswordRules,
  className = "",
}: PasswordInfoProps) {
  const { rules: evaluated } = usePasswordStrength(value, { rules });
  const id = useId();

  return (
    <span className={`ps-info-wrap${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="ps-info"
        aria-label="Password requirements"
        aria-describedby={id}
      >
        <svg viewBox="0 0 12 12" width="12" height="12" fill="none" aria-hidden>
          <circle cx="6" cy="6" r="5.2" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M6 5.5v2.6"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="6" cy="3.5" r="0.8" fill="currentColor" />
        </svg>
      </button>
      <span className="ps-pop" id={id} role="tooltip">
        <RuleList evaluated={evaluated} />
      </span>
    </span>
  );
}
