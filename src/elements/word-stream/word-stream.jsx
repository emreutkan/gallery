// Transitions.dev — Streaming text (React, self-contained)
// Drop into any React project — no extra CSS file needed.
// Source: https://transitions.dev
//
// Upstream ships the CSS + recipe only; this is the React half:
// words render as .t-stream-w spans and receive .is-in one by one
// every --stream-gap. The upstream "wipe → reflow → restore" replay
// maps to a remount or text change — fresh spans start hidden and
// transition in, which is the same effect without DOM surgery.

import { useEffect, useState } from "react";

// ── Styles ──────────────────────────────────────────────
// Auto-injected on first import. Idempotent (guarded by
// the element id) and SSR-safe (no-ops without document).
const __TRANSITION_STYLES = `
:root {
  --stream-gap: 60ms;
  --stream-fade: 350ms;
  --stream-blur: 1px;
  --stream-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

.t-stream-w {
  opacity: 0;
  filter: blur(var(--stream-blur));
  transition:
    opacity var(--stream-fade) var(--stream-ease),
    filter var(--stream-fade) var(--stream-ease);
}
.t-stream-w.is-in {
  opacity: 1;
  filter: blur(0);
}

@media (prefers-reduced-motion: reduce) {
  .t-stream-w { transition: none !important; filter: none !important; opacity: 1 !important; }
}
`;
if (typeof document !== "undefined" && !document.getElementById("transitions-p-stream")) {
  const __style = document.createElement("style");
  __style.id = "transitions-p-stream";
  __style.textContent = __TRANSITION_STYLES;
  document.head.appendChild(__style);
}

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function WordStream({ text = "", gap = 60, className = "", style }) {
  // Split keeps whitespace tokens so spaces/newlines survive untouched;
  // only word tokens become animated spans.
  const tokens = String(text).split(/(\s+)/);
  const wordCount = tokens.reduce((n, t) => n + (/\S/.test(t) ? 1 : 0), 0);
  const [shown, setShown] = useState(reduced() ? wordCount : 0);

  useEffect(() => {
    if (reduced()) {
      setShown(wordCount);
      return;
    }
    setShown(0);
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n + 1 >= wordCount) window.clearInterval(id);
        return Math.min(n + 1, wordCount);
      });
    }, gap);
    return () => window.clearInterval(id);
  }, [text, gap, wordCount]);

  let wi = 0;
  return (
    <div className={className ? `t-stream ${className}` : "t-stream"} style={style}>
      {tokens.map((tok, i) =>
        /\S/.test(tok) ? (
          <span key={i} className={"t-stream-w" + (wi++ < shown ? " is-in" : "")}>
            {tok}
          </span>
        ) : (
          tok
        ),
      )}
    </div>
  );
}

export default WordStream;
