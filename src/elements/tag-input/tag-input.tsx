// Adapted from interior.dev/tag-input — motion/Tailwind removed.
// Zero-dependency port: same exported API. useTagInput is verbatim;
// chip enter/exit and the layout slide are done with a FLIP pass
// (Web Animations API) plus short-lived "ghost" chips for exits.
// Source: https://www.interior.dev/docs/tag-input

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./tag-input.css";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

const clean = (raw: string) => raw.trim().replace(/\s+/g, " ");

const splitter = (separators: string[]) =>
  new RegExp(
    `[${separators.map((s) => s.replace(/[\\\]^-]/g, "\\$&")).join("")}\\n\\r\\t]+`,
  );

export type TagRejection = "duplicate" | "limit" | "invalid";

export type UseTagInputOptions = {
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  max?: number;
  separators?: string[];
  allowDuplicates?: boolean;
  validate?: (candidate: string, tags: string[]) => boolean;
};

type Rejection = { reason: TagRejection; tag: string; visible: boolean };

export function useTagInput({
  value,
  defaultValue,
  onChange,
  max,
  separators = [","],
  allowDuplicates = false,
  validate,
}: UseTagInputOptions = {}) {
  const [internal, setInternal] = useState<string[]>(() => defaultValue ?? []);
  const [draft, setDraft] = useState("");
  const [armed, setArmed] = useState(-1);
  const [rejection, setRejection] = useState<Rejection | null>(null);
  const [flashed, setFlashed] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const controlled = value !== undefined;
  const tags = value ?? internal;
  const armedIndex = armed >= tags.length ? -1 : armed;

  const emit = useRef(onChange);
  emit.current = onChange;
  const check = useRef(validate);
  check.current = validate;

  const rejectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (rejectTimer.current) clearTimeout(rejectTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const dismiss = useCallback(() => {
    if (rejectTimer.current) clearTimeout(rejectTimer.current);
    rejectTimer.current = null;
    setRejection((prev) =>
      prev && prev.visible ? { ...prev, visible: false } : prev,
    );
  }, []);

  const refuse = useCallback(
    (reason: TagRejection, tag: string) => {
      if (rejectTimer.current) clearTimeout(rejectTimer.current);
      setRejection({ reason, tag, visible: true });
      rejectTimer.current = setTimeout(() => {
        setRejection((prev) => (prev ? { ...prev, visible: false } : prev));
      }, 2400);

      setAnnouncement(
        reason === "duplicate"
          ? `${tag} is already in the list.`
          : reason === "limit"
            ? `That is the limit of ${max} tags.`
            : `${tag} is not allowed here.`,
      );

      if (reason !== "duplicate") return;
      if (flashTimer.current) clearTimeout(flashTimer.current);
      setFlashed(tag);
      flashTimer.current = setTimeout(() => setFlashed(null), 460);
    },
    [max],
  );

  const apply = useCallback(
    (next: string[]) => {
      if (!controlled) setInternal(next);
      emit.current?.(next);
    },
    [controlled],
  );

  const add = useCallback(
    (raws: string[]) => {
      const next = [...tags];
      let added = 0;
      let failure: { reason: TagRejection; tag: string } | null = null;

      for (const raw of raws) {
        const candidate = clean(raw);
        if (!candidate) continue;

        if (max !== undefined && next.length >= max) {
          failure = { reason: "limit", tag: candidate };
          break;
        }

        if (!allowDuplicates) {
          const twin = next.find(
            (t) => t.toLowerCase() === candidate.toLowerCase(),
          );
          if (twin) {
            failure = { reason: "duplicate", tag: twin };
            continue;
          }
        }

        if (check.current && !check.current(candidate, next)) {
          failure = { reason: "invalid", tag: candidate };
          continue;
        }

        next.push(candidate);
        added += 1;
      }

      if (added > 0) {
        apply(next);
        setDraft("");
        setArmed(-1);
        dismiss();
        setAnnouncement(
          `${added === 1 ? next[next.length - 1] : `${added} tags`} added, ${next.length} total.`,
        );
      }

      if (failure) refuse(failure.reason, failure.tag);
      return added > 0;
    },
    [tags, max, allowDuplicates, apply, dismiss, refuse],
  );

  const removeAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= tags.length) return;
      const gone = tags[index];
      const next = tags.filter((_, i) => i !== index);
      apply(next);
      setArmed(-1);
      dismiss();
      setAnnouncement(`${gone} removed, ${next.length} left.`);
    },
    [tags, apply, dismiss],
  );

  const arm = useCallback(
    (index: number) => {
      setArmed(index);
      setAnnouncement(
        `${tags[index]} selected, press Backspace again to remove it.`,
      );
    },
    [tags],
  );

  const inputProps = {
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(e.target.value);
      setArmed(-1);
      dismiss();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.nativeEvent.isComposing) return;

      if (e.key === "Enter" || separators.includes(e.key)) {
        e.preventDefault();
        add([draft]);
        return;
      }

      if (e.key === "Backspace" && draft === "") {
        e.preventDefault();
        if (e.repeat) return;
        if (armedIndex >= 0) removeAt(armedIndex);
        else if (tags.length > 0) arm(tags.length - 1);
        return;
      }

      if (e.key === "Delete" && armedIndex >= 0) {
        e.preventDefault();
        if (e.repeat) return;
        removeAt(armedIndex);
        return;
      }

      if (e.key === "ArrowLeft") {
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        if (start !== 0 || end !== 0 || tags.length === 0) return;
        e.preventDefault();
        arm(armedIndex < 0 ? tags.length - 1 : Math.max(0, armedIndex - 1));
        return;
      }

      if (e.key === "ArrowRight" && armedIndex >= 0) {
        e.preventDefault();
        if (armedIndex >= tags.length - 1) setArmed(-1);
        else arm(armedIndex + 1);
        return;
      }

      if (e.key === "Escape" && armedIndex >= 0) {
        e.preventDefault();
        setArmed(-1);
      }
    },
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text");
      const pattern = splitter(separators);
      if (!pattern.test(text)) return;
      e.preventDefault();
      add(text.split(pattern));
    },
    onBlur: () => setArmed(-1),
  };

  return {
    tags,
    draft,
    setDraft,
    armedIndex,
    flashed,
    rejection,
    announcement,
    inputProps,
    add,
    removeAt,
    max,
  };
}

