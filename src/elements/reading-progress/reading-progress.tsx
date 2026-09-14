// Adapted from interior.dev/reading-progress — motion/Tailwind removed.
// Zero-dependency port: same exported API. useReadingProgress is verbatim;
// the fill's spring is a CSS transition on scaleX (the step quantization
// still does the rate-limiting), the readout crossfade is a shared grid
// cell, and the check mark draws itself with the SVG pathLength attribute.
// Source: https://www.interior.dev/docs/reading-progress

import { useCallback, useEffect, useRef, useState } from "react";
import "./reading-progress.css";

export type ScrollRef = { readonly current: HTMLElement | null };

export type UseReadingProgressOptions = {
  target?: ScrollRef;
  scroller?: ScrollRef;
  steps?: number;
  words?: number;
  wordsPerMinute?: number;
};

export type ReadingProgressState = {
  step: number;
  steps: number;
  progress: number;
  percent: number;
  minutesLeft: number;
  totalMinutes: number;
  complete: boolean;
};

function clamp01(n: number) {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n > 1 ? 1 : n;
}

export function useReadingProgress({
  target,
  scroller,
  steps = 24,
  words = 0,
  wordsPerMinute = 220,
}: UseReadingProgressOptions = {}): ReadingProgressState {
  const [step, setStep] = useState(0);
  const frame = useRef(0);

  const read = useCallback(() => {
    frame.current = 0;

    const scrollEl = scroller?.current ?? null;
    const targetEl = target?.current ?? null;
    const viewport = scrollEl ? scrollEl.clientHeight : window.innerHeight;

    let ratio: number;
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const base = scrollEl ? scrollEl.getBoundingClientRect().top : 0;
      const travel = rect.height - viewport;
      ratio = travel <= 0 ? 1 : (base - rect.top) / travel;
    } else if (scrollEl) {
      const travel = scrollEl.scrollHeight - scrollEl.clientHeight;
      ratio = travel <= 0 ? 1 : scrollEl.scrollTop / travel;
    } else {
      const doc = document.documentElement;
      const travel = doc.scrollHeight - viewport;
      ratio = travel <= 0 ? 1 : window.scrollY / travel;
    }

    const next = Math.round(clamp01(ratio) * steps);
    setStep((prev) => (prev === next ? prev : next));
  }, [scroller, target, steps]);

  useEffect(() => {
    const scrollEl = scroller?.current ?? null;
    const targetEl = target?.current ?? null;
    const source: EventTarget = scrollEl ?? window;

    const schedule = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(read);
    };

    source.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    if (observer) {
      if (targetEl) observer.observe(targetEl);
      if (scrollEl) observer.observe(scrollEl);
      if (!targetEl && !scrollEl) observer.observe(document.documentElement);
    }

    read();

    return () => {
      source.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [read, scroller, target]);

  const progress = steps > 0 ? step / steps : 1;
  const totalMinutes =
    words > 0 ? Math.max(1, Math.ceil(words / wordsPerMinute)) : 0;
  const minutesLeft =
    words > 0 ? Math.ceil(((1 - progress) * words) / wordsPerMinute) : 0;

  return {
    step,
    steps,
    progress,
    percent: Math.round(progress * 100),
    minutesLeft,
    totalMinutes,
    complete: step >= steps,
  };
}

export type ReadingProgressProps = UseReadingProgressOptions & {
  label?: string;
  doneLabel?: string;
  className?: string;
};

export function ReadingProgress({
  target,
  scroller,
  steps = 24,
  words = 0,
  wordsPerMinute = 220,
  label = "Reading progress",
  doneLabel = "End",
  className = "",
}: ReadingProgressProps) {
  const { step, percent, minutesLeft, totalMinutes, complete } =
    useReadingProgress({ target, scroller, steps, words, wordsPerMinute });

  const estimate = words > 0;
  const readout = `${minutesLeft} min left`;
  const finish = `${doneLabel} · ${totalMinutes} min`;
  const valueText = estimate
    ? `${percent}% read, ${readout}`
    : `${percent}% read`;

  return (
    <div className={`rp${className ? ` ${className}` : ""}`}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={steps}
        aria-valuenow={step}
        aria-valuetext={valueText}
        className="rp-track"
      >
        <div
          className="rp-fill"
          style={{ transform: `scaleX(${step / Math.max(1, steps)})` }}
        />
      </div>

      {estimate ? (
        <div className="rp-readout">
          <span aria-hidden className="rp-pad">
            <span className="rp-pad-icon" />
            {finish}
          </span>
          <span
            aria-hidden
            className="rp-left"
            data-on={!complete || undefined}
          >
            {readout}
          </span>
          <span
            aria-hidden
            className="rp-done"
            data-on={complete || undefined}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 256 256"
              fill="none"
              aria-hidden="true"
            >
              <polyline
                className="rp-check"
                points="216 72 104 184 48 128"
                stroke="currentColor"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                data-on={complete || undefined}
              />
            </svg>
            <span className="rp-done-text" data-on={complete || undefined}>
              {finish}
            </span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
