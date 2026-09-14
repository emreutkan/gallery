// Adapted from interior.dev/poll-results — motion/Tailwind removed.
// Zero-dependency port: same exported API. usePollResults is verbatim;
// each row's fill is a damped spring (stiffness 210, damping 34, mass 0.9)
// written imperatively — bigger shares travel further and land later,
// so the winner still lands last. The tick pop is CSS.
// Source: https://www.interior.dev/docs/poll-results

import { useCallback, useEffect, useRef, useState } from "react";
import "./poll-results.css";

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

// FILL = { stiffness: 210, damping: 34, mass: 0.9 }
const SPRING = { k: 210, c: 34, m: 0.9 };

/** Runs a damped spring from current toward target. Returns a stopper. */
function springTo(
  get: () => number,
  set: (p: number) => void,
  target: number,
  onDone: () => void,
): () => void {
  let p = get();
  let v = 0;
  let last = performance.now();
  let raf = 0;

  const step = (now: number) => {
    const dt = Math.min(0.064, (now - last) / 1000 || 0.016);
    last = now;
    const f = -SPRING.k * (p - target) - SPRING.c * v;
    v += (f / SPRING.m) * dt;
    p += v * dt;
    if (Math.abs(p - target) < 0.001 && Math.abs(v) < 0.001) {
      set(target);
      onDone();
      return;
    }
    set(p);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type UsePollResultsOptions = {
  options: PollOption[];
  value?: string | null;
  defaultValue?: string | null;
  onVote?: (id: string) => void;
};

export function usePollResults({
  options,
  value,
  defaultValue = null,
  onVote,
}: UsePollResultsOptions) {
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const controlled = value !== undefined;
  const chosen = controlled ? value : internal;

  const emit = useRef(onVote);
  emit.current = onVote;

  const vote = useCallback(
    (id: string) => {
      if (chosen !== null) return;
      if (!controlled) setInternal(id);
      emit.current?.(id);
    },
    [chosen, controlled],
  );

  const total = options.reduce((sum, o) => sum + Math.max(0, o.votes), 0);
  const top = options.reduce((best, o) => (o.votes > best ? o.votes : best), 0);

  const rows = options.map((option) => ({
    ...option,
    share: total > 0 ? Math.max(0, option.votes) / total : 0,
    winner: total > 0 && option.votes === top,
    mine: option.id === chosen,
  }));

  return {
    rows,
    total,
    chosen,
    revealed: chosen !== null,
    vote,
  };
}

const Tick = (
  <svg viewBox="0 0 256 256" width="11" height="11" fill="none" aria-hidden>
    <polyline
      points="216 72 104 184 48 128"
      stroke="currentColor"
      strokeWidth="26"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type RowProps = {
  label: string;
  share: number;
  winner: boolean;
  mine: boolean;
  revealed: boolean;
  reduced: boolean;
  onPick: () => void;
};

function Row({ label, share, winner, mine, revealed, reduced, onPick }: RowProps) {
  const fill = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const set = (p: number) => {
      progress.current = p;
      const node = fill.current;
      if (node) {
        node.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0 round 5px)`;
      }
      const out = readout.current;
      if (out) {
        const next = `${Math.round(p * 100)}%`;
        if (out.textContent !== next) out.textContent = next;
      }
    };

    if (!revealed) {
      set(0);
      setLanded(false);
      return;
    }
    if (reduced) {
      set(share);
      setLanded(true);
      return;
    }
    return springTo(() => progress.current, set, share, () => setLanded(true));
  }, [revealed, share, reduced]);

  return (
    // eslint-disable-next-line jsx-a11y/control-has-associated-label
    <button
      type="button"
      onClick={onPick}
      aria-disabled={revealed}
      aria-pressed={revealed ? mine : undefined}
      className={`pr-row${revealed ? " revealed" : ""}`}
    >
      <span
        ref={fill}
        aria-hidden
        className={`pr-fill${mine ? " mine" : ""}`}
        style={{ clipPath: "inset(0 100% 0 0 round 5px)" }}
      />
      <span className="pr-inner">
        <span
          className={`pr-label${revealed && winner ? " winner" : ""}`}
        >
          {label}
        </span>
        <span className="pr-tick">
          {revealed && winner && landed ? (
            <span className="pr-tick-pop">{Tick}</span>
          ) : null}
        </span>
        <span className="pr-pct">
          <span aria-hidden className="pr-pct-pad">
            100%
          </span>
          <span
            ref={readout}
            aria-hidden
            className="pr-pct-val"
            data-on={revealed || undefined}
          >
            0%
          </span>
        </span>
      </span>
    </button>
  );
}

export type PollResultsProps = UsePollResultsOptions & {
  label: string;
  className?: string;
};

export function PollResults({
  options,
  value,
  defaultValue,
  onVote,
  label,
  className = "",
}: PollResultsProps) {
  const poll = usePollResults({ options, value, defaultValue, onVote });
  const reduced = useReducedMotion();

  const [spoken, setSpoken] = useState("");
  useEffect(() => {
    if (!poll.revealed) return;
    const winner = poll.rows.find((r) => r.winner);
    const t = setTimeout(
      () =>
        setSpoken(
          winner
            ? `Results: ${winner.label} leads with ${Math.round(winner.share * 100)} percent of ${poll.total} votes`
            : `Results shown, ${poll.total} votes`,
        ),
      700,
    );
    return () => clearTimeout(t);
  }, [poll.revealed, poll.rows, poll.total]);

  return (
    <div
      role="group"
      aria-label={label}
      className={`pr${className ? ` ${className}` : ""}`}
    >
      <p className="pr-question">{label}</p>
      <div className="pr-rows">
        {poll.rows.map((row) => (
          <Row
            key={row.id}
            label={row.label}
            share={row.share}
            winner={row.winner}
            mine={row.mine}
            revealed={poll.revealed}
            reduced={reduced}
            onPick={() => poll.vote(row.id)}
          />
        ))}
      </div>
      <p className="pr-total">
        <span data-on={poll.revealed || undefined}>
          {poll.total.toLocaleString("en-US")} votes
        </span>
      </p>
      <span role="status" className="pr-sr">
        {spoken}
      </span>
    </div>
  );
}
