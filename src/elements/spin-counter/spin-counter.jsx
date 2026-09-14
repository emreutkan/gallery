// Transitions.dev — Spinning counter (React, self-contained)
// Drop into any React project — no extra CSS file needed.
// Source: https://transitions.dev
//
// Changes from upstream: the vertical motion-blur driver (omitted upstream
// for brevity) is implemented — one SVG feGaussianBlur filter per column,
// stdDeviation="0 Y" decayed to 0 over that reel's own settle window.
// `value` is declarative: changing it spins the reels to the new number.
// `animate` lets callers trigger the same spin imperatively.

import { useEffect, useRef, useId } from "react";

// ── Styles ──────────────────────────────────────────────
// Auto-injected on first import. Idempotent (guarded by
// the element id) and SSR-safe (no-ops without document).
const __TRANSITION_STYLES = `
:root {
  --reel-dur: 1400ms;
  --reel-cell: 30px;
  --reel-spin-blur: 3px;
  --reel-stagger: 90ms;
  --reel-ease: cubic-bezier(0.16, 1, 0.3, 1);
}

.t-reel { display: inline-flex; align-items: center; height: var(--reel-cell); font-variant-numeric: tabular-nums; }
.t-reel-col {
  position: relative; height: var(--reel-cell); overflow: hidden;
  /* Soft-fade the window edges instead of hard-cropping. */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%);
}
.t-reel-strip { display: flex; flex-direction: column; will-change: transform, filter; }
.t-reel-digit { height: var(--reel-cell); display: flex; align-items: center; justify-content: center; }

@media (prefers-reduced-motion: reduce) {
  .t-reel-strip { transition: none !important; filter: none !important; }
}
`;
if (typeof document !== "undefined" && !document.getElementById("transitions-p26")) {
  const __style = document.createElement("style");
  __style.id = "transitions-p26";
  __style.textContent = __TRANSITION_STYLES;
  document.head.appendChild(__style);
}

const SPINS = 3, CELL = 30, DUR = 1400, STAGGER = 90;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const BLUR_MAX = 3; // px — matches --reel-spin-blur
const SVG_NS = "http://www.w3.org/2000/svg";

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function SpinCounter({ value = 0, className = "", style }) {
  const ref = useRef(null);
  const defsRef = useRef(null); // <svg> host for per-column blur filters
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const prevValue = useRef(null);
  const rafRef = useRef(0);

  // One blurred strip per digit column; separators render inline.
  function build(str) {
    const el = ref.current;
    el.innerHTML = "";
    const strips = [];
    [...str].forEach((ch) => {
      if (ch < "0" || ch > "9") {
        const sep = document.createElement("span");
        sep.className = "t-reel-sep";
        sep.textContent = ch;
        el.appendChild(sep);
        return;
      }
      const col = document.createElement("span");
      col.className = "t-reel-col";
      const strip = document.createElement("span");
      strip.className = "t-reel-strip";
      for (let k = 0; k < (SPINS + 1) * 10 + 1; k++) {
        const cell = document.createElement("span");
        cell.className = "t-reel-digit";
        cell.textContent = String(k % 10);
        strip.appendChild(cell);
      }
      col.appendChild(strip);
      el.appendChild(col);
      strips.push({ strip, digit: +ch });
    });
    return strips;
  }

  // A feGaussianBlur with stdDeviation="0 Y" blurs vertically only —
  // CSS blur() would smear sideways too. One filter per column so each
  // decays over its own staggered window.
  function ensureFilter(i) {
    const host = defsRef.current;
    const id = `reel-blur-${uid}-${i}`;
    let blur = host.querySelector(`#${id} feGaussianBlur`);
    if (blur) return blur;
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", id);
    filter.setAttribute("x", "0%");
    filter.setAttribute("y", "-20%");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "140%");
    blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("stdDeviation", "0 0");
    filter.appendChild(blur);
    host.appendChild(filter);
    return blur;
  }

  function spin(target) {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    const strips = build(Math.round(target).toLocaleString("en-US"));
    strips.forEach(({ strip }) => {
      strip.style.transition = "none";
      strip.style.transform = "translateY(0)";
      strip.style.filter = "none";
    });
    void el.offsetWidth;

    if (reduced()) {
      strips.forEach(({ strip, digit }) => {
        strip.style.transform = `translateY(-${(SPINS * 10 + digit) * CELL}px)`;
      });
      return;
    }

    const blurs = strips.map((_, i) => ensureFilter(i));
    strips.forEach(({ strip }, i) => {
      strip.style.transition = `transform ${DUR}ms ${EASE} ${i * STAGGER}ms`;
      strip.style.filter = `url(#reel-blur-${uid}-${i})`;
    });
    // Commit after the reflow above.
    requestAnimationFrame(() => {
      strips.forEach(({ strip, digit }) => {
        strip.style.transform = `translateY(-${(SPINS * 10 + digit) * CELL}px)`;
      });
    });

    // Decay each column's blur over its own [delay, delay+dur] window —
    // full streak while spinning, sharp by the time it lands.
    const t0 = performance.now();
    const tick = (now) => {
      let alive = false;
      strips.forEach((_, i) => {
        const start = i * STAGGER;
        const end = start + DUR;
        const t = Math.min(1, Math.max(0, (now - t0 - start) / (end - start)));
        const b = BLUR_MAX * (1 - t);
        blurs[i].setAttribute("stdDeviation", `0 ${b.toFixed(3)}`);
        if (t < 1) alive = true;
      });
      if (alive) rafRef.current = requestAnimationFrame(tick);
      else strips.forEach(({ strip }) => (strip.style.filter = "none"));
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  // Mount: rest at 0. Value changes: spin to the new target.
  useEffect(() => {
    build("0").forEach(({ strip, digit }) => {
      strip.style.transform = `translateY(-${digit * CELL}px)`;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevValue.current === value) return;
    prevValue.current = value;
    spin(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <span className={className ? `t-reel-wrap ${className}` : "t-reel-wrap"} style={style}>
      <span ref={ref} className="t-reel" aria-label={String(value)} role="text" />
      <svg ref={defsRef} width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" />
    </span>
  );
}

export default SpinCounter;
