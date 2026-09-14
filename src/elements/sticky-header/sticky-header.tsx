// Adapted from interior.dev/sticky-header — motion/Tailwind removed.
// Zero-dependency port: same component API. The motion pipeline
// (useScroll → useTransform → useSpring) becomes a scroll listener plus a
// damped-spring follower that writes styles imperatively per frame —
// no re-renders while the header condenses.
// Source: https://www.interior.dev/docs/sticky-header

import { useEffect, useRef, useState } from "react";
import "./sticky-header.css";

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

// the spring constants motion used: SMOOTH = { stiffness: 240, damping: 44, mass: 0.6 }
const SPRING = { k: 240, c: 44, m: 0.6 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export type UseCondenseOptions = {
  range?: number;
  onFrame?: (progress: number) => void;
};

export type UseCondenseResult<T extends HTMLElement> = {
  ref: React.RefObject<T | null>;
  progress: React.RefObject<number>;
  condensed: boolean;
};

/**
 * Tracks a scroll container's scrollTop over `range` px and follows it
 * with a damped spring. `onFrame` fires per animation frame (and once on
 * scroll in reduced-motion mode) with the smoothed 0–1 progress — use it
 * to write styles imperatively. `progress.current` always holds the
 * latest value.
 */
export function useCondense<T extends HTMLElement = HTMLDivElement>({
  range = 48,
  onFrame,
}: UseCondenseOptions = {}): UseCondenseResult<T> {
  const ref = useRef<T | null>(null);
  const progress = useRef(0);
  const [condensed, setCondensed] = useState(false);

  const frame = useRef(onFrame);
  frame.current = onFrame;

  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const R = Math.max(1, range);
    const target = () => clamp01(el.scrollTop / R);

    let p = target();
    let v = 0;
    let raf = 0;
    let last = 0;

    const emit = (x: number) => {
      progress.current = x;
      frame.current?.(x);
      setCondensed((prev) => {
        const done = x >= 1;
        return prev === done ? prev : done;
      });
    };

    const step = (now: number) => {
      const dt = Math.min(0.064, (now - last) / 1000 || 0.016);
      last = now;

      const t = target();
      const f = -SPRING.k * (p - t) - SPRING.c * v;
      v += (f / SPRING.m) * dt;
      p += v * dt;

      if (Math.abs(p - t) < 0.0008 && Math.abs(v) < 0.0008) {
        p = t;
        v = 0;
        emit(p);
        raf = 0;
        return;
      }
      emit(p);
      raf = requestAnimationFrame(step);
    };

    const kick = () => {
      if (reducedRef.current) {
        p = target();
        v = 0;
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
        emit(p);
        return;
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };

    emit(p);
    el.addEventListener("scroll", kick, { passive: true });
    return () => {
      el.removeEventListener("scroll", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [range]);

  return { ref, progress, condensed };
}

export type StickyHeaderProps = {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  expandedHeight?: number;
  compactHeight?: number;
  maxHeight?: number;
  className?: string;
};

export function StickyHeader({
  title,
  children,
  subtitle,
  leading,
  actions,
  expandedHeight = 68,
  compactHeight = 48,
  maxHeight = 320,
  className = "",
}: StickyHeaderProps) {
  const tall = Math.max(expandedHeight, compactHeight);
  const short = Math.min(expandedHeight, compactHeight);
  const travel = Math.max(1, tall - short);

  const headRef = useRef<HTMLElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const bigRef = useRef<HTMLDivElement>(null);
  const smallRef = useRef<HTMLSpanElement>(null);

  // maps smoothed progress to every moving part — same transform set as
  // upstream: plate scaleY, edge translate+lift, big title drift, compact
  // title crossfade
  const apply = (p: number) => {
    const head = headRef.current;
    if (!head) return;

    const edge = tall - travel * p;
    const lifted = clamp01(p / 0.12);

    const plate = plateRef.current;
    if (plate) plate.style.transform = `scaleY(${(tall - travel * p) / tall})`;

    head.querySelectorAll<HTMLElement>(".sh-edge").forEach((el) => {
      el.style.transform = `translateY(${edge}px)`;
      el.style.opacity = String(lifted);
    });

    const big = bigRef.current;
    if (big) {
      big.style.transform = `translateY(${-travel * p}px) scale(${1 - 0.05 * p})`;
      big.style.opacity = String(1 - clamp01(p / 0.45));
    }

    const small = smallRef.current;
    if (small) {
      const o = clamp01((p - 0.55) / 0.35);
      small.style.opacity = String(o);
      small.style.transform = `translateY(${(1 - o) * 6}px)`;
    }
  };

  const { ref, condensed } = useCondense<HTMLDivElement>({
    range: Math.max(64, travel * 3),
    onFrame: apply,
  });

  return (
    <div className={`sh${className ? ` ${className}` : ""}`}>
      <div
        ref={ref}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="region"
        aria-label={title}
        style={{ maxHeight, scrollPaddingTop: short + 10 }}
        className="sh-scroll"
      >
        <div aria-hidden style={{ height: tall }} />
        {children}
        <div aria-hidden className="sh-fade" />
      </div>

      <header
        ref={headRef}
        data-condensed={condensed ? "true" : "false"}
        style={{ height: tall }}
        className="sh-head"
      >
        <div
          ref={plateRef}
          aria-hidden
          style={{ height: tall }}
          className="sh-plate"
        />
        <div aria-hidden className="sh-edge sh-edge-shadow" />
        <div aria-hidden className="sh-edge sh-edge-fade" />
        <div aria-hidden className="sh-edge sh-edge-line" />

        <div className="sh-bar">
          {leading ? <div className="sh-slot">{leading}</div> : null}

          <div className="sh-titles">
            <div ref={bigRef} className="sh-big">
              <h2 className="sh-title">{title}</h2>
              {subtitle ? <p className="sh-sub">{subtitle}</p> : null}
            </div>
            <span ref={smallRef} aria-hidden className="sh-small">
              {title}
            </span>
          </div>

          {actions ? <div className="sh-slot sh-acts">{actions}</div> : null}
        </div>
      </header>
    </div>
  );
}
