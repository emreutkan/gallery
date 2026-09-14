// Adapted from interior.dev/skeleton-swap — motion/Tailwind removed.
// Zero-dependency port: same exported API. useSkeletonSwap is verbatim;
// the content blur-in and skeleton fade are CSS transitions (the skeleton
// stays mounted and toggles via data-on, so both directions animate).
// Source: https://www.interior.dev/docs/skeleton-swap

import { useEffect, useRef, useState } from "react";
import "./skeleton-swap.css";

const WIDTHS = [100, 93, 97, 88, 95, 91] as const;

function widthFor(index: number, total: number) {
  if (total > 1 && index === total - 1) return 62;
  return WIDTHS[(index * 7 + 3) % WIDTHS.length];
}

export type UseSkeletonSwapOptions = {
  ready: boolean;
  delay?: number;
  minVisible?: number;
};

export function useSkeletonSwap({
  ready,
  delay = 120,
  minVisible = 380,
}: UseSkeletonSwapOptions) {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (!ready) {
      if (visible) return;
      const t = setTimeout(() => {
        shownAt.current = performance.now();
        setVisible(true);
      }, delay);
      return () => clearTimeout(t);
    }

    if (!visible) return;
    const rest = Math.max(0, minVisible - (performance.now() - shownAt.current));
    const t = setTimeout(() => setVisible(false), rest);
    return () => clearTimeout(t);
  }, [ready, visible, delay, minVisible]);

  return { showSkeleton: visible, busy: !ready };
}

export type SkeletonSwapProps = {
  ready: boolean;
  children: React.ReactNode;
  lines?: number;
  lineHeight?: number;
  barHeight?: number;
  reserve?: number;
  delay?: number;
  minVisible?: number;
  label?: string;
  skeleton?: React.ReactNode;
  className?: string;
};

export function SkeletonSwap({
  ready,
  children,
  lines = 3,
  lineHeight = 21,
  barHeight = 9,
  reserve,
  delay = 120,
  minVisible = 380,
  label,
  skeleton,
  className = "",
}: SkeletonSwapProps) {
  const { showSkeleton } = useSkeletonSwap({ ready, delay, minVisible });

  const shell = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

  const box = reserve ?? lines * lineHeight;

  useEffect(() => {
    const el = shell.current;
    const inner = body.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const check = () => setScrollable(el.scrollHeight - el.clientHeight > 1);
    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (inner) ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={shell}
      aria-busy={!ready}
      aria-label={label}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={scrollable ? 0 : undefined}
      style={{ height: box }}
      className={`sk${className ? ` ${className}` : ""}`}
    >
      <div
        ref={body}
        className="sk-body"
        data-off={showSkeleton || undefined}
      >
        {children}
      </div>

      <div
        aria-hidden
        className="sk-bones"
        data-on={showSkeleton || undefined}
      >
        {skeleton ?? (
          <div className="sk-lines">
            {Array.from({ length: lines }, (_, i) => (
              <div key={i} className="sk-line" style={{ height: lineHeight }}>
                <div
                  className="sk-bar"
                  style={{ height: barHeight, width: `${widthFor(i, lines)}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {label ? (
        <span role="status" className="sk-sr">
          {ready ? `${label} loaded` : ""}
        </span>
      ) : null}
    </div>
  );
}
