// Adapted from fluidfunctionalism.com/r/base/switch.json — framer-motion,
// @base-ui/react and Tailwind removed. Zero-dependency port, same API.
//
// - motion.span thumb → a plain span; X is written imperatively every frame
//   (drag + spring), width/height/Y animate via CSS transitions.
// - animate(x, target, spring.moderate) → a critically damped spring tuned
//   to ~160ms settle (spring.moderate is a 0.16s/bounce-0 duration spring).
// - SwitchPrimitive.Root/Thumb → <button role="switch"> + <span>.
// - useSize/cn vendored locally (see size-context.tsx).
// Source: https://www.fluidfunctionalism.com/docs/switch

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useId,
  type HTMLAttributes,
} from "react";
import { useSize, type SizeVariant } from "./size-context";
import "./switch.css";

interface SwitchProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Pins the switch to one step of the size ladder.
   *  Omitted, it follows the surrounding SizeProvider. */
  size?: SizeVariant;
}

// Track/thumb geometry per ladder step. The hover pill-extend and press
// squash scale down with the thumb so the compact switch keeps the same feel.
const METRICS = {
  default: {
    trackWidth: 34,
    trackHeight: 20,
    thumbSize: 16,
    pillExtend: 2,
    pressExtend: 4,
    pressShrink: 4,
  },
  compact: {
    trackWidth: 28,
    trackHeight: 16,
    thumbSize: 12,
    pillExtend: 2,
    pressExtend: 3,
    pressShrink: 3,
  },
} as const;

const THUMB_OFFSET = 2;
const DRAG_DEAD_ZONE = 2;

