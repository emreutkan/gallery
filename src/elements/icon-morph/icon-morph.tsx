// Adapted from interior.dev/icon-morph — motion/Tailwind removed.
// Zero-dependency port: path morphs are a rAF tween over the matched
// number slots (both shapes share a command signature, so a numeric
// lerp is exact). Same exported API.
// Source: https://www.interior.dev/docs/icon-morph

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./icon-morph.css";

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

const NUMBER = /-?\d*\.?\d+/g;
const CENTER = "12";
const MORPH_MS = 260;
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5); // ≈ [0.23,1,0.32,1]

export type MorphShape = {
  d: readonly string[];
  rotate?: number;
};

export type IconMorphMode = "stroke" | "fill";

export type IconMorphPreset =
  | "menu-close"
  | "play-pause"
  | "plus-minus"
  | "check-close";

export type IconMorphSlot = {
  key: number;
  d: string;
  visible: boolean;
};

export type IconMorphSemantics = "label" | "pressed" | "expanded";

export const iconMorphPresets: Record<
  IconMorphPreset,
  { mode: IconMorphMode; labels: readonly string[]; shapes: readonly MorphShape[] }
> = {
  "menu-close": {
    mode: "stroke",
    labels: ["Menu", "Close"],
    shapes: [
      {
        rotate: 0,
        d: ["M 4 7 L 20 7", "M 4 12 L 20 12", "M 4 17 L 20 17"],
      },
      {
        rotate: 90,
        d: ["M 6.5 6.5 L 17.5 17.5", "M 12 12 L 12 12", "M 6.5 17.5 L 17.5 6.5"],
      },
    ],
  },
  "play-pause": {
    mode: "fill",
    labels: ["Play", "Pause"],
    shapes: [
      {
        d: [
          "M 8 5 L 14 8.5 L 14 15.5 L 8 19 Z",
          "M 14 8.5 L 20 12 L 20 12 L 14 15.5 Z",
        ],
      },
      {
        d: [
          "M 8 5 L 11.5 5 L 11.5 19 L 8 19 Z",
          "M 15 5 L 18.5 5 L 18.5 19 L 15 19 Z",
        ],
      },
    ],
  },
  "plus-minus": {
    mode: "stroke",
    labels: ["Add", "Remove"],
    shapes: [
      { rotate: 0, d: ["M 5 12 L 19 12", "M 12 5 L 12 19"] },
      { rotate: 180, d: ["M 5 12 L 19 12", "M 5 12 L 19 12"] },
    ],
  },
  "check-close": {
    mode: "stroke",
    labels: ["Confirm", "Cancel"],
    shapes: [
      { d: ["M 5 12.5 L 10 17.5 L 19.5 7", "M 12 12 L 12 12 L 12 12"] },
      { d: ["M 6.5 6.5 L 12 12 L 17.5 17.5", "M 17.5 6.5 L 12 12 L 6.5 17.5"] },
    ],
  },
};

function isCollapsed(d: string): boolean {
  const nums = d.match(NUMBER);
  if (!nums || nums.length < 4) return false;
  return nums.every((n, i) => n === nums[i % 2]);
}

function normalize(shapes: readonly MorphShape[]): IconMorphSlot[][] {
  const slots = shapes.reduce((most, s) => Math.max(most, s.d.length), 0);

  return shapes.map((shape) =>
    Array.from({ length: slots }, (_, i) => {
      const own = shape.d[i];
      const sibling = shapes.find((s) => s.d[i] !== undefined)?.d[i] ?? "";
      const d = own ?? sibling.replace(NUMBER, CENTER);
      return { key: i, d, visible: !isCollapsed(d) };
    }),
  );
}

function toIndex(value: number | boolean): number {
  return typeof value === "boolean" ? (value ? 1 : 0) : Math.trunc(value);
}

/* Tween between two path strings that share a command signature:
   every number slot interpolates toward its counterpart. */
function morphD(from: string, to: string, t: number): string {
  const a = from.match(NUMBER) ?? [];
  const b = to.match(NUMBER) ?? [];
  let i = 0;
  return to.replace(NUMBER, () => {
    const end = parseFloat(b[i]);
    const start = parseFloat(a[i] ?? b[i]);
    i += 1;
    const v = start + (end - start) * t;
    return String(Math.round(v * 1000) / 1000);
  });
}

