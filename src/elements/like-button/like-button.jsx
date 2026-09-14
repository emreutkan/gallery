// Transitions.dev — Like button (React, self-contained)
// Drop into any React project — no extra CSS file needed.
// Source: https://transitions.dev
//
// Changes from upstream: liked can be controlled via `liked`/
// `onLikedChange` (internal state when uncontrolled), a `children`
// label slot, and className passthrough.

import { useRef, useState } from "react";

// ── Styles ──────────────────────────────────────────────
// Auto-injected on first import. Idempotent (guarded by
// the element id) and SSR-safe (no-ops without document).
const __TRANSITION_STYLES = `
:root {
  --like-color: #f40051;
  --like-fill: 150ms;
  --like-pop: 350ms;
  --like-pop-ease: cubic-bezier(0.34, 1.96, 0.64, 1);
  --like-particle-dur: 600ms;
  --like-particle-dist: 20px;
  --like-particle-size: 2.5px;
  --like-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

.t-like-heart { color: currentColor; transition: color var(--like-fill) var(--like-ease); }
.t-like-heart path {
  fill: transparent; stroke: currentColor;
  transition: fill var(--like-fill) var(--like-ease), stroke var(--like-fill) var(--like-ease);
}
.t-like[data-liked="true"] .t-like-heart { color: var(--like-color); }
.t-like[data-liked="true"] .t-like-heart path { fill: currentColor; }
/* Pop scale lives on an HTML wrapper, never the <svg> itself:
   transforming an inline SVG makes Chromium rasterise it at 1×
   (pixelated on hi-DPI). Wrapping keeps the vector crisp. */
.t-like[data-liked="true"] .t-like-icon { animation: t-like-pop var(--like-pop) var(--like-pop-ease); }
@keyframes t-like-pop { 0% { transform: scale(1); } 30% { transform: scale(0.82); } 100% { transform: scale(1); } }

/* Particle burst — 8 dots flung along per-particle vectors. */
.t-like-particles { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; color: var(--like-color); }
.t-like-particles i {
  position: absolute;
  left: calc(var(--like-particle-size) * var(--psize, 1) / -2);
  top: calc(var(--like-particle-size) * var(--psize, 1) / -2);
  width: calc(var(--like-particle-size) * var(--psize, 1));
  height: calc(var(--like-particle-size) * var(--psize, 1));
  border-radius: 50%; background: currentColor; opacity: 0;
}
@keyframes t-like-burst {
  0%   { opacity: 0; transform: translate(0, 0) scale(0.4); }
  20%  { opacity: 1; transform: translate(calc(var(--px) * 0.25), calc(var(--py) * 0.25)) scale(1); }
  100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(var(--p-end-scale, 0.6)); }
}
.t-like.is-bursting .t-like-particles i {
  animation: t-like-burst var(--pdur, var(--like-particle-dur)) ease-out var(--pdelay, 0ms) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .t-like-icon, .t-like-particles i { animation: none !important; }
}
`;
if (typeof document !== "undefined" && !document.getElementById("transitions-p23")) {
  const __style = document.createElement("style");
  __style.id = "transitions-p23";
  __style.textContent = __TRANSITION_STYLES;
  document.head.appendChild(__style);
}

// Liking fills the heart, springs a pop, and fires an 8-dot burst whose
// per-particle vectors / velocity / delay / size are re-randomised each
// time so the spray never repeats.
const DIST = 20; // px — matches --like-particle-dist

export function LikeButton({
  liked: likedProp,
  defaultLiked = false,
  onLikedChange,
  children = "Like",
  className = "",
  ...props
}) {
  const isControlled = likedProp !== undefined;
  const [internalLiked, setInternalLiked] = useState(defaultLiked);
  const liked = isControlled ? likedProp : internalLiked;
  const ref = useRef(null);

  function seedParticles() {
    const dots = ref.current.querySelectorAll(".t-like-particles i");
    dots.forEach((dot, i) => {
      const angle = (360 / dots.length) * i + (Math.random() * 2 - 1) * 16;
      const mag = DIST * (0.68 + Math.random() * 0.5);
      const rad = (angle * Math.PI) / 180;
      const s = dot.style;
      s.setProperty("--px", `${(Math.cos(rad) * mag).toFixed(2)}px`);
      s.setProperty("--py", `${(Math.sin(rad) * mag).toFixed(2)}px`);
      s.setProperty("--pdur", `calc(var(--like-particle-dur) * ${(0.78 + Math.random() * 0.44).toFixed(3)})`);
      s.setProperty("--pdelay", `${Math.round(Math.random() * 70)}ms`);
      s.setProperty("--p-end-scale", (0.35 + Math.random() * 0.4).toFixed(2));
      s.setProperty("--psize", (0.6 + Math.random() * 0.8).toFixed(2));
    });
  }

  function toggle() {
    const el = ref.current;
    const next = !liked;
    if (!isControlled) setInternalLiked(next);
    onLikedChange?.(next);
    if (!next) {
      el.classList.remove("is-bursting");
      return;
    }
    el.classList.remove("is-bursting");
    seedParticles();
    void el.offsetWidth; // reflow so the burst replays
    el.classList.add("is-bursting");
  }

  return (
    <button
      ref={ref}
      type="button"
      className={className ? `t-like ${className}` : "t-like"}
      data-liked={liked ? "true" : "false"}
      aria-pressed={liked}
      onClick={toggle}
      {...props}
    >
      <span className="t-like-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="t-like-heart" aria-hidden="true">
          <path
            d="M7.99511 3.42388C6.66221 1.8656 4.4395 1.44643 2.76947 2.87334C1.09944 4.30026 0.86432 6.68598 2.17581 8.3736C3.26622 9.77674 6.56619 12.7361 7.64774 13.6939C7.76874 13.801 7.82925 13.8546 7.89982 13.8757C7.96141 13.8941 8.02881 13.8941 8.0904 13.8757C8.16097 13.8546 8.22147 13.801 8.34248 13.6939C9.42403 12.7361 12.724 9.77674 13.8144 8.3736C15.1259 6.68598 14.9195 4.28525 13.2207 2.87334C11.522 1.46144 9.32801 1.8656 7.99511 3.42388Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="t-like-particles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => <i key={i} />)}
      </span>
      {children}
    </button>
  );
}

export default LikeButton;
