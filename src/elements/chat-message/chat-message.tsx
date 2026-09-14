// Adapted from fluidfunctionalism.com/r/chat-message.json — framer-motion,
// Tailwind, shared libs removed. Zero-dependency port.
//
// Upstream's motion.div (initial/animate + layout="position") becomes a CSS
// entrance keyframe on mount (opacity + rise + 96% scale from the tail
// corner — same spring.moderate feel). Framer's layout="position" slide for
// earlier messages has no cheap CSS equivalent; appends still read smoothly
// because each new bubble plays its own entrance. useTouchPrimary is a local
// pointer:coarse matchMedia; useShape's radius becomes --cm-radius.
// Source: https://www.fluidfunctionalism.com/docs/chat-message

import {
  forwardRef,
  useEffect,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { useSize, type SizeVariant } from "./size-context";
import { FileThumbnail } from "./file-thumbnail";
import "./chat-message.css";

const cn = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(" ");

// Hover-reveal is unreachable on touch — keep the meta row visible there.
function useTouchPrimary(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    const onChange = () => setTouch(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return touch;
}

export interface ChatMessageProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Who sent the message. Drives alignment and bubble colour:
   *  `user` → right-aligned accent bubble, `assistant` → left-aligned plain text. */
  from: "user" | "assistant";
  /** Optional attachments rendered as square thumbnails above the bubble. */
  files?: File[];
  /** Side length of each attachment thumbnail in pixels. Defaults to 64. */
  thumbnailSize?: number;
  /** Timestamp shown in the hover-revealed meta row, before the actions.
   *  User-message only — ignored on assistant replies. Caller pre-formats it
   *  (e.g. `"Wednesday 6:08 PM"`). */
  time?: ReactNode;
  /** Icon-only action buttons shown in the hover-revealed meta row (e.g. copy,
   *  edit, regenerate). Rendered next to the timestamp. */
  actions?: ReactNode;
  /** Message body. When omitted the text bubble is dropped (attachment-only message). */
  children?: ReactNode;
  /** Pins the message to one step of the size ladder (see size-context) —
   *  compact tightens bubble type and padding. Omitted, it follows the
   *  surrounding SizeProvider. */
  size?: SizeVariant;
}

// ─── ChatMessage ──────────────────────────────────────────────────────────
// A single transcript entry with baked-in entrance motion. Pairs with a
// composer's onSend: render one per sent/received message.
export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  (
    {
      from,
      files,
      thumbnailSize = 64,
      time,
      actions,
      children,
      size,
      className,
      ...props
    },
    ref,
  ) => {
    const compact = useSize(size).variant === "compact";
    const isUser = from === "user";
    const isTouch = useTouchPrimary();
    // Timestamps are a user-message affordance; assistant replies show actions only.
    const showTime = isUser && time != null;

    return (
      <div
        ref={ref}
        className={cn(
          "cm-msg",
          isUser ? "cm-user" : "cm-assistant",
          compact && "cm-compact",
          className,
        )}
        {...props}
      >
        {files && files.length > 0 && (
          <div
            className={cn(
              "cm-files",
              isUser ? "cm-files-user" : "cm-files-assistant",
            )}
          >
            {files.map((file, i) => (
              <FileThumbnail
                key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
                file={file}
                size={thumbnailSize}
              />
            ))}
          </div>
        )}
        {children != null && children !== "" && (
          <div
            className={cn(
              "cm-body",
              compact ? "cm-body-compact" : "cm-body-default",
              // `text-pretty` is reserved for settled user bubbles. On the
              // assistant reply it's left off on purpose: pretty-wrapping
              // re-balances last lines on every content change, so a
              // word-by-word stream visibly reflows earlier words. Default
              // wrapping appends left-to-right and stays put as text grows.
              isUser ? "cm-bubble" : "cm-plain",
            )}
          >
            {children}
          </div>
        )}
        {(showTime || actions != null) && (
          // Meta row: timestamp + icon-only actions. Always rendered (so it
          // reserves its height and the gap between bubbles never shifts) but
          // hidden until the message is hovered or an action is focused.
          <div
            className={cn(
              "cm-meta",
              compact ? "cm-meta-compact" : "cm-meta-default",
              !isTouch && "cm-meta-reveal",
            )}
          >
            {showTime && <span className="cm-meta-time">{time}</span>}
            {actions != null && <span className="cm-meta-actions">{actions}</span>}
          </div>
        )}
      </div>
    );
  },
);
ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
