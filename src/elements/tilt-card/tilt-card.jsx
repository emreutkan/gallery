// Transitions.dev — Card hover tilt (React, self-contained)
// Drop into any React project — no extra CSS file needed.
// Source: https://transitions.dev
//
// Verbatim except className/style passthrough on the outer wrapper.

import { useRef } from "react";

// ── Styles ──────────────────────────────────────────────
// Auto-injected on first import. Idempotent (guarded by
// the element id) and SSR-safe (no-ops without document).
const __TRANSITION_STYLES = `
:root {
  --tilt-perspective: 1000px;
  --tilt-return: 1000ms;
  --tilt-return-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --tilt-follow: 400ms;
  --tilt-follow-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --tilt-glare-opacity: 0.32;
  --tilt-glare-fade: 300ms;
  --tilt-glare-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

/* The outer wrapper is the flat hit area; touch-action:none
   lets a finger drag tilt the card instead of scrolling the
   page, so tap-hold-drag works on mobile. */
.t-tilt { touch-action: none; }
/* The card tilts toward the pointer via rotateX/rotateY fed
   from JS; on leave it eases back to flat. A separate
   .is-tilting class swaps in a short linear follow while the
   pointer moves so the tilt tracks the cursor 1:1. */
.t-tilt-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  transform:
    perspective(var(--tilt-perspective))
    rotateX(var(--tilt-rx, 0deg))
    rotateY(var(--tilt-ry, 0deg));
  transform-style: preserve-3d;
  transition: transform var(--tilt-return) var(--tilt-return-ease);
  will-change: transform;
}
.t-tilt-card.is-tilting {
  transition: transform var(--tilt-follow) var(--tilt-follow-ease);
}
/* Cursor-tracked glare: layered soft circles that add like
   light (screen blend) at the pointer position. */
.t-tilt-glare {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  mix-blend-mode: screen;
  background:
    radial-gradient(circle 95px at var(--tilt-gx, 50%) var(--tilt-gy, 50%),
      rgba(255,255,255,0.48), rgba(255,255,255,0.06) 52%, rgba(255,255,255,0) 84%),
    radial-gradient(circle 200px at var(--tilt-gx, 50%) var(--tilt-gy, 50%),
      rgba(255,255,255,0.22), rgba(255,255,255,0.04) 58%, rgba(255,255,255,0) 78%),
    radial-gradient(circle 360px at var(--tilt-gx, 50%) var(--tilt-gy, 50%),
      rgba(255,255,255,0.10), rgba(255,255,255,0) 88%);
  transition: opacity var(--tilt-glare-fade) var(--tilt-glare-ease);
}
.t-tilt.is-hover .t-tilt-glare { opacity: var(--tilt-glare-opacity); }

@media (prefers-reduced-motion: reduce) {
  .t-tilt-card { transform: none !important; transition: none !important; }
}
`;
if (typeof document !== "undefined" && !document.getElementById("transitions-p19")) {
  const __style = document.createElement("style");
  __style.id = "transitions-p19";
  __style.textContent = __TRANSITION_STYLES;
  document.head.appendChild(__style);
}

// The pointer is tracked on the OUTER wrapper (which never transforms)
// so the tilting card can't pull its own edges out from under the
// cursor. rotateX/Y + glare position are written into CSS vars.
export function TiltCard({ children, max = 32, className = "", style }) {
  const wrapRef = useRef(null);
  const cardRef = useRef(null);

  const onMove = (e) => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    const r = wrap.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    wrap.classList.add("is-hover");
    card.classList.add("is-tilting");
    card.style.setProperty("--tilt-ry", ((px - 0.5) * max).toFixed(2) + "deg");
    card.style.setProperty("--tilt-rx", ((0.5 - py) * max).toFixed(2) + "deg");
    card.style.setProperty("--tilt-gx", (px * 100).toFixed(1) + "%");
    card.style.setProperty("--tilt-gy", (py * 100).toFixed(1) + "%");
  };

  const onLeave = () => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (wrap) wrap.classList.remove("is-hover");
    if (card) {
      card.classList.remove("is-tilting");
      card.style.setProperty("--tilt-rx", "0deg");
      card.style.setProperty("--tilt-ry", "0deg");
    }
  };

  return (
    <div
      ref={wrapRef}
      className={className ? `t-tilt ${className}` : "t-tilt"}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div ref={cardRef} className="t-tilt-card">
        {children}
        <div className="t-tilt-glare" aria-hidden="true" />
      </div>
    </div>
  );
}

export default TiltCard;