export type TagInputProps = UseTagInputOptions & {
  label?: string;
  placeholder?: string;
  hint?: string;
  className?: string;
};

function CloseGlyph() {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden
      width="9"
      height="9"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    >
      <path d="M2.6 2.6 7.4 7.4M7.4 2.6 2.6 7.4" />
    </svg>
  );
}

type Ghost = { key: string; tag: string; left: number; top: number; width: number };

export function TagInput({
  label,
  placeholder = "Add a tag",
  hint = "Enter adds · Backspace removes",
  className = "",
  ...options
}: TagInputProps) {
  const {
    tags,
    draft,
    armedIndex,
    flashed,
    rejection,
    announcement,
    inputProps,
    removeAt,
    max,
  } = useTagInput(options);

  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const uid = useId();
  const inputId = `${uid}-tag-input`;
  const hintId = `${uid}-tag-hint`;

  const rows = useMemo(() => {
    const seen = new Map<string, number>();
    return tags.map((tag) => {
      const n = seen.get(tag) ?? 0;
      seen.set(tag, n + 1);
      return { tag, key: n === 0 ? tag : `${tag}#${n}` };
    });
  }, [tags]);

  // FLIP: every render, measure all [data-flip] children; the ones that
  // moved get an inverted transform animation, the ones that left spawn
  // a ghost chip that shrinks out where it used to sit.
  const prevRects = useRef(new Map<string, { r: DOMRect; tag: string }>());
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const ghostTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      ghostTimers.current.forEach(clearTimeout);
    },
    [],
  );

  useLayoutEffect(() => {
    const ul = listRef.current;
    if (!ul) return;

    const next = new Map<string, { r: DOMRect; tag: string }>();
    ul.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const key = el.dataset.flip!;
      const r = el.getBoundingClientRect();
      next.set(key, { r, tag: el.dataset.tag ?? "" });

      const prev = prevRects.current.get(key);
      if (prev && !reducedRef.current) {
        const dx = prev.r.left - r.left;
        const dy = prev.r.top - r.top;
        if (dx !== 0 || dy !== 0) {
          el.animate(
            [
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: "none" },
            ],
            { duration: 260, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
          );
        }
      }
    });

    if (!reducedRef.current) {
      const ur = ul.getBoundingClientRect();
      const gone: Ghost[] = [];
      for (const [key, prev] of prevRects.current) {
        if (key !== "__input" && !next.has(key)) {
          gone.push({
            key: `${key}@${Date.now()}`,
            tag: prev.tag,
            left: prev.r.left - ur.left,
            top: prev.r.top - ur.top,
            width: prev.r.width,
          });
        }
      }
      if (gone.length > 0) {
        setGhosts((gs) => [...gs, ...gone]);
        const keys = new Set(gone.map((g) => g.key));
        ghostTimers.current.push(
          setTimeout(
            () => setGhosts((gs) => gs.filter((g) => !keys.has(g.key))),
            220,
          ),
        );
      }
    }

    prevRects.current = next;
  });

  const message = !rejection
    ? ""
    : rejection.reason === "duplicate"
      ? `${rejection.tag} is already in the list`
      : rejection.reason === "limit"
        ? `That is the limit of ${max} tags`
        : `${rejection.tag} is not allowed here`;

  const showMessage = rejection?.visible === true;

  return (
    <div className={`ti${className ? ` ${className}` : ""}`}>
      {label ? (
        <label htmlFor={inputId} className="ti-label">
          {label}
        </label>
      ) : null}

      <ul
        ref={listRef}
        onPointerDown={(e) => {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          inputRef.current?.focus();
        }}
        className="ti-list"
      >
        {rows.map(({ tag, key }, index) => {
          const lit = armedIndex === index || flashed === tag;
          return (
            <li
              key={key}
              role="listitem"
              data-flip={key}
              data-tag={tag}
              className={`ti-chip${lit ? " lit" : ""}`}
            >
              <span className="ti-tag">{tag}</span>
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Remove ${tag}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  removeAt(index);
                  inputRef.current?.focus();
                }}
                className="ti-x"
              >
                <CloseGlyph />
              </button>
            </li>
          );
        })}

        {ghosts.map((g) => (
          <li
            key={g.key}
            aria-hidden
            className="ti-chip leaving"
            style={{ left: g.left, top: g.top, width: g.width }}
          >
            <span className="ti-tag">{g.tag}</span>
            <span className="ti-x">
              <CloseGlyph />
            </span>
          </li>
        ))}

        <li data-flip="__input" className="ti-field">
          <span aria-hidden className="ti-size">
            {draft || placeholder}
          </span>
          <input
            {...inputProps}
            ref={inputRef}
            id={inputId}
            type="text"
            aria-describedby={hintId}
            aria-label={label ? undefined : "Tags"}
            placeholder={placeholder}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            className="ti-input"
          />
        </li>
      </ul>

      <div className="ti-foot">
        <div className="ti-lines">
          <p id={hintId} className="ti-hint" data-on={!showMessage || undefined}>
            {hint}
          </p>
          <p aria-hidden className="ti-msg" data-on={showMessage || undefined}>
            {message}
          </p>
        </div>

        {max === undefined ? null : (
          <p className="ti-count">
            <span className="ti-count-num">
              <span aria-hidden className="ti-count-pad">
                {max}
              </span>
              <span className="ti-count-val">{tags.length}</span>
            </span>
            <span> / {max}</span>
          </p>
        )}
      </div>

      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="ti-sr"
      >
        {announcement}
      </span>
    </div>
  );
}
