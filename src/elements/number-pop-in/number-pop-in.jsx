// Transitions.dev — Number pop-in (React, self-contained)
// Drop into any React project — no extra CSS file needed.
// Source: https://transitions.dev
//
// One change from upstream: the stagger delay is applied as an inline
// animationDelay per digit (n * --digit-stagger) instead of capping at
// data-stagger="2", so strings of any length stagger fully. The
// data-stagger attribute is still set for CSS-tab parity.

import { useState } from "react";

// ── Styles ──────────────────────────────────────────────
// Auto-injected on first import. Idempotent (guarded by
// the element id) and SSR-safe (no-ops without document).
const __TRANSITION_STYLES = `
:root {
  --digit-dur: 500ms;
  --digit-distance: 8px;
  --digit-stagger: 70ms;
  --digit-blur: 2px;
  --digit-ease: cubic-bezier(0.34, 1.45, 0.64, 1);
  --digit-dir-x: 0;
  --digit-dir-y: 1;
}

@keyframes t-digit-pop-in {
  0%   {
    transform: translate(
      calc(var(--digit-distance) * var(--digit-dir-x)),
      calc(var(--digit-distance) * var(--digit-dir-y))
    );
    opacity: 0;
    filter: blur(var(--digit-blur));
  }
  100% { transform: translate(0, 0); opacity: 1; filter: blur(0); }
}

.t-digit-group {
  display: inline-flex;
  align-items: baseline;
}
.t-digit {
  display: inline-block;
  will-change: transform, opacity, filter;
}
.t-digit-group.is-animating .t-digit {
  animation: t-digit-pop-in var(--digit-dur) var(--digit-ease) both;
}
.t-digit-group.is-animating .t-digit[data-stagger="1"] {
  animation-delay: var(--digit-stagger);
}
.t-digit-group.is-animating .t-digit[data-stagger="2"] {
  animation-delay: calc(var(--digit-stagger) * 2);
}

@media (prefers-reduced-motion: reduce) {
  .t-digit-group .t-digit { animation: none !important; }
}
`;
if (typeof document !== "undefined" && !document.getElementById("transitions-p9")) {
  const __style = document.createElement("style");
  __style.id = "transitions-p9";
  __style.textContent = __TRANSITION_STYLES;
  document.head.appendChild(__style);
}

// Toggle `.is-animating` to replay the pop-in sequence.
export function NumberPopIn({ value = "123", className = "", style }) {
  const [playing, setPlaying] = useState(true);

  // Replay: strip the class, force a reflow via rAF, then re-add.
  const replay = () => {
    setPlaying(false);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPlaying(true))
    );
  };

  return (
    <span
      className={
        "t-digit-group" + (playing ? " is-animating" : "") +
        (className ? " " + className : "")
      }
      style={style}
    >
      {String(value).split("").map((ch, i) => (
        <span
          key={i}
          className="t-digit"
          data-stagger={i > 0 ? i : undefined}
          style={
            playing && i > 0
              ? { animationDelay: `calc(var(--digit-stagger) * ${i})` }
              : undefined
          }
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

// Exposed for demos: imperatively replay a rendered group by element.
export function replayDigitGroup(el) {
  if (!el) return;
  el.classList.remove("is-animating");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => el.classList.add("is-animating"))
  );
}

export default NumberPopIn;