/* A <path> that tweens its `d` when the target changes. */
function MorphPath({
  d,
  visible,
  reduced,
}: {
  d: string;
  visible: boolean;
  reduced: boolean;
}) {
  const [shown, setShown] = useState(d);
  const current = useRef(d);
  const raf = useRef(0);

  useEffect(() => {
    if (reduced || current.current === d) {
      current.current = d;
      setShown(d);
      return;
    }
    const from = current.current;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / MORPH_MS);
      const next = morphD(from, d, easeOutQuint(t));
      current.current = next;
      setShown(next);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [d, reduced]);

  return (
    <path
      d={shown}
      className="im-path"
      data-on={visible || undefined}
    />
  );
}

export type UseIconMorphOptions = {
  preset?: IconMorphPreset;
  shapes?: readonly MorphShape[];
  mode?: IconMorphMode;
  labels?: readonly string[];
  active?: number | boolean;
  defaultActive?: number | boolean;
  onActiveChange?: (index: number) => void;
};

export function useIconMorph({
  preset = "menu-close",
  shapes,
  mode,
  labels,
  active,
  defaultActive = 0,
  onActiveChange,
}: UseIconMorphOptions = {}) {
  const base = iconMorphPresets[preset];
  const source = shapes ?? base.shapes;
  const names = labels ?? base.labels;
  const count = source.length;

  const [internal, setInternal] = useState(() => toIndex(defaultActive));
  const reduced = useReducedMotion();

  const raw = active === undefined ? internal : toIndex(active);
  const index = count === 0 ? 0 : Math.min(Math.max(raw, 0), count - 1);

  const frames = useMemo(() => normalize(source), [source]);

  const setIndex = useCallback(
    (next: number) => {
      if (count === 0) return;
      const wrapped = ((next % count) + count) % count;
      if (active === undefined) setInternal(wrapped);
      onActiveChange?.(wrapped);
    },
    [active, count, onActiveChange],
  );

  const toggle = useCallback(() => setIndex(index + 1), [setIndex, index]);

  return {
    index,
    count,
    slots: frames[index] ?? [],
    rotate: source[index]?.rotate ?? 0,
    mode: mode ?? base.mode,
    label: names[index] ?? "",
    labels: names,
    reduced,
    setIndex,
    toggle,
  };
}

export type IconMorphProps = UseIconMorphOptions & {
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  semantics?: IconMorphSemantics;
  disabled?: boolean;
  className?: string;
};

export function IconMorph({
  size = 20,
  strokeWidth = 1.75,
  showLabel = false,
  semantics = "label",
  disabled = false,
  className = "",
  ...options
}: IconMorphProps) {
  const {
    index,
    slots,
    rotate,
    mode,
    label,
    labels,
    reduced,
    toggle,
  } = useIconMorph(options);

  const stroked = mode === "stroke";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={toggle}
      aria-label={label}
      aria-pressed={semantics === "pressed" ? index === 1 : undefined}
      aria-expanded={semantics === "expanded" ? index === 1 : undefined}
      className={`im ${showLabel ? "labeled" : ""} ${className}`}
      style={{ touchAction: "manipulation" }}
    >
      <span
        aria-hidden="true"
        className="im-rotor"
        style={{
          width: size,
          height: size,
          transform: `rotate(${rotate}deg)`,
          transition: reduced ? "none" : `transform ${MORPH_MS}ms cubic-bezier(0.23,1,0.32,1)`,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          focusable="false"
          fill={stroked ? "none" : "currentColor"}
          stroke={stroked ? "currentColor" : "none"}
          strokeWidth={stroked ? strokeWidth : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: "block" }}
        >
          {slots.map((slot) => (
            <MorphPath
              key={slot.key}
              d={slot.d}
              visible={slot.visible}
              reduced={reduced}
            />
          ))}
        </svg>
      </span>

      {showLabel && (
        <span aria-hidden="true" className="im-labels">
          {labels.map((text, i) => (
            <span
              key={i}
              data-on={i === index || undefined}
              style={{
                transform:
                  i === index
                    ? "none"
                    : `translateY(${i < index ? -3 : 3}px)`,
              }}
            >
              {text}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
