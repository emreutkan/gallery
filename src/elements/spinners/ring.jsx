// loading-dev — Ring (React, self-contained)
// Source: https://loading.dev/spinners/ring · MIT
// An arc rotating in a faint circle.

import {
  DEFAULT_SIZE, SpinnerStyle, rotationCss, spinClass, spinnerRoot,
} from "./frame";

const css = rotationCss("ring");

export function Ring({ easing, size = DEFAULT_SIZE, ...rest }) {
  return (
    <>
      <SpinnerStyle name="ring">{css}</SpinnerStyle>
      <svg
        {...spinnerRoot("ring", { ...rest, size })}
        fill="none"
        height={size}
        role="presentation"
        viewBox="0 0 24 24"
        width={size}
      >
        <circle
          cx="12"
          cy="12"
          opacity="0.2"
          r="10"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <circle
          className={spinClass("ring", easing)}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeDasharray="16 46.8"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      </svg>
    </>
  );
}