// spring.moderate ≈ a critically damped spring settling in ~160ms.
const SPRING_K = 550;
const SPRING_C = 2 * Math.sqrt(SPRING_K); // ζ = 1, mass = 1

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Animate a scalar toward a target. Returns a stopper. */
function animateTo(
  get: () => number,
  set: (v: number) => void,
  target: number,
): () => void {
  if (prefersReduced()) {
    set(target);
    return () => {};
  }
  let p = get();
  let v = 0;
  let last = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const f = -SPRING_K * (p - target) - SPRING_C * v;
    v += f * dt;
    p += v * dt;
    if (Math.abs(p - target) < 0.05 && Math.abs(v) < 2) {
      set(target);
      return;
    }
    set(p);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

const cn = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(" ");

const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  (
    { label, checked, onToggle, disabled = false, size, className, ...props },
    ref,
  ) => {
    const labelId = useId();
    const hasMounted = useRef(false);
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const sizeClasses = useSize(size);
    const m = METRICS[sizeClasses.variant];
    const thumbTravel = m.trackWidth - m.thumbSize - THUMB_OFFSET * 2;

    const thumbRef = useRef<HTMLSpanElement | null>(null);
    const dragging = useRef(false);
    const didDrag = useRef(false);
    const stopAnim = useRef<(() => void) | null>(null);
    const pointerStart = useRef<{
      clientX: number;
      originX: number;
    } | null>(null);

    // The thumb's X lives outside React state — drag and spring frames write
    // it straight to the DOM so 60fps updates never re-render.
    const motionX = useRef(checked ? THUMB_OFFSET + thumbTravel : THUMB_OFFSET);
    const thumbYRef = useRef(THUMB_OFFSET);
    const paintX = useCallback(() => {
      const node = thumbRef.current;
      if (node) {
        node.style.transform = `translate3d(${motionX.current.toFixed(2)}px, ${thumbYRef.current}px, 0)`;
      }
    }, []);

    useEffect(() => {
      hasMounted.current = true;
      paintX();
    }, [paintX]);

    const thumbWidth = pressed
      ? m.thumbSize + m.pressExtend
      : hovered
        ? m.thumbSize + m.pillExtend
        : m.thumbSize;
    const thumbHeight = pressed ? m.thumbSize - m.pressShrink : m.thumbSize;
    const thumbY = pressed ? THUMB_OFFSET + m.pressShrink / 2 : THUMB_OFFSET;
    const extraWidth = thumbWidth - m.thumbSize;
    const thumbX = checked
      ? THUMB_OFFSET + thumbTravel - extraWidth
      : THUMB_OFFSET;

    thumbYRef.current = thumbY;

    useEffect(() => {
      if (dragging.current) return;
      if (!hasMounted.current) {
        motionX.current = thumbX;
        paintX();
      } else {
        stopAnim.current?.();
        stopAnim.current = animateTo(
          () => motionX.current,
          (v) => {
            motionX.current = v;
            paintX();
          },
          thumbX,
        );
      }
    }, [thumbX, paintX]);

    const snapBack = useCallback(
      (target: number) => {
        stopAnim.current?.();
        stopAnim.current = animateTo(
          () => motionX.current,
          (v) => {
            motionX.current = v;
            paintX();
          },
          target,
        );
      },
      [paintX],
    );

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        setPressed(true);
        dragging.current = false;
        didDrag.current = false;
        pointerStart.current = {
          clientX: e.clientX,
          originX: motionX.current,
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      [disabled],
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerStart.current) return;
        const delta = e.clientX - pointerStart.current.clientX;

        if (!dragging.current) {
          if (Math.abs(delta) < DRAG_DEAD_ZONE) return;
          dragging.current = true;
          stopAnim.current?.();
        }

        const dragMin = THUMB_OFFSET;
        const pressedThumbWidth = m.thumbSize + m.pressExtend;
        const dragMax = m.trackWidth - THUMB_OFFSET - pressedThumbWidth;
        const rawX = pointerStart.current.originX + delta;
        motionX.current = Math.max(dragMin, Math.min(dragMax, rawX));
        paintX();
      },
      [m, paintX],
    );

    const handlePointerUp = useCallback(() => {
      if (!pointerStart.current) return;
      setPressed(false);

      if (dragging.current) {
        didDrag.current = true;
        dragging.current = false;

        const currentX = motionX.current;
        const dragMin = THUMB_OFFSET;
        const pressedThumbWidth = m.thumbSize + m.pressExtend;
        const dragMax = m.trackWidth - THUMB_OFFSET - pressedThumbWidth;
        const midpoint = (dragMin + dragMax) / 2;

        const shouldBeOn = currentX > midpoint;

        if (shouldBeOn !== checked) {
          onToggle();
        } else {
          snapBack(checked ? THUMB_OFFSET + thumbTravel : THUMB_OFFSET);
        }

        requestAnimationFrame(() => {
          didDrag.current = false;
        });
      }

      pointerStart.current = null;
    }, [checked, onToggle, m, thumbTravel, snapBack]);

    const handlePointerCancel = useCallback(() => {
      if (!pointerStart.current) return;
      setPressed(false);

      if (dragging.current) {
        dragging.current = false;
        snapBack(checked ? THUMB_OFFSET + thumbTravel : THUMB_OFFSET);
      }

      pointerStart.current = null;
    }, [checked, thumbTravel, snapBack]);

    return (
      <div
        ref={ref}
        className={cn(
          "sw",
          sizeClasses.gap,
          sizeClasses.px,
          sizeClasses.py,
          disabled && "sw-disabled",
          className,
        )}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={() => {
          if (disabled || didDrag.current) return;
          onToggle();
        }}
        {...props}
      >
        {/* Switch — role="switch" button stands in for Base UI's
            SwitchPrimitive.Root; Space/Enter fire a native click. */}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={labelId}
          disabled={disabled}
          tabIndex={0}
          className="sw-track"
          data-checked={checked || undefined}
          data-hovered={hovered || undefined}
          style={{
            width: m.trackWidth,
            height: m.trackHeight,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (didDrag.current) return;
            onToggle();
          }}
        >
          <span
            ref={thumbRef}
            aria-hidden
            className="sw-thumb"
            style={{
              width: thumbWidth,
              height: thumbHeight,
              transitionDuration: hasMounted.current ? undefined : "0ms",
            }}
          />
        </button>

        {/* Label */}
        <span
          id={labelId}
          className={cn("sw-label", sizeClasses.text)}
          data-on={checked || undefined}
        >
          {label}
        </span>
      </div>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
export { SizeProvider, useSize } from "./size-context";
export type { SwitchProps, SizeVariant };
