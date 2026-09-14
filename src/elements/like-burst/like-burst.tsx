// Adapted from interior.dev/like-burst — motion/Tailwind removed.
// Zero-dependency port: same exported API, CSS keyframes replace springs.
// Source: https://www.interior.dev/docs/like-burst

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import "./like-burst.css";

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

const HEART =
  "M12 20.3 4.3 12.6a4.8 4.8 0 0 1 6.8-6.8l.9.9.9-.9a4.8 4.8 0 0 1 6.8 6.8Z";

const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const h = (((i + 1) * 2654435761) % 997) / 997;
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2 + (h - 0.5) * 0.4;
  const distance = 13 + h * 9;
  return {
    x: Math.round(Math.cos(angle) * distance * 10) / 10,
    y: Math.round(Math.sin(angle) * distance * 10) / 10,
    size: h > 0.5 ? 4 : 3,
    delay: Math.round(h * 50) / 1000,
  };
});

const DEFAULT_FORMAT = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export type LikeCommit = (
  liked: boolean,
  signal: AbortSignal,
) => Promise<unknown>;

export type LikeBurstHandle = {
  toggle: () => void;
};

export type UseOptimisticLikeOptions = {
  initialLiked?: boolean;
  initialCount?: number;
  onCommit?: LikeCommit;
  onError?: (error: unknown) => void;
  settle?: number;
};

export type OptimisticLike = {
  liked: boolean;
  count: number;
  base: number;
  pending: boolean;
  burst: number;
  settled: { liked: boolean; count: number };
  toggle: () => void;
};

export function useOptimisticLike({
  initialLiked = false,
  initialCount = 0,
  onCommit,
  onError,
  settle = 400,
}: UseOptimisticLikeOptions = {}): OptimisticLike {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [burst, setBurst] = useState(0);
  const [settled, setSettled] = useState({
    liked: initialLiked,
    count: initialCount,
  });

  const likedNow = useRef(initialLiked);
  const countNow = useRef(initialCount);
  const truth = useRef({ liked: initialLiked, count: initialCount });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const seq = useRef(0);

  const commit = useRef(onCommit);
  commit.current = onCommit;
  const failed = useRef(onError);
  failed.current = onError;

  const flush = useCallback(() => {
    timer.current = null;
    inFlight.current?.abort();
    inFlight.current = null;
    seq.current += 1;

    const intent = likedNow.current;

    if (intent === truth.current.liked) {
      countNow.current = truth.current.count;
      setLiked(truth.current.liked);
      setCount(truth.current.count);
      setPending(false);
      return;
    }

    const target = { liked: intent, count: countNow.current };
    const run = commit.current;

    if (!run) {
      truth.current = target;
      setSettled(target);
      setPending(false);
      return;
    }

    const controller = new AbortController();
    const id = seq.current;
    inFlight.current = controller;
    setPending(true);

    run(intent, controller.signal).then(
      () => {
        if (id !== seq.current) return;
        inFlight.current = null;
        truth.current = target;
        setSettled(target);
        setPending(false);
      },
      (error: unknown) => {
        if (id !== seq.current) return;
        inFlight.current = null;
        likedNow.current = truth.current.liked;
        countNow.current = truth.current.count;
        setLiked(truth.current.liked);
        setCount(truth.current.count);
        setPending(false);
        failed.current?.(error);
      },
    );
  }, []);

  const toggle = useCallback(() => {
    const next = !likedNow.current;
    likedNow.current = next;
    countNow.current += next ? 1 : -1;

    setLiked(next);
    setCount(countNow.current);
    setPending(true);
    if (next) setBurst((b) => b + 1);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, settle);
  }, [flush, settle]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      seq.current += 1;
      inFlight.current?.abort();
      inFlight.current = null;
    },
    [],
  );

  return {
    liked,
    count,
    base: liked ? count - 1 : count,
    pending,
    burst,
    settled,
    toggle,
  };
}

/* Number roll: the old count slides out downward while the new one enters
   from above — AnimatePresence replaced by a keyed exiting sibling. */
function RollNumber({ value, reduced }: { value: string; reduced: boolean }) {
  const [state, setState] = useState({ v: value, p: null as string | null });
  useEffect(() => {
    setState((s) => (s.v === value ? s : { v: value, p: s.v }));
  }, [value]);
  return (
    <>
      {state.p !== null && (
        <span
          key={state.p}
          className={`lk-num lk-out${reduced ? " still" : ""}`}
        >
          {state.p}
        </span>
      )}
      <span
        key={state.v}
        className={`lk-num${state.p !== null ? " lk-in" : ""}${reduced ? " still" : ""}`}
      >
        {state.v}
      </span>
    </>
  );
}

export type LikeBurstProps = {
  initialLiked?: boolean;
  initialCount?: number;
  onCommit?: LikeCommit;
  onError?: (error: unknown) => void;
  onToggle?: (liked: boolean) => void;
  settle?: number;
  label?: string;
  activeLabel?: string;
  format?: (value: number) => string;
  disabled?: boolean;
  className?: string;
  ref?: React.Ref<LikeBurstHandle>;
};

export function LikeBurst({
  initialLiked = false,
  initialCount = 0,
  onCommit,
  onError,
  onToggle,
  settle = 400,
  label = "Like",
  activeLabel = "Liked",
  format = DEFAULT_FORMAT,
  disabled = false,
  className = "",
  ref,
}: LikeBurstProps) {
  const reduced = useReducedMotion();
  const { liked, count, base, pending, burst, settled, toggle } =
    useOptimisticLike({ initialLiked, initialCount, onCommit, onError, settle });

  useImperativeHandle(ref, () => ({ toggle }), [toggle]);

  const low = format(base);
  const high = format(base + 1);
  const widest = high.length >= low.length ? high : low;
  const shown = format(count);

  return (
    <span className={`lk ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={liked}
        aria-busy={pending}
        aria-label={label}
        onClick={() => {
          toggle();
          onToggle?.(!liked);
        }}
        style={{ touchAction: "manipulation" }}
        className="lk-btn"
      >
        <span aria-hidden className="lk-heart">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinejoin="round"
            className="lk-icon lk-outline"
            data-on={!liked || undefined}
          >
            <path d={HEART} />
          </svg>

          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="lk-icon lk-filled"
            data-on={liked || undefined}
          >
            <path d={HEART} />
          </svg>

          {!reduced && burst > 0 ? (
            <span key={burst} className="lk-sparks">
              {SPARKS.map((spark, i) => (
                <span
                  key={i}
                  className="lk-spark"
                  style={
                    {
                      width: spark.size,
                      height: spark.size,
                      marginLeft: -spark.size / 2,
                      marginTop: -spark.size / 2,
                      "--sx": `${spark.x}px`,
                      "--sy": `${spark.y}px`,
                      animationDelay: `${spark.delay}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </span>
          ) : null}
        </span>

        <span aria-hidden className="lk-labels">
          <span data-on={!liked || undefined}>{label}</span>
          <span data-on={liked || undefined}>{activeLabel}</span>
        </span>

        <span aria-hidden className="lk-count">
          <span className="lk-ghost">{widest}</span>
          <RollNumber value={shown} reduced={reduced} />
        </span>
      </button>

      <span role="status" aria-live="polite" className="lk-sr">
        {`${format(settled.count)} likes, ${settled.liked ? "liked" : "not liked"}`}
      </span>
    </span>
  );
}
