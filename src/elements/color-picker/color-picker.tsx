// Adapted from fluidfunctionalism.com/r/base/color-picker.json —
// framer-motion, @base-ui/react (popover/menu/number-field), Tailwind, and
// the shared libs removed. Zero-dependency port.
//
// Substitutions:
// - Slider (components/ui/slider) → local GradientSlider: pointer-drag thumb
//   + arrow-key steps, same gradient tracks.
// - Base UI Menu → local FormatDropdown popup: radio semantics, arrow nav,
//   Esc/outside dismissal, deferred unmount for the exit tween.
// - Base UI NumberField+ScrubArea → local ScrubColorInput: press-and-drag
//   horizontally to scrub, click to edit, Enter commits, Esc reverts.
// - Base UI Popover → local anchored popup inside a relative wrapper (no
//   portal), same dismissal/focus contract.
// - Tooltip → `data-tip` CSS tooltip; motion springs → CSS transitions.
// Source: https://www.fluidfunctionalism.com/docs/color-picker

import {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useId,
  type ReactNode,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
} from "react";
import { SizeProvider, useSize, type SizeVariant } from "./size-context";
import {
  clamp01,
  hsvToRgb,
  rgbToHsv,
  rgbToHsl,
  hslToRgb,
  rgbToOklch,
  oklchToRgb,
  rgbToHexStr,
  parseColor,
  resolveCssColor,
  buildParsed,
  formatValueByFormat,
  type ColorFormat,
  type ParsedColor,
} from "./color-math";
import "./color-picker.css";

const cn = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(" ");

const fontWeights = {
  normal: "'wght' 400, 'opsz' 14",
  medium: "'wght' 500, 'opsz' 16",
  semibold: "'wght' 550, 'opsz' 18",
} as const;

const PANEL_WIDTH = 280;
const SQUARE_HEIGHT = 156;
const CHECKER_BG: CSSProperties = {
  backgroundImage:
    "conic-gradient(var(--cp-checker-a) 0 25%, var(--cp-checker-b) 0 50%, var(--cp-checker-a) 0 75%, var(--cp-checker-b) 0)",
  backgroundSize: "8px 8px",
};

// ---------------------------------------------------------------------------
// GradientSlider — local replacement for the shared Slider primitive.
// Gradient track (caller-supplied), drag thumb, arrow/Home/End keys.
// ---------------------------------------------------------------------------

interface GradientSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  thumbColor: string;
  trackStyle: CSSProperties;
  "aria-label": string;
}

function GradientSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  thumbColor,
  trackStyle,
  "aria-label": ariaLabel,
}: GradientSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const t = clamp01((clientX - rect.left) / rect.width);
      onChange(Math.round((min + t * (max - min)) / step) * step);
    },
    [min, max, step, onChange],
  );

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      className="cp-slider"
      style={trackStyle}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromPointer(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging) updateFromPointer(e.clientX);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={(e) => {
        const big = e.shiftKey ? step * 10 : step;
        let next: number | null = null;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - big;
        else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = value + big;
        else if (e.key === "Home") next = min;
        else if (e.key === "End") next = max;
        if (next != null) {
          e.preventDefault();
          onChange(Math.max(min, Math.min(max, next)));
        }
      }}
    >
      <div
        className="cp-slider-thumb"
        style={{
          left: `${pct}%`,
          backgroundColor: thumbColor,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SaturationSquare — the SV pad. Ported verbatim minus framer-motion.
// ---------------------------------------------------------------------------

interface SaturationSquareProps {
  h: number;
  s: number;
  v: number;
  onChange: (s: number, v: number) => void;
}

function SaturationSquare({ h, s, v, onChange }: SaturationSquareProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp01((clientX - rect.left) / rect.width);
      const y = clamp01((clientY - rect.top) / rect.height);
      onChange(x, 1 - y);
    },
    [onChange],
  );

  const updateCursorPos = useCallback((clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setCursorPos({
      x: clamp01((clientX - rect.left) / rect.width) * 100,
      y: clamp01((clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      updateFromPointer(e.clientX, e.clientY);
    },
    [updateFromPointer],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      updateCursorPos(e.clientX, e.clientY);
      if (!dragging) return;
      updateFromPointer(e.clientX, e.clientY);
    },
    [dragging, updateFromPointer, updateCursorPos],
  );

  const onPointerUp = useCallback(() => setDragging(false), []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 0.1 : 0.01;
      let nextS = s,
        nextV = v,
        handled = true;
      if (e.key === "ArrowLeft") nextS = clamp01(s - step);
      else if (e.key === "ArrowRight") nextS = clamp01(s + step);
      else if (e.key === "ArrowUp") nextV = clamp01(v + step);
      else if (e.key === "ArrowDown") nextV = clamp01(v - step);
      else handled = false;
      if (handled) {
        e.preventDefault();
        onChange(nextS, nextV);
      }
    },
    [onChange, s, v],
  );

  const { r, g, b } = hsvToRgb(h, s, v);
  const thumbColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

  return (
    <div
      ref={ref}
      role="application"
      aria-label="Saturation and brightness"
      tabIndex={0}
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible")) setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        setCursorPos(null);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      className={cn("cp-sq", focused && "cp-focused")}
      style={{ height: SQUARE_HEIGHT }}
    >
      <div
        className="cp-sq-gradient"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h}, 100%, 50%))`,
        }}
      />
      <div
        className="cp-sq-thumb"
        style={{
          left: `${s * 100}%`,
          top: `${(1 - v) * 100}%`,
          backgroundColor: thumbColor,
        }}
      />
      {hovered && !dragging && cursorPos && (
        <div
          className="cp-sq-ghost"
          style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HueSlider / AlphaSlider
// ---------------------------------------------------------------------------

function HueSlider({ h, onChange }: { h: number; onChange: (h: number) => void }) {
  return (
    <GradientSlider
      value={h}
      onChange={onChange}
      min={0}
      max={360}
      step={1}
      thumbColor={`hsl(${h}, 100%, 50%)`}
      trackStyle={{
        background:
          "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))",
      }}
      aria-label="Hue"
    />
  );
}

function AlphaSlider({
  a,
  solidColor,
  solidR,
  solidG,
  solidB,
  onChange,
}: {
  a: number;
  solidColor: string;
  solidR: number;
  solidG: number;
  solidB: number;
  onChange: (a: number) => void;
}) {
  // Color-aware transparent stop (same hue, alpha 0) keeps the gradient
  // chromatically consistent to fully opaque with no edge gap.
  const transparentColor = `rgba(${solidR}, ${solidG}, ${solidB}, 0)`;
  return (
    <GradientSlider
      value={Math.round(a * 100)}
      onChange={(v) => onChange(v / 100)}
      min={0}
      max={100}
      step={1}
      thumbColor={solidColor}
      trackStyle={{
        backgroundImage: `linear-gradient(to right, ${transparentColor} 0%, ${solidColor} 98%), conic-gradient(var(--cp-checker-a) 0 25%, var(--cp-checker-b) 0 50%, var(--cp-checker-a) 0 75%, var(--cp-checker-b) 0)`,
        backgroundSize: "100% 100%, 8px 8px",
      }}
      aria-label="Alpha"
    />
  );
}

// ---------------------------------------------------------------------------
// FormatDropdown — Base UI Menu → local popup with radio semantics, arrow
// nav, Esc/outside dismissal, and a sliding highlight.
// ---------------------------------------------------------------------------

const FORMAT_LABELS: Record<ColorFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  oklch: "OKLCH",
};

const FORMATS = ["hex", "rgb", "hsl", "oklch"] as const;
const MENU_EXIT_MS = 120;

function FormatDropdown({
  value,
  onChange,
  open: openProp,
  defaultOpen = false,
}: {
  value: ColorFormat;
  onChange: (f: ColorFormat) => void;
  open?: boolean;
  defaultOpen?: boolean;
}) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = useCallback(
    (next: boolean | ((v: boolean) => boolean)) => {
      if (!isControlled)
        setInternalOpen(typeof next === "function" ? next(open) : next);
    },
    [isControlled, open],
  );
  const [render, setRender] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sizeClasses = useSize();
  const menuId = useId();

  const checkedIndex = FORMATS.indexOf(value);

  // Deferred unmount so the exit tween plays (upstream: actionsRef pattern).
  useEffect(() => {
    if (open) {
      setRender(true);
      return;
    }
    const id = setTimeout(() => setRender(false), MENU_EXIT_MS);
    return () => clearTimeout(id);
  }, [open]);

  // Outside press + Esc close; arrow keys move the highlight.
  useEffect(() => {
    if (!render) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        wrapRef.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [render]);

  useEffect(() => {
    if (open) {
      setHighlight(checkedIndex === -1 ? 0 : checkedIndex);
      // Focus the checked item once the popup is laid out.
      requestAnimationFrame(() =>
        itemRefs.current[checkedIndex === -1 ? 0 : checkedIndex]?.focus(),
      );
    } else {
      setHighlight(null);
    }
  }, [open, checkedIndex]);

  const moveHighlight = (dir: 1 | -1) => {
    setHighlight((prev) => {
      const next =
        ((prev ?? checkedIndex) + dir + FORMATS.length) % FORMATS.length;
      itemRefs.current[next]?.focus();
      return next;
    });
  };

  return (
    <div ref={wrapRef} className="cp-dd">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={cn(
          "cp-dd-trigger",
          sizeClasses.control,
          sizeClasses.px,
          sizeClasses.text,
          open && "lit",
        )}
        style={{ fontVariationSettings: fontWeights.medium }}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{FORMAT_LABELS[value]}</span>
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={cn("cp-dd-chevron", open && "open")}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {render && (
        <div
          id={menuId}
          role="menu"
          className="cp-dd-menu"
          data-on={open || undefined}
          onMouseLeave={() => setHighlight(checkedIndex)}
        >
          {FORMATS.map((f, i) => (
            <button
              key={f}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={i === checkedIndex}
              className={cn(
                "cp-dd-item",
                sizeClasses.text,
                (highlight === i || i === checkedIndex) && "lit",
              )}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => {
                onChange(f);
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  moveHighlight(1);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  moveHighlight(-1);
                }
              }}
            >
              <span className="cp-dd-label">
                <span
                  className="cp-dd-ghost"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                  aria-hidden="true"
                >
                  {FORMAT_LABELS[f]}
                </span>
                <span
                  className="cp-dd-vis"
                  style={{
                    fontVariationSettings:
                      i === checkedIndex
                        ? fontWeights.semibold
                        : fontWeights.normal,
                  }}
                >
                  {FORMAT_LABELS[f]}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorInput — text input (commit on blur/Enter, Esc reverts, arrows nudge)
// and a scrub variant (drag horizontally, click to edit).
// ---------------------------------------------------------------------------

interface ColorInputProps {
  value: string;
  onCommit: (next: string) => void;
  ariaLabel: string;
  width?: number | string;
  className?: string;
  inputClassName?: string;
  align?: "left" | "center" | "right";
  prefix?: ReactNode;
  inputMode?: "text" | "numeric" | "decimal";
  nudgeStep?: number;
  nudgeShiftStep?: number;
  hasPercent?: boolean;
  decimals?: number;
  min?: number;
  max?: number;
  wrap?: boolean;
  scrubbable?: boolean;
}

const TextColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  (
    {
      value,
      onCommit,
      ariaLabel,
      width,
      className,
      inputClassName,
      align = "left",
      prefix,
      inputMode = "text",
      nudgeStep,
      nudgeShiftStep,
      hasPercent = false,
      decimals,
      min,
      max,
      wrap = false,
    },
    ref,
  ) => {
    const [draft, setDraft] = useState(value);
    const interactingRef = useRef(false);
    const sizeClasses = useSize();
    const compact = sizeClasses.variant === "compact";

    useEffect(() => {
      if (!interactingRef.current) setDraft(value);
    }, [value]);

    const formatNumber = (n: number) =>
      decimals != null ? n.toFixed(decimals) : String(Math.round(n));

    const commitNumber = (n: number) => {
      let bounded = n;
      if (wrap && min != null && max != null) {
        const range = max - min;
        bounded = ((((bounded - min) % range) + range) % range) + min;
      } else {
        if (min != null) bounded = Math.max(min, bounded);
        if (max != null) bounded = Math.min(max, bounded);
      }
      const formatted = formatNumber(bounded);
      const withSuffix = hasPercent ? `${formatted}%` : formatted;
      setDraft(withSuffix);
      onCommit(withSuffix);
    };

    const nudge = (direction: 1 | -1, shift: boolean) => {
      const baseStep = shift ? nudgeShiftStep ?? 10 : nudgeStep ?? 1;
      const cur = parseFloat(draft.replace("%", ""));
      if (Number.isNaN(cur)) return;
      commitNumber(cur + direction * baseStep);
    };

    return (
      <div
        className={cn("cp-input", sizeClasses.control, className)}
        style={{ width }}
      >
        {prefix && (
          <span className={cn("cp-input-prefix", compact && "compact")}>
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => {
            interactingRef.current = true;
            e.currentTarget.select();
          }}
          onBlur={() => {
            interactingRef.current = false;
            if (draft !== value) {
              const numeric = parseFloat(draft.replace("%", ""));
              if (!Number.isNaN(numeric) && (min != null || max != null)) {
                commitNumber(numeric);
              } else {
                onCommit(draft);
              }
            } else setDraft(value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setDraft(value);
              e.currentTarget.blur();
            } else if (
              (nudgeStep != null || nudgeShiftStep != null) &&
              (e.key === "ArrowUp" || e.key === "ArrowDown")
            ) {
              e.preventDefault();
              nudge(e.key === "ArrowUp" ? 1 : -1, e.shiftKey);
            }
          }}
          inputMode={inputMode}
          aria-label={ariaLabel}
          className={cn(
            "cp-input-field",
            sizeClasses.text,
            align === "center" && "tac",
            align === "right" && "tar",
            inputClassName,
          )}
          style={{ fontVariationSettings: fontWeights.medium }}
        />
      </div>
    );
  },
);
TextColorInput.displayName = "TextColorInput";

// Drag-scrub number field: press and drag horizontally on the field to nudge
// the value continuously (cursor swaps to the ↔ glyph); a no-drag press
// clicks through into normal text editing.
const ScrubColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  (
    {
      value,
      onCommit,
      ariaLabel,
      width,
      className,
      inputClassName,
      align = "left",
      prefix,
      inputMode = "numeric",
      nudgeStep,
      nudgeShiftStep,
      hasPercent = false,
      decimals,
      min,
      max,
      wrap = false,
    },
    ref,
  ) => {
    const sizeClasses = useSize();
    const compact = sizeClasses.variant === "compact";
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [editing, setEditing] = useState(false);
    const [scrubbing, setScrubbing] = useState(false);
    const pointerDownRef = useRef(false);
    const scrubRef = useRef<{ startX: number; startValue: number } | null>(
      null,
    );

    const numeric = parseFloat(String(value).replace("%", ""));
    const fieldValue = Number.isNaN(numeric) ? null : numeric;
    // Always controlled: `draft` while editing, the formatted display at rest.
    const [draft, setDraft] = useState<string | null>(null);

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
      },
      [ref],
    );

    const formatNumber = useCallback(
      (n: number) =>
        decimals != null ? n.toFixed(decimals) : String(Math.round(n)),
      [decimals],
    );

    const commit = useCallback(
      (n: number) => {
        let bounded = n;
        if (wrap && min != null && max != null) {
          if (bounded < min || bounded > max) {
            const range = max - min;
            bounded = ((((bounded - min) % range) + range) % range) + min;
          }
        } else {
          if (min != null) bounded = Math.max(min, bounded);
          if (max != null) bounded = Math.min(max, bounded);
        }
        onCommit(
          hasPercent
            ? `${formatNumber(bounded)}%`
            : formatNumber(bounded),
        );
      },
      [wrap, min, max, formatNumber, hasPercent, onCommit],
    );

    const onScrubStart = (e: React.PointerEvent) => {
      if (editing) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointerDownRef.current = true;
      scrubRef.current = {
        startX: e.clientX,
        startValue: fieldValue ?? 0,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onScrubMove = (e: React.PointerEvent) => {
      const scrub = scrubRef.current;
      if (!scrub || editing) return;
      const dx = e.clientX - scrub.startX;
      if (Math.abs(dx) < 2 && !scrubbing) return;
      if (!scrubbing) setScrubbing(true);
      const step = nudgeStep ?? 1;
      commit(scrub.startValue + dx * step);
    };

    const onScrubEnd = (e: React.PointerEvent) => {
      const scrub = scrubRef.current;
      scrubRef.current = null;
      const wasScrubbing = scrubbing;
      setScrubbing(false);
      if (!scrub) return;
      // A no-drag press enters edit mode — focus + select, like the old
      // click-to-edit behavior.
      if (!wasScrubbing) {
        pointerDownRef.current = false;
        setEditing(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      } else {
        pointerDownRef.current = false;
        inputRef.current?.blur();
      }
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const display =
      fieldValue == null
        ? String(value)
        : hasPercent
          ? `${formatNumber(fieldValue)}%`
          : formatNumber(fieldValue);

    return (
      <div
        className={cn(
          "cp-input cp-scrub",
          sizeClasses.control,
          scrubbing && "scrubbing",
          className,
        )}
        style={{ width }}
        onPointerDown={onScrubStart}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubEnd}
        onPointerCancel={onScrubEnd}
      >
        {scrubbing && (
          <span className="cp-scrub-cursor" aria-hidden="true">
            <svg
              width={24}
              height={14}
              viewBox="0 0 24 14"
              fill="#000"
              stroke="#fff"
              strokeWidth={1}
            >
              <path d="M0.5 7l5-5v3.5h13V2l5 5-5 5V8.5h-13V12l-5-5z" />
            </svg>
          </span>
        )}
        {prefix && (
          <span className={cn("cp-input-prefix", compact && "compact")}>
            {prefix}
          </span>
        )}
        <input
          ref={setInputRef}
          aria-label={ariaLabel}
          inputMode={inputMode}
          value={draft ?? display}
          onChange={(e) => setDraft(e.target.value)}
          readOnly={!editing}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const n = parseFloat(e.currentTarget.value.replace("%", ""));
              if (!Number.isNaN(n)) commit(n);
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setDraft(null);
              e.currentTarget.blur();
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const cur =
                fieldValue ?? parseFloat(e.currentTarget.value.replace("%", ""));
              if (!Number.isNaN(cur))
                commit(
                  cur +
                    (e.key === "ArrowUp" ? 1 : -1) *
                      (e.shiftKey ? nudgeShiftStep ?? 10 : nudgeStep ?? 1),
                );
            }
          }}
          onFocus={(e) => {
            if (pointerDownRef.current) return; // scrub-initiated focus
            setEditing(true);
            setDraft(display);
            e.currentTarget.select();
          }}
          onBlur={() => {
            setEditing(false);
            const text = draft;
            setDraft(null);
            const n = parseFloat((text ?? "").replace("%", ""));
            if (!Number.isNaN(n)) commit(n);
          }}
          onPointerDown={(e) => {
            // While editing, the input owns caret placement and selection.
            if (editing) e.stopPropagation();
          }}
          className={cn(
            "cp-input-field",
            sizeClasses.text,
            align === "center" && "tac",
            align === "right" && "tar",
            !editing && "cp-no-edit",
            inputClassName,
          )}
          style={{ fontVariationSettings: fontWeights.medium }}
        />
      </div>
    );
  },
);
ScrubColorInput.displayName = "ScrubColorInput";

const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  ({ scrubbable = false, ...props }, ref) =>
    scrubbable ? (
      <ScrubColorInput ref={ref} {...props} />
    ) : (
      <TextColorInput ref={ref} {...props} />
    ),
);
ColorInput.displayName = "ColorInput";

// ---------------------------------------------------------------------------
// EyeDropperButton
// ---------------------------------------------------------------------------

interface EyeDropperGlobal {
  open(): Promise<{ sRGBHex: string }>;
}

const PipetteGlyph = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m2 22 1-4h9l7-7a2.83 2.83 0 0 0-4-4l-7 7v9l-4 1z" />
    <path d="m14 5 4 4" />
  </svg>
);

function EyeDropperButton({ onPick }: { onPick: (hex: string) => void }) {
  const [supported, setSupported] = useState(false);
  const sizeClasses = useSize();

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "EyeDropper" in window);
  }, []);

  if (!supported) return null;

  const handleClick = async () => {
    try {
      const Ctor = (
        window as unknown as { EyeDropper: new () => EyeDropperGlobal }
      ).EyeDropper;
      const eye = new Ctor();
      const result = await eye.open();
      onPick(result.sRGBHex);
    } catch {
      // user cancelled
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Pick color from screen"
      className={cn(
        "cp-eye",
        sizeClasses.control,
        sizeClasses.px,
      )}
    >
      <PipetteGlyph size={sizeClasses.icon} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// ColorTile / ColorSwatch / SwatchStrip
// ---------------------------------------------------------------------------

interface ColorTileProps {
  color: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function ColorTile({
  color,
  size = 24,
  className,
  style,
}: ColorTileProps) {
  return (
    <span
      className={cn("cp-tile", className)}
      style={{
        width: size,
        height: size,
        ...CHECKER_BG,
        ...style,
      }}
    >
      <span className="cp-tile-fill" style={{ backgroundColor: color }} />
    </span>
  );
}

interface ColorSwatchProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color: string;
  size?: number;
  selected?: boolean;
}

export const ColorSwatch = forwardRef<HTMLButtonElement, ColorSwatchProps>(
  (
    { color, size = 28, selected, className, onMouseEnter, onMouseLeave, ...props },
    ref,
  ) => {
    const [hovered, setHovered] = useState(false);
    const ring = selected
      ? "inset 0 0 0 1px rgba(127,127,127,0.25), 0 0 0 2px var(--cp-card), 0 0 0 4px #6B97FF"
      : hovered
        ? "inset 0 0 0 1px rgba(127,127,127,0.25), 0 0 0 2px var(--cp-card), 0 0 0 4px rgba(127,127,127,0.4)"
        : "inset 0 0 0 1px rgba(127,127,127,0.25)";
    return (
      <button
        ref={ref}
        type="button"
        aria-label={`Select color ${color}`}
        className={cn("cp-swatch", className)}
        style={{
          width: size,
          height: size,
          ...CHECKER_BG,
          boxShadow: ring,
        }}
        onMouseEnter={(e) => {
          setHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          onMouseLeave?.(e);
        }}
        {...props}
      >
        <span className="cp-tile-fill" style={{ backgroundColor: color }} />
      </button>
    );
  },
);
ColorSwatch.displayName = "ColorSwatch";

function SwatchStrip({
  swatches,
  current,
  onPick,
}: {
  swatches: string[];
  current: string;
  onPick: (color: string) => void;
}) {
  const normalizedCurrent = useMemo(() => {
    const p = parseColor(current);
    return p ? rgbToHexStr(p.r, p.g, p.b, p.a).toLowerCase() : "";
  }, [current]);

  // Named CSS colors ("red", "tomato") need the browser to normalize before
  // the selected-state comparison can match. Resolved in an effect so render
  // never touches the DOM.
  const [resolvedSwatches, setResolvedSwatches] = useState<
    Record<string, string>
  >({});
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const sw of swatches) {
      if (!parseColor(sw)) {
        const p = resolveCssColor(sw);
        if (p) next[sw] = rgbToHexStr(p.r, p.g, p.b, p.a).toLowerCase();
      }
    }
    setResolvedSwatches(next);
  }, [swatches]);

  return (
    <div className="cp-swatches">
      {swatches.map((sw, i) => {
        const parsed = parseColor(sw);
        const normalized = parsed
          ? rgbToHexStr(parsed.r, parsed.g, parsed.b, parsed.a).toLowerCase()
          : resolvedSwatches[sw] ?? sw.toLowerCase();
        return (
          <ColorSwatch
            key={`${sw}-${i}`}
            color={sw}
            size={28}
            selected={normalized === normalizedCurrent}
            onClick={() => onPick(sw)}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChannelTooltip — small CSS tooltip over each channel input.
// ---------------------------------------------------------------------------

function ChannelTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="cp-tip-wrap">
      {children}
      <span className="cp-tip" role="tooltip">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorInputsRow — adapts inputs to the active format.
// ---------------------------------------------------------------------------

type ChannelKey =
  | "hex"
  | "r"
  | "g"
  | "b"
  | "hSL"
  | "sSL"
  | "lSL"
  | "L"
  | "C"
  | "H"
  | "alphaPercent";

function AlphaInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (n: number) => void;
}) {
  return (
    <ChannelTooltip label="Alpha">
      <ColorInput
        value={`${value}%`}
        onCommit={(input) => {
          const n = parseFloat(input.replace("%", ""));
          if (Number.isNaN(n)) return;
          onCommit(Math.max(0, Math.min(100, Math.round(n))));
        }}
        ariaLabel="Alpha"
        align="center"
        inputMode="numeric"
        nudgeStep={1}
        nudgeShiftStep={10}
        hasPercent
        scrubbable
        min={0}
        max={100}
      />
    </ChannelTooltip>
  );
}

function ColorInputsRow({
  parsed,
  format,
  oklchHue,
  onChannelChange,
}: {
  parsed: ParsedColor;
  format: ColorFormat;
  oklchHue?: number | null;
  onChannelChange: (key: ChannelKey, value: string) => void;
}) {
  const alphaPct = Math.round(parsed.a * 100);

  if (format === "hex") {
    const hexNoHash = parsed.hex.replace(/^#/, "").toUpperCase();
    return (
      <div className="cp-channels-2">
        <ChannelTooltip label="Hex">
          <ColorInput
            value={hexNoHash}
            onCommit={(next) =>
              onChannelChange("hex", next.startsWith("#") ? next : `#${next}`)
            }
            ariaLabel="Hex value"
            prefix="#"
          />
        </ChannelTooltip>
        <AlphaInput
          value={alphaPct}
          onCommit={(n) => onChannelChange("alphaPercent", String(n))}
        />
      </div>
    );
  }

  if (format === "rgb") {
    return (
      <div className="cp-channels-4">
        <ChannelTooltip label="Red">
          <ColorInput value={String(parsed.r)} onCommit={(n) => onChannelChange("r", n)} ariaLabel="Red" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={255} />
        </ChannelTooltip>
        <ChannelTooltip label="Green">
          <ColorInput value={String(parsed.g)} onCommit={(n) => onChannelChange("g", n)} ariaLabel="Green" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={255} />
        </ChannelTooltip>
        <ChannelTooltip label="Blue">
          <ColorInput value={String(parsed.b)} onCommit={(n) => onChannelChange("b", n)} ariaLabel="Blue" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={255} />
        </ChannelTooltip>
        <AlphaInput
          value={alphaPct}
          onCommit={(n) => onChannelChange("alphaPercent", String(n))}
        />
      </div>
    );
  }

  if (format === "hsl") {
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    return (
      <div className="cp-channels-4">
        <ChannelTooltip label="Hue">
          <ColorInput value={String(Math.round(hsl.h))} onCommit={(n) => onChannelChange("hSL", n)} ariaLabel="Hue" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={360} wrap />
        </ChannelTooltip>
        <ChannelTooltip label="Saturation">
          <ColorInput value={String(Math.round(hsl.s * 100))} onCommit={(n) => onChannelChange("sSL", n)} ariaLabel="Saturation" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={100} />
        </ChannelTooltip>
        <ChannelTooltip label="Lightness">
          <ColorInput value={String(Math.round(hsl.l * 100))} onCommit={(n) => onChannelChange("lSL", n)} ariaLabel="Lightness" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={100} />
        </ChannelTooltip>
        <AlphaInput
          value={alphaPct}
          onCommit={(n) => onChannelChange("alphaPercent", String(n))}
        />
      </div>
    );
  }

  // oklch
  const oklch = rgbToOklch(parsed.r, parsed.g, parsed.b);
  const displayH = oklchHue ?? oklch.H;
  return (
    <div className="cp-channels-4">
      <ChannelTooltip label="Lightness">
        <ColorInput value={(oklch.L * 100).toFixed(0)} onCommit={(n) => onChannelChange("L", n)} ariaLabel="Lightness" align="center" inputMode="decimal" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={100} />
      </ChannelTooltip>
      <ChannelTooltip label="Chroma">
        <ColorInput value={oklch.C.toFixed(2)} onCommit={(n) => onChannelChange("C", n)} ariaLabel="Chroma" align="center" inputMode="decimal" nudgeStep={0.01} nudgeShiftStep={0.1} decimals={2} scrubbable min={0} max={0.4} />
      </ChannelTooltip>
      <ChannelTooltip label="Hue">
        <ColorInput value={displayH.toFixed(0)} onCommit={(n) => onChannelChange("H", n)} ariaLabel="Hue" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={360} wrap />
      </ChannelTooltip>
      <AlphaInput
        value={alphaPct}
        onCommit={(n) => onChannelChange("alphaPercent", String(n))}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorPicker (panel)
// ---------------------------------------------------------------------------

export interface ColorPickerProps extends HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, parsed: ParsedColor) => void;
  format?: ColorFormat;
  defaultFormat?: ColorFormat;
  onFormatChange?: (format: ColorFormat) => void;
  swatches?: string[];
  hideEyedropper?: boolean;
  formatOpen?: boolean;
  defaultFormatOpen?: boolean;
  size?: SizeVariant;
}

