// loading-dev — shared spinner frame (React, self-contained)
// Source: https://loading.dev · github.com/jakubkrehel/loading (MIT)
//
// Ported verbatim from loading-dev 0.3.0. Every spinner renders a
// <style href precedence> tag — React 19 hoists + dedupes it by href,
// so each spinner ships its own CSS with zero setup.
//
// Tuning contract on every spinner's root element:
//   --ld-size        (px)      — via the size prop
//   --ld-duration    (ms)      — via the duration prop
//   --ld-play-state  (running|paused) — via the playState prop
//   color                     — via the color prop (inherits currentColor)

export const DURATION_VAR = "--ld-duration";
export const PLAY_STATE_VAR = "--ld-play-state";
export const SIZE_VAR = "--ld-size";
export const DEFAULT_SIZE = 20;
export const SIZE = `var(${SIZE_VAR}, ${DEFAULT_SIZE}px)`;

const SPINNER_MOTION = {
  arc: { duration: 800 },
  "bouncing-dots": { duration: 500 },
  comet: { duration: 700 },
  "linear-dots": { duration: 900 },
  ring: { duration: 800 },
};

export function duration(name) {
  return `var(${DURATION_VAR}, ${SPINNER_MOTION[name].duration}ms)`;
}

export const PLAY_STATE = `var(${PLAY_STATE_VAR}, running)`;

export const DEFAULT_EASING = "linear";
export function spinClass(name, easing = DEFAULT_EASING) {
  const base = `ld-${name}-spin`;
  return easing === "linear" ? base : `${base} ${base}-${easing}`;
}

// Rotating spinners share one recipe: a 0→360 keyframe, a linear
// default, an ease-in-out variant, and a "stacked" variant that adds
// two identical rotations (one linear, one eased) so the composite
// speeds up and slows down without ever stopping.
export function rotationCss(name) {
  return `
.ld-${name}-spin {
  transform-origin: center;
  animation: ld-${name}-rotate ${duration(name)} linear infinite;
  animation-play-state: ${PLAY_STATE};
}

.ld-${name}-spin-ease-in-out {
  animation-timing-function: ease-in-out;
}

.ld-${name}-spin-stacked {
  animation-name: ld-${name}-rotate, ld-${name}-rotate;
  animation-timing-function: linear, ease-in-out;
  animation-composition: add;
}

@keyframes ld-${name}-rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ld-${name}-spin {
    animation: none;
  }
}
`;
}

export function SpinnerStyle({ children, name }) {
  return <style href={`ld-${name}`} precedence="loading-dev">{children}</style>;
}

export function cssVars(vars) {
  return vars;
}

export function spinnerRoot(
  name,
  { className, color, duration: dur, playState, size = DEFAULT_SIZE, style, ...rest },
) {
  return {
    "aria-hidden": true,
    className: [`ld-${name}`, className].filter(Boolean).join(" "),
    style: cssVars({
      [SIZE_VAR]: `${size}px`,
      ...(color === undefined ? null : { color }),
      ...(dur === undefined ? null : { [DURATION_VAR]: `${dur}ms` }),
      ...(playState === undefined ? null : { [PLAY_STATE_VAR]: playState }),
      ...style,
    }),
    ...rest,
  };
}
