// Adapted from interior.dev/ripple — motion/Tailwind removed.
// Zero-dependency port: same exported API, CSS transitions replace motion.
// Source: https://www.interior.dev/docs/ripple

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./ripple.css";

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

const BASE = 40;
const BLOOM_MS = 500;

export type RippleSpec = {
  id: number;
  x: number;
  y: number;
  scale: number;
  released: boolean;
};

export type UseRippleOptions = {
  disabled?: boolean;
  max?: number;
  minVisible?: number;
  fade?: number;
};

export function useRipple({
  disabled = false,
  max = 4,
  minVisible = 220,
  fade = 320,
}: UseRippleOptions = {}) {
  const [ripples, setRipples] = useState<RippleSpec[]>([]);

  const list = useRef<RippleSpec[]>([]);
  const seq = useRef(0);
  const born = useRef(new Map<number, number>());
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>[]>());
  const pointers = useRef(new Map<number, number>());
  const keyed = useRef<number | null>(null);

  const commit = useCallback((next: RippleSpec[]) => {
    list.current = next;
    setRipples(next);
  }, []);

  const forget = useCallback((id: number) => {
    timers.current.get(id)?.forEach(clearTimeout);
    timers.current.delete(id);
    born.current.delete(id);
  }, []);

  const spawn = useCallback(
    (el: HTMLElement, clientX?: number, clientY?: number) => {
      const rect = el.getBoundingClientRect();
      const x = Math.round(
        clientX === undefined ? rect.width / 2 : clientX - rect.left,
      );
      const y = Math.round(
        clientY === undefined ? rect.height / 2 : clientY - rect.top,
      );
      const reach = Math.max(
        Math.hypot(x, y),
        Math.hypot(rect.width - x, y),
        Math.hypot(x, rect.height - y),
        Math.hypot(rect.width - x, rect.height - y),
      );

      let next = list.current;
      while (next.length >= max) {
        forget(next[0].id);
        next = next.slice(1);
      }

      const id = (seq.current += 1);
      born.current.set(id, performance.now());
      commit([
        ...next,
        {
          id,
          x,
          y,
          scale: Math.round((reach * 200) / BASE) / 100,
          released: false,
        },
      ]);
      return id;
    },
    [commit, forget, max],
  );

  const release = useCallback(
    (id: number) => {
      if (timers.current.has(id)) return;
      if (!list.current.some((r) => r.id === id)) return;

      const wait = Math.max(
        0,
        minVisible - (performance.now() - (born.current.get(id) ?? 0)),
      );

      const start = setTimeout(() => {
        commit(
          list.current.map((r) => (r.id === id ? { ...r, released: true } : r)),
        );
      }, wait);

      const drop = setTimeout(() => {
        forget(id);
        commit(list.current.filter((r) => r.id !== id));
      }, wait + fade);

      timers.current.set(id, [start, drop]);
    },
    [commit, fade, forget, minVisible],
  );

  const releaseAll = useCallback(() => {
    pointers.current.forEach((id) => release(id));
    pointers.current.clear();
    if (keyed.current !== null) {
      release(keyed.current);
      keyed.current = null;
    }
  }, [release]);

  const endPointer = useCallback(
    (pointerId: number) => {
      const id = pointers.current.get(pointerId);
      if (id === undefined) return;
      pointers.current.delete(pointerId);
      release(id);
    },
    [release],
  );

  useEffect(() => {
    const bail = () => releaseAll();
    const onVisibility = () => document.hidden && releaseAll();
    window.addEventListener("blur", bail);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", bail);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [releaseAll]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((set) => set.forEach(clearTimeout));
      pending.clear();
    };
  }, []);

  const bind = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (disabled) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (pointers.current.has(e.pointerId)) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      pointers.current.set(
        e.pointerId,
        spawn(e.currentTarget, e.clientX, e.clientY),
      );
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => endPointer(e.pointerId),
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) =>
      endPointer(e.pointerId),
    onLostPointerCapture: (e: React.PointerEvent<HTMLElement>) =>
      endPointer(e.pointerId),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (disabled || e.repeat || keyed.current !== null) return;
      if (e.key !== " " && e.key !== "Enter") return;
      keyed.current = spawn(e.currentTarget);
    },
    onKeyUp: (e: React.KeyboardEvent<HTMLElement>) => {
      if (keyed.current === null) return;
      if (e.key !== " " && e.key !== "Enter" && e.key !== "Escape") return;
      release(keyed.current);
      keyed.current = null;
    },
    onBlur: () => releaseAll(),
  };

  return { bind, ripples, fadeDuration: fade / 1000 };
}

/* One ripple disc: mounts at scale 0, blooms to its reach on the next frame,
   then fades once released. The hook owns lifetime; the span only animates. */
function RippleSpan({
  r,
  fadeDuration,
  reduced,
}: {
  r: RippleSpec;
  fadeDuration: number;
  reduced: boolean;
}) {
  const [grown, setGrown] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setGrown(true)),
    );
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  return (
    <span
      className="rp-disc"
      style={{
        left: r.x - BASE / 2,
        top: r.y - BASE / 2,
        width: BASE,
        height: BASE,
        transform: `scale(${grown ? r.scale : 0})`,
        opacity: r.released ? 0 : grown ? 1 : 0,
        transition: reduced
          ? `opacity ${r.released ? fadeDuration : 0.07}s linear`
          : `transform ${BLOOM_MS}ms linear, opacity ${r.released ? fadeDuration : 0.07}s ${r.released ? "cubic-bezier(0.23,1,0.32,1)" : "linear"}`,
      }}
    />
  );
}

export type RippleProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  max?: number;
  className?: string;
};

export function Ripple({
  children,
  onPress,
  disabled = false,
  max = 4,
  className = "",
}: RippleProps) {
  const { bind, ripples, fadeDuration } = useRipple({ disabled, max });
  const reduced = useReducedMotion();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      className={`rp ${className}`}
      {...bind}
    >
      <span aria-hidden className="rp-clip">
        {ripples.map((r) => (
          <RippleSpan
            key={r.id}
            r={r}
            fadeDuration={fadeDuration}
            reduced={reduced}
          />
        ))}
      </span>
      <span className="rp-label">{children}</span>
    </button>
  );
}
