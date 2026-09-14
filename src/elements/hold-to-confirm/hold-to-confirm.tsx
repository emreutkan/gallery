// Adapted from interior.dev/hold-to-confirm — motion/Tailwind removed.
// Zero-dependency port: the sweep is driven by the hold loop's own elapsed
// clock (progressF), so the overlay can never desync from the gesture.
// Source: https://www.interior.dev/docs/hold-to-confirm

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./hold-to-confirm.css";

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

export type HoldPhase = "idle" | "holding" | "releasing" | "committed";

export type UseHoldToConfirmOptions = {
  onConfirm: () => void;
  onAbort?: () => void;
  duration?: number;
  steps?: number;
  releaseRate?: number;
  moveTolerance?: number;
  haptic?: boolean;
  disabled?: boolean;
};

export function useHoldToConfirm({
  onConfirm,
  onAbort,
  duration = 1800,
  steps = 20,
  releaseRate = 2.5,
  moveTolerance = 10,
  haptic = true,
  disabled = false,
}: UseHoldToConfirmOptions) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<HoldPhase>("idle");
  const [progressF, setProgressF] = useState(0);

  const phaseRef = useRef<HoldPhase>("idle");
  const down = useRef(false);
  const elapsed = useRef(0);
  const last = useRef(0);
  const raf = useRef(0);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const confirm = useRef(onConfirm);
  confirm.current = onConfirm;
  const abort = useRef(onAbort);
  abort.current = onAbort;

  const move = useCallback((next: HoldPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    down.current = false;
    elapsed.current = 0;
    origin.current = null;
    setStep(0);
    setProgressF(0);
    move("idle");
  }, [move]);

  const begin = useCallback(
    (point?: { x: number; y: number }) => {
      if (disabled) return;
      if (phaseRef.current === "committed" || phaseRef.current === "holding") {
        return;
      }

      origin.current = point ?? null;
      down.current = true;
      move("holding");
      if (raf.current) return;

      last.current = performance.now();

      const loop = (now: number) => {
        const dt = Math.min(64, now - last.current);
        last.current = now;
        elapsed.current += down.current ? dt : -dt * releaseRate;

        if (elapsed.current >= duration) {
          raf.current = 0;
          elapsed.current = duration;
          down.current = false;
          origin.current = null;
          setStep(steps);
          setProgressF(1);
          move("committed");
          if (haptic) navigator.vibrate?.(14);
          confirm.current();
          return;
        }

        if (elapsed.current <= 0) {
          raf.current = 0;
          elapsed.current = 0;
          origin.current = null;
          setStep(0);
          setProgressF(0);
          move("idle");
          return;
        }

        const s = Math.min(
          steps,
          Math.floor((elapsed.current / duration) * steps),
        );
        setStep((prev) => (prev === s ? prev : s));
        setProgressF(Math.min(1, elapsed.current / duration));
        raf.current = requestAnimationFrame(loop);
      };

      raf.current = requestAnimationFrame(loop);
    },
    [disabled, duration, steps, releaseRate, haptic, move],
  );

  const release = useCallback(() => {
    if (phaseRef.current !== "holding") return;
    down.current = false;
    origin.current = null;
    move("releasing");
    abort.current?.();
  }, [move]);

  useEffect(() => {
    const bail = () => release();
    const onVisibility = () => {
      if (document.hidden) release();
    };
    window.addEventListener("blur", bail);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", bail);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [release]);

  const bind = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      begin({ x: e.clientX, y: e.clientY });
    },
    onPointerMove: (e: React.PointerEvent) => {
      const from = origin.current;
      if (phaseRef.current !== "holding" || !from) return;
      if (Math.hypot(e.clientX - from.x, e.clientY - from.y) > moveTolerance) {
        release();
      }
    },
    onPointerUp: release,
    onPointerCancel: release,
    onPointerLeave: release,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (phaseRef.current === "holding" || phaseRef.current === "releasing") {
          e.preventDefault();
          reset();
        }
        return;
      }
      if (e.repeat) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        begin();
      }
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") release();
    },
    onBlur: release,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      if (phaseRef.current === "committed") e.stopPropagation();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };

  return {
    bind,
    step,
    steps,
    phase,
    progress: step / steps,
    progressF,
    reset,
  };
}

export type HoldToConfirmProps = {
  onConfirm: () => void;
  children: ReactNode;
  onAbort?: () => void;
  confirmLabel?: string;
  duration?: number;
  resetAfter?: number;
  steps?: number;
  releaseRate?: number;
  disabled?: boolean;
  className?: string;
};

export function HoldToConfirm({
  onConfirm,
  children,
  onAbort,
  confirmLabel = "Confirmed",
  duration = 1800,
  resetAfter = 1600,
  steps = 20,
  releaseRate = 2.5,
  disabled = false,
  className = "",
}: HoldToConfirmProps) {
  const { bind, phase, progressF, reset } = useHoldToConfirm({
    onConfirm,
    onAbort,
    duration,
    steps,
    releaseRate,
    disabled,
  });

  const reduced = useReducedMotion();
  const hintId = useId();

  const committed = phase === "committed";
  const seconds = Math.round(duration / 100) / 10;

  useEffect(() => {
    if (phase !== "committed" || resetAfter <= 0) return;
    const back = setTimeout(reset, resetAfter);
    return () => clearTimeout(back);
  }, [phase, resetAfter, reset]);

  // Under reduced motion the sweep is binary — full while held, empty at rest.
  const swept = reduced
    ? phase === "holding" || committed
      ? 1
      : 0
    : progressF;

  return (
    <button
      type="button"
      aria-disabled={disabled || committed}
      aria-describedby={hintId}
      {...bind}
      style={{ touchAction: "manipulation" }}
      className={`htc ${disabled ? "disabled" : ""} ${className}`}
    >
      <Faces committed={committed} confirmLabel={confirmLabel}>
        {children}
      </Faces>

      <span
        aria-hidden
        className="htc-sweep"
        style={{ clipPath: `inset(0 ${(1 - swept) * 100}% 0 0)` }}
      >
        <Faces committed={committed} confirmLabel={confirmLabel}>
          {children}
        </Faces>
      </span>

      <span id={hintId} className="htc-sr">
        Press and hold for {seconds} seconds to confirm. Releasing early cancels
        and nothing happens.
      </span>

      <span role="status" aria-live="polite" className="htc-sr">
        {committed ? confirmLabel : ""}
      </span>
    </button>
  );
}

function Faces({
  committed,
  confirmLabel,
  children,
}: {
  committed: boolean;
  confirmLabel: string;
  children: ReactNode;
}) {
  return (
    <span className="htc-faces">
      <span className="htc-face" data-on={!committed || undefined}>
        {children}
      </span>
      <span className="htc-face" data-on={committed || undefined}>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 6.4 4.7 8.6 9.5 3.5" />
        </svg>
        {confirmLabel}
      </span>
    </span>
  );
}
