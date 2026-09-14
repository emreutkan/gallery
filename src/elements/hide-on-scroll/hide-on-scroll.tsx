// Adapted from interior.dev/hide-on-scroll — motion/Tailwind removed.
// Zero-dependency port: same exported API. useHideOnScroll is verbatim —
// directional accumulation, top guard, pin hold. The bar slide and the
// hairline fade are CSS transitions.
// Source: https://www.interior.dev/docs/hide-on-scroll

import { useEffect, useRef, useState } from "react";
import "./hide-on-scroll.css";

export type UseHideOnScrollOptions = {
  hideAfter?: number;
  revealAfter?: number;
  topGuard?: number;
  pinned?: boolean;
  disabled?: boolean;
};

export type UseHideOnScrollResult<T extends HTMLElement> = {
  ref: React.RefObject<T | null>;
  hidden: boolean;
  atTop: boolean;
};

export function useHideOnScroll<T extends HTMLElement = HTMLDivElement>({
  hideAfter = 14,
  revealAfter = 10,
  topGuard = 24,
  pinned = false,
  disabled = false,
}: UseHideOnScrollOptions = {}): UseHideOnScrollResult<T> {
  const ref = useRef<T | null>(null);
  const frame = useRef(0);
  const last = useRef(0);
  const accum = useRef(0);

  const held = useRef(pinned || disabled);
  held.current = pinned || disabled;

  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);

  const down = Math.max(1, hideAfter);
  const up = Math.max(1, revealAfter);
  const guard = Math.max(0, topGuard);

  useEffect(() => {
    if (!pinned && !disabled) return;
    accum.current = 0;
    setHidden(false);
  }, [pinned, disabled]);

  useEffect(() => {
    const el = ref.current;
    const target: EventTarget = el ?? window;

    const readY = () => (el ? el.scrollTop : window.scrollY);
    const readMax = () =>
      el
        ? el.scrollHeight - el.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;

    const evaluate = () => {
      frame.current = 0;

      const max = readMax();
      const y = readY();

      if (max <= guard) {
        accum.current = 0;
        last.current = y;
        setAtTop((prev) => (prev ? prev : true));
        setHidden((prev) => (prev ? false : prev));
        return;
      }

      if (y < 0 || y > max) return;

      const dy = y - last.current;
      last.current = y;

      const top = y <= guard;
      setAtTop((prev) => (prev === top ? prev : top));

      if (held.current || top) {
        accum.current = 0;
        setHidden((prev) => (prev ? false : prev));
        return;
      }

      if (dy === 0) return;
      if (dy > 0 !== accum.current > 0) accum.current = 0;
      accum.current += dy;

      if (accum.current >= down) {
        accum.current = 0;
        setHidden((prev) => (prev ? prev : true));
      } else if (accum.current <= -up) {
        accum.current = 0;
        setHidden((prev) => (prev ? false : prev));
      }
    };

    const schedule = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(evaluate);
    };

    last.current = readY();
    evaluate();

    target.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(schedule);
      observer.observe(el);
    }

    return () => {
      target.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [down, up, guard]);

  return { ref, hidden, atTop };
}

export type HideOnScrollProps = {
  bar: React.ReactNode;
  children: React.ReactNode;
  barHeight?: number;
  hideAfter?: number;
  revealAfter?: number;
  topGuard?: number;
  pinned?: boolean;
  maxHeight?: number;
  label?: string;
  onHiddenChange?: (hidden: boolean) => void;
  className?: string;
};

export function HideOnScroll({
  bar,
  children,
  barHeight = 44,
  hideAfter = 14,
  revealAfter = 10,
  topGuard = 24,
  pinned = false,
  maxHeight = 320,
  label = "Scrollable content",
  onHiddenChange,
  className = "",
}: HideOnScrollProps) {
  const [focusWithin, setFocusWithin] = useState(false);

  const { ref, hidden, atTop } = useHideOnScroll<HTMLDivElement>({
    hideAfter,
    revealAfter,
    topGuard,
    pinned: pinned || focusWithin,
  });

  const seen = useRef(hidden);
  useEffect(() => {
    if (seen.current === hidden) return;
    seen.current = hidden;
    onHiddenChange?.(hidden);
  }, [hidden, onHiddenChange]);

  return (
    <div className={`hs${className ? ` ${className}` : ""}`}>
      <div
        data-hidden={hidden ? "true" : "false"}
        onFocus={() => setFocusWithin(true)}
        onBlur={() => setFocusWithin(false)}
        style={{ height: barHeight }}
        className="hs-bar"
      >
        {bar}

        <span
          aria-hidden
          className="hs-edge"
          data-on={!atTop || undefined}
        />
      </div>

      <div
        ref={ref}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="region"
        aria-label={label}
        style={{ maxHeight, scrollPaddingTop: barHeight + 8 }}
        className="hs-scroll"
      >
        <div aria-hidden style={{ height: barHeight }} />
        <div aria-hidden className="hs-fade hs-fade-top" />
        {children}
        <div aria-hidden className="hs-fade hs-fade-bottom" />
      </div>
    </div>
  );
}