export const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      value,
      defaultValue = "#6B97FF",
      onValueChange,
      format,
      defaultFormat = "hex",
      onFormatChange,
      swatches,
      hideEyedropper,
      formatOpen,
      defaultFormatOpen,
      size,
      className,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(value ?? defaultValue);
    const currentRawValue = isControlled ? (value as string) : internalValue;

    const isFormatControlled = format !== undefined;
    const [internalFormat, setInternalFormat] =
      useState<ColorFormat>(defaultFormat);
    const currentFormat = isFormatControlled
      ? (format as ColorFormat)
      : internalFormat;

    // Internal HSV state (canonical). H is preserved across S=0 / V=0
    // transitions. Deliberately computed once from the initial value only.
    const initialParsed = useMemo(() => {
      const p = parseColor(currentRawValue);
      if (!p) return { h: 0, s: 1, v: 1, a: 1 };
      const hsv = rgbToHsv(p.r, p.g, p.b);
      return { h: hsv.s === 0 ? 0 : hsv.h, s: hsv.s, v: hsv.v, a: p.a };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [hsv, setHsv] = useState(initialParsed);

    // Sticky OKLCH hue: preserves the user's stated OKLCH H across the lossy
    // RGB round-trip (so displayed H doesn't drift after release) and across
    // achromatic colors. Cleared when color changes via a non-OKLCH channel.
    const oklchHueRef = useRef<number | null>(null);

    // External value sync — when the controlled value changes from outside.
    const lastEmittedRef = useRef<string>("");
    useEffect(() => {
      if (!isControlled) return;
      const emitted = lastEmittedRef.current;
      const cur = value as string;
      if (cur === emitted) return;
      const p = parseColor(cur);
      if (!p) return;
      oklchHueRef.current = null;
      const newHsv = rgbToHsv(p.r, p.g, p.b);
      setHsv((prev) => ({
        h: newHsv.s === 0 ? prev.h : newHsv.h,
        s: newHsv.s,
        v: newHsv.v,
        a: p.a,
      }));
    }, [value, isControlled]);

    const parsed = useMemo(
      () => buildParsed(hsv.h, hsv.s, hsv.v, hsv.a),
      [hsv],
    );

    const updateHsv = useCallback(
      (next: { h?: number; s?: number; v?: number; a?: number }) => {
        const merged = { ...hsv, ...next };
        setHsv(merged);
        const p = buildParsed(merged.h, merged.s, merged.v, merged.a);
        const formatted = formatValueByFormat(p, currentFormat);
        lastEmittedRef.current = formatted;
        if (!isControlled) setInternalValue(formatted);
        onValueChange?.(formatted, p);
      },
      [hsv, currentFormat, isControlled, onValueChange],
    );

    const handleFormatChange = useCallback(
      (f: ColorFormat) => {
        if (!isFormatControlled) setInternalFormat(f);
        onFormatChange?.(f);
        const formatted = formatValueByFormat(parsed, f);
        lastEmittedRef.current = formatted;
        if (!isControlled) setInternalValue(formatted);
        onValueChange?.(formatted, parsed);
      },
      [isFormatControlled, isControlled, onFormatChange, onValueChange, parsed],
    );

    const handleHexCommit = useCallback(
      (input: string) => {
        // resolveCssColor falls back to browser normalization so named CSS
        // colors ("red", "tomato") from swatches or the hex field work too.
        const p = resolveCssColor(input);
        if (!p) return;
        oklchHueRef.current = null;
        const newHsv = rgbToHsv(p.r, p.g, p.b);
        const merged = {
          h: newHsv.s === 0 ? hsv.h : newHsv.h,
          s: newHsv.s,
          v: newHsv.v,
          a: p.a,
        };
        setHsv(merged);
        const next = buildParsed(merged.h, merged.s, merged.v, merged.a);
        const formatted = formatValueByFormat(next, currentFormat);
        lastEmittedRef.current = formatted;
        if (!isControlled) setInternalValue(formatted);
        onValueChange?.(formatted, next);
      },
      [hsv.h, currentFormat, isControlled, onValueChange],
    );

    const handleSwatchPick = useCallback(
      (sw: string) => handleHexCommit(sw),
      [handleHexCommit],
    );

    const solidHueRgb = useMemo(
      () => hsvToRgb(hsv.h, hsv.s, hsv.v),
      [hsv.h, hsv.s, hsv.v],
    );
    const solidR = Math.round(solidHueRgb.r);
    const solidG = Math.round(solidHueRgb.g);
    const solidB = Math.round(solidHueRgb.b);
    const solidColorString = `rgb(${solidR}, ${solidG}, ${solidB})`;

    const root = (
      <div
        ref={ref}
        className={cn("cp-panel", className)}
        style={{ width: PANEL_WIDTH }}
        {...props}
      >
        <SaturationSquare
          h={hsv.h}
          s={hsv.s}
          v={hsv.v}
          onChange={(s, v) => updateHsv({ s, v })}
        />

        <div className="cp-sliders">
          <HueSlider
            h={hsv.h}
            onChange={(h) => {
              oklchHueRef.current = null;
              updateHsv({ h });
            }}
          />
          <AlphaSlider
            a={hsv.a}
            solidColor={solidColorString}
            solidR={solidR}
            solidG={solidG}
            solidB={solidB}
            onChange={(a) => updateHsv({ a })}
          />
        </div>

        <div className="cp-row-2">
          <FormatDropdown
            value={currentFormat}
            onChange={handleFormatChange}
            open={formatOpen}
            defaultOpen={defaultFormatOpen}
          />
          {!hideEyedropper && <EyeDropperButton onPick={handleHexCommit} />}
        </div>

        <ColorInputsRow
          parsed={parsed}
          format={currentFormat}
          oklchHue={oklchHueRef.current}
          onChannelChange={(channel, value) => {
            const p = { ...parsed };
            switch (channel) {
              case "hex":
                handleHexCommit(value as string);
                return;
              case "r":
              case "g":
              case "b": {
                oklchHueRef.current = null;
                const r = channel === "r" ? Number(value) : p.r;
                const g = channel === "g" ? Number(value) : p.g;
                const b = channel === "b" ? Number(value) : p.b;
                const hsvVal = rgbToHsv(r, g, b);
                updateHsv({
                  h: hsvVal.s === 0 ? hsv.h : hsvVal.h,
                  s: hsvVal.s,
                  v: hsvVal.v,
                });
                return;
              }
              case "hSL":
              case "sSL":
              case "lSL": {
                if (channel === "hSL") oklchHueRef.current = null;
                const hsl = rgbToHsl(p.r, p.g, p.b);
                const h2 = channel === "hSL" ? Number(value) : hsl.h;
                const s2 =
                  channel === "sSL" ? Number(value) / 100 : hsl.s;
                const l2 =
                  channel === "lSL" ? Number(value) / 100 : hsl.l;
                const rgb = hslToRgb(h2, clamp01(s2), clamp01(l2));
                const hsvVal = rgbToHsv(rgb.r, rgb.g, rgb.b);
                updateHsv({
                  h: hsvVal.s === 0 ? h2 : hsvVal.h,
                  s: hsvVal.s,
                  v: hsvVal.v,
                });
                return;
              }
              case "L":
              case "C":
              case "H": {
                const cur = rgbToOklch(p.r, p.g, p.b);
                // For L/C edits, anchor on the user's last stated H so we
                // don't drift along with chroma changes.
                const baseH = oklchHueRef.current ?? cur.H;
                const L = channel === "L" ? Number(value) / 100 : cur.L;
                const C = channel === "C" ? Number(value) : cur.C;
                const H = channel === "H" ? Number(value) : baseH;
                oklchHueRef.current = H;
                const rgb = oklchToRgb(clamp01(L), Math.max(0, C), H);
                const hsvVal = rgbToHsv(rgb.r, rgb.g, rgb.b);
                updateHsv({
                  h: hsvVal.s === 0 ? hsv.h : hsvVal.h,
                  s: hsvVal.s,
                  v: hsvVal.v,
                });
                return;
              }
              case "alphaPercent": {
                const a = clamp01(Number(value) / 100);
                updateHsv({ a });
                return;
              }
            }
          }}
        />

        {swatches && swatches.length > 0 && (
          <SwatchStrip
            swatches={swatches}
            current={parsed.hex}
            onPick={handleSwatchPick}
          />
        )}
      </div>
    );

    // A size prop pins the whole panel to one step of the ladder.
    return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
  },
);
ColorPicker.displayName = "ColorPicker";

