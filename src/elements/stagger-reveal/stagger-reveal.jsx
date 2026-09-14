// Transitions.dev — Texts reveal (React, self-contained)
// Drop into any React project — no extra CSS file needed.
// Source: https://transitions.dev
//
// Changes from upstream: the stagger generalizes to N lines via inline
// transition-delay (upstream CSS only defines .t-stagger-line--2), and the
// demo button is split out — `shown` is a prop whose edges drive the
// two-phase state machine (idle → shown stagger; shown → 200ms hiding
// fade → idle). Lines still get the data-driven modifier classes so the
// CSS-tab version stays compatible.

import { useEffect, useRef, useState } from "react";

// ── Styles ──────────────────────────────────────────────
// Auto-injected on first import. Idempotent (guarded by
// the element id) and SSR-safe (no-ops without document).
const __TRANSITION_STYLES = `
:root {
  --stagger-dur: 500ms;
  --stagger-distance: 12px;
  --stagger-stagger: 40ms;
  --stagger-blur: 3px;
  --stagger-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Lines start translated down + blurred + invisible; .is-shown
   on the parent flips them to their resting state. Each line's
   transition-delay holds it back by n * --stagger-stagger so the
   eye lands on the headline first. */
.t-stagger-line {
  display: block;
  opacity: 0;
  transform: translateY(var(--stagger-distance));
  filter: blur(var(--stagger-blur));
  transition:
    opacity   var(--stagger-dur) var(--stagger-ease),
    transform var(--stagger-dur) var(--stagger-ease),
    filter    var(--stagger-dur) var(--stagger-ease);
  will-change: transform, opacity, filter;
}
.t-stagger-line--2 { transition-delay: var(--stagger-stagger); }

.t-stagger.is-shown .t-stagger-line {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}
/* Exit decouples from the stagger: same fade for every line,
   no Y return, no blur — so the disappearance reads as a
   single quiet fade instead of a reverse reveal. */
.t-stagger.is-hiding .t-stagger-line {
  opacity: 0;
  transform: translateY(0);
  filter: blur(0);
  transition:
    opacity 200ms ease,
    transform 0s linear,
    filter 0s linear;
  transition-delay: 0s;
}

@media (prefers-reduced-motion: reduce) {
  .t-stagger-line { transition: none !important; }
}
`;
if (typeof document !== "undefined" && !document.getElementById("transitions-p18")) {
  const __style = document.createElement("style");
  __style.id = "transitions-p18";
  __style.textContent = __TRANSITION_STYLES;
  document.head.appendChild(__style);
}

// Two phases: idle → shown (staggered entrance) and shown → hiding
// (quick fade-out, no Y return). `hiding` is held only long enough for
// the 200ms fade to play, then dropped so the next show can replay the
// staggered entrance from a clean state.
export function StaggerReveal({ primary, secondary, lines, shown = true, className = "", style }) {
  const content = lines ?? [primary, secondary].filter((l) => l != null);
  const [phase, setPhase] = useState(shown ? "shown" : "idle"); // idle | shown | hiding
  const timerRef = useRef(null);

  useEffect(() => {
    if (shown) {
      if (phase !== "shown") {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        // Flip to shown on the next frame so idle→shown isn't batched into
        // one render and the entrance transition can't be skipped.
        const raf = requestAnimationFrame(() => setPhase("shown"));
        return () => cancelAnimationFrame(raf);
      }
    } else if (phase === "shown") {
      setPhase("hiding");
      timerRef.current = window.setTimeout(() => setPhase("idle"), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const cls =
    "t-stagger" +
    (phase === "shown" ? " is-shown" : "") +
    (phase === "hiding" ? " is-hiding" : "") +
    (className ? " " + className : "");

  return (
    <div className={cls} style={style}>
      {content.map((line, i) => (
        <span
          key={i}
          className={`t-stagger-line t-stagger-line--${i + 1}`}
          style={
            phase === "shown" && i > 0
              ? { transitionDelay: `calc(var(--stagger-stagger) * ${i})` }
              : undefined
          }
        >
          {line}
        </span>
      ))}
    </div>
  );
}

export default StaggerReveal;
