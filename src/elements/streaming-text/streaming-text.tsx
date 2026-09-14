// Adapted from interior.dev/streaming-text — motion/Tailwind removed.
// Zero-dependency port: same exported API. The token accumulator is
// verbatim rAF; caret blink and the Skip/Replay swap are CSS.
// Source: https://www.interior.dev/docs/streaming-text

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./streaming-text.css";

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

const CHARS_PER_TOKEN = 4;
const MAX_FRAME_DELTA = 64;

export type StreamingTextStatus = "idle" | "streaming" | "paused" | "done";

export type StreamingToken = { word: string; gap: string };

function tokenize(text: string): StreamingToken[] {
  const tokens: StreamingToken[] = [];
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (part.trim() === "") {
      const last = tokens[tokens.length - 1];
      if (last) last.gap += part;
      else tokens.push({ word: "", gap: part });
      continue;
    }
    tokens.push({ word: part, gap: "" });
  }
  return tokens;
}

export type UseStreamingTextOptions = {
  text: string;
  tokensPerSecond?: number;
  autoStart?: boolean;
  onDone?: () => void;
};

export function useStreamingText({
  text,
  tokensPerSecond = 18,
  autoStart = true,
  onDone,
}: UseStreamingTextOptions) {
  const reduced = useReducedMotion();
  const tokens = useMemo(() => tokenize(text), [text]);
  const total = text.length;

  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<StreamingTextStatus>(
    autoStart ? "streaming" : "idle",
  );

  const cursor = useRef(0);
  const finished = useRef(onDone);

  useEffect(() => {
    finished.current = onDone;
  }, [onDone]);

  const start = useCallback(() => {
    setStatus((s) => (s === "done" ? s : "streaming"));
  }, []);

  const pause = useCallback(() => {
    setStatus((s) => (s === "streaming" ? "paused" : s));
  }, []);

  const skip = useCallback(() => {
    cursor.current = total;
    setIndex(total);
    setStatus("done");
  }, [total]);

  const reset = useCallback(() => {
    cursor.current = 0;
    setIndex(0);
    setStatus(autoStart ? "streaming" : "idle");
  }, [autoStart]);

  useEffect(() => {
    cursor.current = 0;
    setIndex(0);
    setStatus(autoStart ? "streaming" : "idle");
  }, [text, autoStart]);

  useEffect(() => {
    if (status !== "streaming") return;
    if (reduced || cursor.current >= total) {
      cursor.current = total;
      setIndex(total);
      setStatus("done");
      return;
    }

    const interval = 1000 / Math.max(1, tokensPerSecond * CHARS_PER_TOKEN);
    let frame = 0;
    let last = performance.now();
    let carry = 0;

    const tick = (now: number) => {
      carry += Math.min(now - last, MAX_FRAME_DELTA);
      last = now;

      if (carry >= interval) {
        const advance = Math.floor(carry / interval);
        carry -= advance * interval;
        const next = Math.min(total, cursor.current + advance);
        cursor.current = next;
        setIndex(next);
        if (next >= total) {
          setStatus("done");
          return;
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status, total, tokensPerSecond, reduced]);

  useEffect(() => {
    if (status === "done") finished.current?.();
  }, [status]);

  useEffect(() => {
    if (!reduced) return;
    cursor.current = total;
    setIndex(total);
    setStatus("done");
  }, [reduced, total]);

  const visible = useMemo(() => text.slice(0, index), [text, index]);

  return {
    tokens,
    index,
    total,
    status,
    visible,
    start,
    pause,
    skip,
    reset,
  };
}

export type StreamingTextProps = {
  text: string;
  tokensPerSecond?: number;
  autoStart?: boolean;
  showSkip?: boolean;
  label?: string;
  onDone?: () => void;
  className?: string;
};

export function StreamingText({
  text,
  tokensPerSecond = 18,
  autoStart = true,
  showSkip = true,
  label = "Streamed response",
  onDone,
  className = "",
}: StreamingTextProps) {
  const { visible, status, skip, start, reset } = useStreamingText({
    text,
    tokensPerSecond,
    autoStart,
    onDone,
  });
  const reduced = useReducedMotion();

  const done = status === "done";
  const blink = !reduced && (status === "idle" || status === "paused");

  const caret = (
    <span aria-hidden className="st-caretwrap">
      <span
        className={`st-caret${blink ? " blink" : ""}`}
        data-off={done || undefined}
      />
    </span>
  );

  return (
    <div
      role="group"
      aria-label={label}
      aria-busy={status === "streaming"}
      className={`st${className ? ` ${className}` : ""}`}
    >
      <p aria-hidden className="st-text">
        <span className="st-ghost">{text}</span>
        <span className="st-live">
          {visible}
          {caret}
        </span>
      </p>

      <span role="status" aria-live="polite" className="st-sr">
        {done ? text : ""}
      </span>

      {showSkip ? (
        <div className="st-controls">
          <button
            type="button"
            onClick={
              done
                ? () => {
                    reset();
                    start();
                  }
                : skip
            }
            aria-label={done ? `Replay ${label}` : "Skip to the end"}
            className="st-skip"
          >
            <span aria-hidden className="st-skip-label" data-on={!done || undefined}>
              Skip
            </span>
            <span aria-hidden className="st-skip-label" data-on={done || undefined}>
              Replay
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