// ---------------------------------------------------------------------------
// ColorPickerPopover — trigger tile + anchored popup panel.
// Base UI's Popover owned positioning/dismissal/focus; here the popup is
// absolutely positioned inside a relative wrapper with outside-press, Esc,
// and focus-restore — the same contract, no portal needed.
// ---------------------------------------------------------------------------

const POPOVER_EXIT_MS = 150;

export interface ColorPickerPopoverProps extends ColorPickerProps {
  triggerLabel?: string;
  triggerLabelPosition?: "left" | "right";
  triggerShowValue?: boolean;
  triggerShowRemove?: boolean;
  onTriggerRemove?: () => void;
  triggerClassName?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ColorPickerPopover = forwardRef<
  HTMLDivElement,
  ColorPickerPopoverProps
>(
  (
    {
      triggerLabel,
      triggerLabelPosition = "left",
      triggerShowValue = true,
      triggerShowRemove = false,
      onTriggerRemove,
      triggerClassName,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      size,
      ...pickerProps
    },
    ref,
  ) => {
    const isOpenControlled = openProp !== undefined;
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const open = isOpenControlled ? openProp : internalOpen;
    const [render, setRender] = useState(open);
    const wrapRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";

    const handleOpenChange = useCallback(
      (next: boolean) => {
        if (!isOpenControlled) setInternalOpen(next);
        onOpenChange?.(next);
      },
      [isOpenControlled, onOpenChange],
    );

    const isControlled = pickerProps.value !== undefined;
    const [internalValue, setInternalValue] = useState(
      pickerProps.value ?? pickerProps.defaultValue ?? "#6B97FF",
    );
    const currentValue = isControlled
      ? (pickerProps.value as string)
      : internalValue;

    const handleValueChange = useCallback(
      (v: string, parsed: ParsedColor) => {
        if (!isControlled) setInternalValue(v);
        pickerProps.onValueChange?.(v, parsed);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [isControlled, pickerProps.onValueChange],
    );

    // Deferred unmount: the exit tween plays before the panel leaves the DOM.
    useEffect(() => {
      if (open) {
        setRender(true);
        return;
      }
      const id = setTimeout(() => setRender(false), POPOVER_EXIT_MS);
      return () => clearTimeout(id);
    }, [open]);

    // Outside press, Esc, focus into the panel on open, restore on close.
    useEffect(() => {
      if (!render) return;
      const prevFocus = document.activeElement as HTMLElement | null;
      if (open) {
        requestAnimationFrame(() => {
          wrapRef.current
            ?.querySelector<HTMLElement>(".cp-panel [tabindex], .cp-panel input")
            ?.focus();
        });
      }
      const onPointerDown = (e: PointerEvent) => {
        if (!wrapRef.current?.contains(e.target as Node))
          handleOpenChange(false);
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          handleOpenChange(false);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
        if (!open && prevFocus && wrapRef.current?.contains(prevFocus))
          triggerRef.current?.focus();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [render]);

    const parsed = useMemo(() => parseColor(currentValue), [currentValue]);
    const swatchColor = parsed
      ? rgbToHexStr(parsed.r, parsed.g, parsed.b, parsed.a)
      : currentValue;
    const valueLabel = parsed
      ? rgbToHexStr(parsed.r, parsed.g, parsed.b, 1)
          .replace(/^#/, "")
          .toUpperCase()
      : currentValue;

    const root = (
      <div
        ref={ref}
        className="cp-pop"
      >
        <div ref={wrapRef} className="cp-pop-wrap">
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              "cp-trigger",
              sizeClasses.gap,
              sizeClasses.control,
              compact ? "cp-trigger-compact" : "cp-trigger-default",
              triggerClassName,
            )}
            style={{ fontVariationSettings: fontWeights.medium }}
            onClick={() => handleOpenChange(!open)}
          >
            {triggerLabel && triggerLabelPosition === "left" && (
              <span className={cn("cp-trigger-label", sizeClasses.text)}>
                {triggerLabel}
              </span>
            )}
            <ColorTile color={swatchColor} size={compact ? 16 : 20} />
            {triggerShowValue && (
              <span className={cn("cp-trigger-value", sizeClasses.text)}>
                {valueLabel}
              </span>
            )}
            {triggerLabel && triggerLabelPosition === "right" && (
              <span className={cn("cp-trigger-label", sizeClasses.text)}>
                {triggerLabel}
              </span>
            )}
            {triggerShowRemove && (
              <span
                role="button"
                aria-label="Remove color"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerRemove?.();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    e.preventDefault();
                    onTriggerRemove?.();
                  }
                }}
                className="cp-trigger-remove"
              >
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </span>
            )}
          </button>
          {render && (
            <div
              role="dialog"
              aria-label="Color picker"
              className="cp-pop-panel"
              data-on={open || undefined}
            >
              <ColorPicker
                {...pickerProps}
                value={currentValue}
                onValueChange={handleValueChange}
                className={cn("cp-pop-surface", pickerProps.className)}
              />
            </div>
          )}
        </div>
      </div>
    );

    return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
  },
);
ColorPickerPopover.displayName = "ColorPickerPopover";

export { parseColor, buildParsed };
export type { ColorFormat, ParsedColor };
export default ColorPicker;
