// loading-dev — Linear dots (React, self-contained)
// Source: https://loading.dev/spinners/linear-dots · MIT
// Three dots lighting up in turn from left to right. Each dot runs the
// same fade with a negative, step-fractioned delay — a phase offset,
// not a start offset, so the wave is already mid-cycle on mount.

import {
  SIZE, SpinnerStyle, cssVars, duration, PLAY_STATE, spinnerRoot,
} from "./frame";


const COUNT = 3;
const DOTS = Array.from({ length: COUNT }, (_, index) => ({
  step: (COUNT - index) % COUNT,
}));
const dur = duration("linear-dots");

const css = `
.ld-linear-dots {
  display: flex;
  align-items: center;
  gap: calc(${SIZE} * 0.1875);
  height: ${SIZE};
}

.ld-linear-dots-dot {
  width: calc(${SIZE} * 0.1875);
  height: calc(${SIZE} * 0.1875);
  background: currentColor;
  border-radius: 9999px;
  animation: ld-linear-dots-fade ${dur} linear infinite;
  animation-delay: calc(${dur} * var(--ld-linear-dots-step) / -${COUNT});
  animation-play-state: ${PLAY_STATE};
}

@keyframes ld-linear-dots-fade {
  0% {
    opacity: 1;
  }
  66.67% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ld-linear-dots-dot {
    opacity: 0.75;
    animation: none;
  }
}
`;

export function LinearDots(props) {
  return (
    <>
      <SpinnerStyle name="linear-dots">{css}</SpinnerStyle>
      <div {...spinnerRoot("linear-dots", props)}>
        {DOTS.map((dot, index) => (
          <div
            className="ld-linear-dots-dot"
            style={cssVars({ "--ld-linear-dots-step": dot.step })}
            key={index}
          />
        ))}
      </div>
    </>
  );
}
