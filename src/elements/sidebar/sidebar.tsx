// Adapted from fluidfunctionalism.com/r/base/sidebar.json — @base-ui/react,
// framer-motion, cva, lucide, Tailwind removed. Zero-dependency port; same
// public API (Provider / Sidebar / Trigger / Rail / Inset / sections /
// Group family). Menu parts live in sidebar-menu.tsx.
//
// Motion mapping: shell width + panel slide are CSS transitions
// (240ms enter / 160ms exit ≈ spring.slow, none while resizing);
// peek card, mobile sheet and scrim ride 160/120ms tiers via CSS.
// The Dialog primitive's sheet duties — scroll lock, focus trap, Esc and
// outside dismissal — are reimplemented in SidebarSheet.
// Source: https://www.fluidfunctionalism.com/docs/sidebar

import {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  Children,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
  type ElementType,
} from "react";
import { useSize, useSizeVariant } from "./size-context";
import "./sidebar.css";

export const SIDEBAR_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_KEYBOARD_SHORTCUT = "[";
export const SIDEBAR_KEYBOARD_SHORTCUT_RIGHT = "]";
export const SIDEBAR_MIN_WIDTH = 160;
export const SIDEBAR_MAX_WIDTH = 360;
// Extra travel past the minimum that previews (and commits) a collapse.
export const SIDEBAR_COLLAPSE_SLOP = 56;

// ─── Context ─────────────────────────────────────────────────────────────

export type SidebarSide = "left" | "right";
export type SidebarVariant = "sidebar" | "floating" | "inset";
export type SidebarCollapsible = "offcanvas" | "none";

export interface SidebarContextValue {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  toggleSidebar: () => void;
  width: string;
  setWidth: (width: string) => void;
  widthMobile: string;
  mobileBreakpoint: number;
  side: SidebarSide;
  registerSide: (side: SidebarSide) => void;
  shortcut: string | null;
  peek: "hover" | "click" | "none";
  isPeeking: boolean;
  setIsPeeking: React.Dispatch<React.SetStateAction<boolean>>;
  schedulePeek: () => void;
  scheduleDismissPeek: () => void;
  cancelPeekTimer: () => void;
  isResizing: boolean;
  setIsResizing: React.Dispatch<React.SetStateAction<boolean>>;
}

// Mounted-provider registry so exactly ONE provider answers the global
// bare-key shortcut (innermost containing focus; outermost otherwise).
const mountedProviders: HTMLElement[] = [];

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}

const cn = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(" ");

function useIsMobile(breakpoint: number): boolean {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);
  return !!isMobile;
}

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── SidebarProvider ─────────────────────────────────────────────────────

export interface SidebarProviderProps extends HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  persist?: boolean;
  shortcut?: string | null;
  mobileBreakpoint?: number;
  peek?: "hover" | "click" | "none";
  width?: string;
  widthMobile?: string;
}

export const SidebarProvider = forwardRef<HTMLDivElement, SidebarProviderProps>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange,
      persist = true,
      shortcut: shortcutProp,
      mobileBreakpoint = 768,
      peek = "none",
      width: widthProp = SIDEBAR_WIDTH,
      widthMobile = SIDEBAR_WIDTH_MOBILE,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile(mobileBreakpoint);
    const [openMobile, setOpenMobile] = useState(false);
    const [side, setSide] = useState<SidebarSide>("left");
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      mountedProviders.push(el);
      return () => {
        const i = mountedProviders.indexOf(el);
        if (i !== -1) mountedProviders.splice(i, 1);
      };
    }, []);
    const registerSide = useCallback((next: SidebarSide) => setSide(next), []);

    const [width, setWidth] = useState(widthProp);
    useEffect(() => setWidth(widthProp), [widthProp]);
    const [isResizing, setIsResizing] = useState(false);

    const shortcut =
      shortcutProp === undefined
        ? side === "right"
          ? SIDEBAR_KEYBOARD_SHORTCUT_RIGHT
          : SIDEBAR_KEYBOARD_SHORTCUT
        : shortcutProp;

    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const open = openProp ?? internalOpen;
    const openRef = useRef(open);
    openRef.current = open;

    const setOpen = useCallback(
      (value: boolean | ((prev: boolean) => boolean)) => {
        const next =
          typeof value === "function" ? value(openRef.current) : value;
        if (onOpenChange) onOpenChange(next);
        else setInternalOpen(next);
        if (persist) {
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [onOpenChange, persist],
    );

    const toggleSidebar = useCallback(() => {
      if (isMobile) setOpenMobile((prev) => !prev);
      else setOpen((prev) => !prev);
    }, [isMobile, setOpen]);

    // Collapsed-peek overlay state + shared intent timers.
    const [isPeeking, setIsPeeking] = useState(false);
    const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
      if (open || peek === "none") {
        if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
        peekTimerRef.current = null;
        setIsPeeking(false);
      }
    }, [open, peek]);
    const cancelPeekTimer = useCallback(() => {
      if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }, []);
    const schedulePeek = useCallback(() => {
      cancelPeekTimer();
      peekTimerRef.current = setTimeout(() => setIsPeeking(true), 150);
    }, [cancelPeekTimer]);
    const scheduleDismissPeek = useCallback(() => {
      cancelPeekTimer();
      peekTimerRef.current = setTimeout(() => setIsPeeking(false), 250);
    }, [cancelPeekTimer]);
    useEffect(() => cancelPeekTimer, [cancelPeekTimer]);

    // Bare-key toggle, app-wide but for exactly one provider.
    useEffect(() => {
      if (shortcut == null) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key.toLowerCase() !== shortcut.toLowerCase()) return;
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        )
          return;
        const root = wrapperRef.current;
        if (!root) return;
        if (root.contains(target)) {
          if (
            mountedProviders.some(
              (el) => el !== root && root.contains(el) && el.contains(target),
            )
          )
            return;
          if (mountedProviders.some((el) => el !== root && target.contains(el)))
            return;
        } else {
          const wrapped = mountedProviders.filter((el) => target.contains(el));
          if (wrapped.length > 0) {
            const outermost = wrapped.find(
              (el) =>
                !wrapped.some((other) => other !== el && other.contains(el)),
            );
            if (outermost !== root) return;
          } else {
            if (
              mountedProviders.some((el) => el !== root && el.contains(target))
            )
              return;
            const outermost = mountedProviders.find(
              (el) =>
                !mountedProviders.some(
                  (other) => other !== el && other.contains(el),
                ),
            );
            if (outermost !== root) return;
          }
        }
        event.preventDefault();
        toggleSidebar();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [shortcut, toggleSidebar]);

    const value = useMemo<SidebarContextValue>(
      () => ({
        state: open ? "expanded" : "collapsed",
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
        width,
        setWidth,
        widthMobile,
        mobileBreakpoint,
        side,
        registerSide,
        shortcut,
        peek,
        isPeeking,
        setIsPeeking,
        schedulePeek,
        scheduleDismissPeek,
        cancelPeekTimer,
        isResizing,
        setIsResizing,
      }),
      [
        open,
        setOpen,
        openMobile,
        isMobile,
        toggleSidebar,
        width,
        widthMobile,
        mobileBreakpoint,
        side,
        registerSide,
        shortcut,
        peek,
        isPeeking,
        schedulePeek,
        scheduleDismissPeek,
        cancelPeekTimer,
        isResizing,
      ],
    );

    return (
      <SidebarContext.Provider value={value}>
        <div
          ref={(node) => {
            wrapperRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref)
              (ref as React.MutableRefObject<HTMLDivElement | null>).current =
                node;
          }}
          data-slot="sidebar-wrapper"
          className={cn("sb-wrap", className)}
          style={
            {
              "--sb-width": width,
              "--sb-width-mobile": widthMobile,
              ...style,
            } as CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = "SidebarProvider";

// ─── Slot helpers (render / asChild polymorphism) ────────────────────────────

type SlotProps = {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>;

function composeRefs<T>(...refs: (Ref<T> | undefined)[]): Ref<T> {
  return (node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as React.MutableRefObject<T | null>).current = node;
    }
  };
}

export function resolveSlotTemplate(
  render: ReactElement | undefined,
  asChild: boolean | undefined,
  children: ReactNode,
): { template: ReactElement | null; content: ReactNode } {
  if (render && isValidElement(render))
    return { template: render, content: children };
  if (asChild) {
    const arr = Children.toArray(children);
    const first = arr.find(isValidElement);
    if (first && arr.length === 1)
      return { template: first, content: (first.props as SlotProps).children };
    if (first)
      return {
        template: first,
        content: arr.filter((c) => c !== first),
      };
  }
  return { template: null, content: children };
}

export function slotElement(
  template: ReactElement<SlotProps> | null,
  DefaultTag: ElementType,
  props: SlotProps & { ref?: Ref<HTMLElement> },
  content: ReactNode,
): ReactElement {
  if (!template) {
    const Tag = DefaultTag as ElementType;
    return <Tag {...props}>{content}</Tag>;
  }
  const templateProps = template.props;
  const merged: SlotProps & { ref?: Ref<HTMLElement> } = {
    ...props,
    ...templateProps,
    className: cn(props.className, templateProps.className),
    style: {
      ...props.style,
      ...(templateProps.style as CSSProperties | undefined),
    },
  };
  for (const key of Object.keys(props)) {
    if (!/^on[A-Z]/.test(key)) continue;
    const ours = props[key];
    const theirs = templateProps[key];
    if (typeof ours === "function" && typeof theirs === "function") {
      merged[key] = (...args: unknown[]) => {
        (theirs as (...a: unknown[]) => void)(...args);
        (ours as (...a: unknown[]) => void)(...args);
      };
    }
  }
  const templateRef =
    (templateProps as { ref?: Ref<HTMLElement> }).ref ??
    (template as unknown as { ref?: Ref<HTMLElement> }).ref;
  merged.ref = composeRefs(props.ref, templateRef);
  return cloneElement(template, merged, content);
}

// ─── SidebarSheet (mobile drawer) ────────────────────────────────────────────

interface SidebarSheetProps {
  side: SidebarSide;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const SHEET_EXIT_MS = 140;

function SidebarSheet({ side, open, onClose, children }: SidebarSheetProps) {
  const { widthMobile } = useSidebar();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);

  // Deferred unmount: the exit slide plays before the sheet leaves the DOM.
  useEffect(() => {
    if (open) {
      setRender(true);
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true)),
      );
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const id = setTimeout(
      () => setRender(false),
      reducedMotion() ? 0 : SHEET_EXIT_MS,
    );
    return () => clearTimeout(id);
  }, [open]);

  // Focus the panel on open; restore focus on close; Esc closes; scroll lock.
  useEffect(() => {
    if (!render) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [render, onClose]);

  if (!render) return null;

  return (
    <div className="sb-sheet" data-side={side}>
      <div
        aria-hidden
        className="sb-scrim"
        data-on={visible || undefined}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar"
        tabIndex={-1}
        data-sidebar="sidebar"
        data-mobile="true"
        data-side={side}
        className="sb-panel"
        data-on={visible || undefined}
        style={{ width: widthMobile }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── SidebarRail ─────────────────────────────────────────────────────────────

export interface SidebarRailProps extends HTMLAttributes<HTMLButtonElement> {
  tooltipOpen?: boolean;
}

export const SidebarRail = forwardRef<HTMLButtonElement, SidebarRailProps>(
  ({ className, tooltipOpen, ...props }, ref) => {
    const { toggleSidebar, setOpen, setWidth, side, setIsResizing } =
      useSidebar();
    const railRef = useRef<HTMLButtonElement | null>(null);
    const dragRef = useRef<{
      startX: number;
      startWidth: number;
      moved: boolean;
      collapsed: boolean;
    } | null>(null);
    const [dragging, setDragging] = useState(false);

    const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
      const panel = railRef.current?.closest(
        '[data-slot="sidebar"]',
      ) as HTMLElement | null;
      if (!panel) return;
      dragRef.current = {
        startX: event.clientX,
        startWidth: panel.offsetWidth,
        moved: false,
        collapsed: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) < 4) return;
      if (!drag.moved) {
        drag.moved = true;
        setDragging(true);
        setIsResizing(true);
      }
      const delta = side === "left" ? dx : -dx;
      const raw = drag.startWidth + delta;
      // Past the minimum toward the edge: preview collapse, keep the drag
      // alive — pulling back re-expands before release commits anything.
      if (raw < SIDEBAR_MIN_WIDTH - SIDEBAR_COLLAPSE_SLOP) {
        if (!drag.collapsed) {
          drag.collapsed = true;
          setWidth(`${SIDEBAR_MIN_WIDTH}px`);
          setOpen(false);
        }
        return;
      }
      if (drag.collapsed) {
        drag.collapsed = false;
        setOpen(true);
      }
      const next = Math.max(
        SIDEBAR_MIN_WIDTH,
        Math.min(SIDEBAR_MAX_WIDTH, raw),
      );
      setWidth(`${next}px`);
    };

    const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      setDragging(false);
      setIsResizing(false);
      if (drag && !drag.moved) toggleSidebar();
    };

    const onPointerCancel = () => {
      dragRef.current = null;
      setDragging(false);
      setIsResizing(false);
    };

    return (
      <button
        ref={(node) => {
          railRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as React.MutableRefObject<HTMLButtonElement | null>).current =
              node;
        }}
        type="button"
        data-sidebar="rail"
        aria-label="Resize or collapse sidebar"
        tabIndex={-1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className={cn(
          "sb-rail",
          side === "left" ? "sb-rail-r" : "sb-rail-l",
          (dragging || tooltipOpen) && "lit",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarRail.displayName = "SidebarRail";

// ─── SidebarShell ────────────────────────────────────────────────────────────

export interface SidebarShellProps extends HTMLAttributes<HTMLDivElement> {
  side: SidebarSide;
  variant: SidebarVariant;
  bordered?: boolean;
  rail?: boolean;
  railTooltipOpen?: boolean;
}

/** The expanded/collapsed desktop rail: an in-flow sticky column animates
 *  its width (that's what reflows the inset) while the fixed-width panel
 *  inside slides out under overflow clipping. */
const SidebarShell = forwardRef<HTMLDivElement, SidebarShellProps>(
  (
    {
      side,
      variant,
      bordered = true,
      rail = true,
      railTooltipOpen,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const {
      open,
      width,
      isResizing,
      peek,
      isPeeking,
      setIsPeeking,
      schedulePeek,
      scheduleDismissPeek,
      cancelPeekTimer,
    } = useSidebar();
    const shellRef = useRef<HTMLDivElement | null>(null);

    const peekEnabled = peek !== "none" && !open && !isResizing;
    useEffect(() => {
      if (!(peekEnabled && isPeeking)) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setIsPeeking(false);
      };
      const onPointerDown = (event: PointerEvent) => {
        if (!shellRef.current?.contains(event.target as Node))
          setIsPeeking(false);
      };
      // Hover-mode dismissal by geometry, not leave events: a portalled
      // tooltip or menu covering the card would fire a lying pointerleave.
      let wasInside = true;
      const onPointerMove = (event: PointerEvent) => {
        const overlay =
          shellRef.current?.querySelector('[data-sidebar="peek"]') ??
          shellRef.current;
        if (!overlay) return;
        const box = overlay.getBoundingClientRect();
        const inside =
          event.clientX >= box.left - 8 &&
          event.clientX <= box.right + 8 &&
          event.clientY >= box.top - 8 &&
          event.clientY <= box.bottom + 8;
        if (inside) {
          wasInside = true;
          cancelPeekTimer();
        } else if (wasInside) {
          wasInside = false;
          scheduleDismissPeek();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("pointerdown", onPointerDown);
      if (peek === "hover")
        document.addEventListener("pointermove", onPointerMove);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("pointermove", onPointerMove);
      };
    }, [
      peekEnabled,
      isPeeking,
      setIsPeeking,
      peek,
      cancelPeekTimer,
      scheduleDismissPeek,
    ]);

    return (
      <div
        ref={(node) => {
          shellRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
        }}
        data-slot="sidebar"
        data-state={open ? "expanded" : "collapsed"}
        data-collapsible={open ? "" : "offcanvas"}
        data-variant={variant}
        data-side={side}
        className={cn(
          "sb-shell",
          peekEnabled && "sb-shell-peek",
          isResizing && "sb-shell-resizing",
          side === "right" && "sb-right",
          className,
        )}
        style={{ width: open ? width : "0rem" }}
        onPointerEnter={
          peekEnabled && peek === "hover" ? cancelPeekTimer : undefined
        }
        onPointerLeave={
          peekEnabled && peek === "hover"
            ? () => {
                if (!isPeeking) cancelPeekTimer();
              }
            : undefined
        }
        {...props}
      >
        {peekEnabled ? (
          <>
            {/* Edge strip — the collapsed reveal affordance. */}
            <button
              type="button"
              aria-label="Peek sidebar"
              aria-expanded={isPeeking}
              className={cn(
                "sb-peek-strip",
                side === "left" ? "sb-peek-l" : "sb-peek-r",
              )}
              onPointerEnter={
                peek === "hover"
                  ? (event) => {
                      if (event.pointerType === "mouse") schedulePeek();
                    }
                  : undefined
              }
              onClick={() => {
                cancelPeekTimer();
                setIsPeeking(true);
              }}
            >
              <span aria-hidden="true" className="sb-peek-line" />
            </button>
            {isPeeking && (
              <div
                data-sidebar="peek"
                className={cn(
                  "sb-peek-card",
                  side === "left" ? "sb-peek-l" : "sb-peek-r",
                  variant === "floating" && "sb-peek-floating",
                )}
                style={{
                  width: `calc(${width} - ${variant === "floating" ? "1rem" : "0.5rem"})`,
                }}
              >
                {children}
              </div>
            )}
          </>
        ) : (
          <div
            className={cn(
              "sb-panel-desktop",
              side === "left" ? "sb-panel-l" : "sb-panel-r",
              variant === "floating" && "sb-panel-float",
              variant === "inset" && "sb-panel-inset",
            )}
            data-open={open || undefined}
            style={{ width }}
          >
            {variant === "floating" ? (
              <div data-sidebar="sidebar" className="sb-inner sb-card">
                {children}
              </div>
            ) : (
              <div
                data-sidebar="sidebar"
                className={cn(
                  "sb-inner",
                  bordered &&
                    variant === "sidebar" &&
                    (side === "left" ? "sb-edge-r" : "sb-edge-l"),
                )}
              >
                {children}
              </div>
            )}
            {rail && (
              <SidebarRail
                tooltipOpen={railTooltipOpen}
                className={cn(
                  variant === "floating" &&
                    (side === "left" ? "sb-rail-inset-r" : "sb-rail-inset-l"),
                )}
              />
            )}
          </div>
        )}
      </div>
    );
  },
);
SidebarShell.displayName = "SidebarShell";

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  side?: SidebarSide;
  variant?: SidebarVariant;
  collapsible?: SidebarCollapsible;
  bordered?: boolean;
  railTooltipOpen?: boolean;
  rail?: boolean;
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      bordered = true,
      rail = true,
      railTooltipOpen,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const { isMobile, openMobile, setOpenMobile, width, registerSide } =
      useSidebar();

    useEffect(() => registerSide(side), [side, registerSide]);

    if (collapsible === "none") {
      return (
        <div
          ref={ref}
          data-slot="sidebar"
          data-variant={variant}
          data-side={side}
          className={cn(
            "sb-shell sb-static",
            side === "right" && "sb-right",
            className,
          )}
          style={{ width, ...style } as CSSProperties}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className={cn(
              "sb-inner",
              bordered &&
                variant === "sidebar" &&
                (side === "left" ? "sb-edge-r" : "sb-edge-l"),
            )}
          >
            {children}
          </div>
        </div>
      );
    }

    return (
      <>
        {isMobile && (
          <SidebarSheet
            side={side}
            open={openMobile}
            onClose={() => setOpenMobile(false)}
          >
            {children}
          </SidebarSheet>
        )}
        <SidebarShell
          ref={ref}
          side={side}
          variant={variant}
          bordered={bordered}
          rail={rail}
          railTooltipOpen={railTooltipOpen}
          className={cn(className, isMobile && "sb-hidden")}
          style={style}
          {...props}
        >
          {children}
        </SidebarShell>
      </>
    );
  },
);
Sidebar.displayName = "Sidebar";

// ─── SidebarTrigger ──────────────────────────────────────────────────────────

export type SidebarTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const PanelLeft = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M9.5 4v16" />
  </svg>
);
const PanelRight = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M14.5 4v16" />
  </svg>
);

export const SidebarTrigger = forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ onClick, className, children, ...props }, ref) => {
    const {
      toggleSidebar,
      open,
      openMobile,
      isMobile,
      side,
      peek,
      isPeeking,
      schedulePeek,
      cancelPeekTimer,
      shortcut,
    } = useSidebar();
    const shortcutKey =
      shortcut ??
      (side === "right"
        ? SIDEBAR_KEYBOARD_SHORTCUT_RIGHT
        : SIDEBAR_KEYBOARD_SHORTCUT);
    const hoverPeek = peek === "hover" && !isMobile && !open;
    const collapsed = isMobile ? !openMobile : !open;

    return (
      <span className="sb-trigger-wrap">
        <button
          ref={ref}
          type="button"
          data-sidebar="trigger"
          aria-label="Toggle Sidebar"
          className={cn("sb-trigger", className)}
          onClick={(event) => {
            onClick?.(event);
            toggleSidebar();
          }}
          onPointerEnter={
            hoverPeek
              ? (event: React.PointerEvent) => {
                  if (event.pointerType !== "mouse") return;
                  if (isPeeking) cancelPeekTimer();
                  else schedulePeek();
                }
              : undefined
          }
          onPointerLeave={
            hoverPeek
              ? () => {
                  if (!isPeeking) cancelPeekTimer();
                }
              : undefined
          }
          {...props}
        >
          {children ?? (side === "right" ? <PanelRight /> : <PanelLeft />)}
        </button>
        <span className="sb-tip" role="tooltip">
          <span className="sb-tip-text">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
          <kbd className="sb-kbd">{shortcutKey}</kbd>
        </span>
      </span>
    );
  },
);
SidebarTrigger.displayName = "SidebarTrigger";

// ─── SidebarInset ────────────────────────────────────────────────────────────

export type SidebarInsetProps = HTMLAttributes<HTMLElement>;

export const SidebarInset = forwardRef<HTMLElement, SidebarInsetProps>(
  ({ className, ...props }, ref) => (
    <main
      ref={ref}
      data-slot="sidebar-inset"
      className={cn("sb-inset", className)}
      {...props}
    />
  ),
);
SidebarInset.displayName = "SidebarInset";

// ─── SidebarContent / Input / Header / Footer / Separator ────────────────────

export interface SidebarContentProps extends HTMLAttributes<HTMLDivElement> {
  viewportClassName?: string;
}

export const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, children, ...props }, ref) => (
    <div className={cn("sb-content", className)}>
      <div
        ref={ref}
        data-sidebar="content"
        className="sb-content-inner"
        {...props}
      >
        {children}
      </div>
    </div>
  ),
);
SidebarContent.displayName = "SidebarContent";

export type SidebarInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const SidebarInput = forwardRef<HTMLInputElement, SidebarInputProps>(
  ({ className, ...props }, ref) => {
    const size = useSize();
    return (
      <input
        ref={ref}
        data-sidebar="input"
        className={cn(
          "sb-input",
          size.variant === "compact" ? "sz-h-c" : "sb-input-h",
          size.text,
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarInput.displayName = "SidebarInput";

export type SidebarSectionProps = HTMLAttributes<HTMLDivElement>;

export const SidebarHeader = forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("sb-head", className)}
      {...props}
    />
  ),
);
SidebarHeader.displayName = "SidebarHeader";

export const SidebarFooter = forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("sb-foot", className)}
      {...props}
    />
  ),
);
SidebarFooter.displayName = "SidebarFooter";

export const SidebarSeparator = forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="separator"
      role="separator"
      aria-orientation="horizontal"
      className={cn("sb-sep", className)}
      {...props}
    />
  ),
);
SidebarSeparator.displayName = "SidebarSeparator";

// ─── SidebarGroup family ─────────────────────────────────────────────────────

interface SidebarGroupContextValue {
  open: boolean;
  toggle: () => void;
  contentId: string;
  actionsCount: number;
}

const SidebarGroupContext = createContext<SidebarGroupContextValue | null>(
  null,
);

export interface SidebarGroupProps extends SidebarSectionProps {
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SidebarGroup = forwardRef<HTMLDivElement, SidebarGroupProps>(
  (
    {
      className,
      collapsible = false,
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      children,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = openProp ?? uncontrolledOpen;
    const contentId = useId();
    const toggle = useCallback(() => {
      const next = !(openProp ?? uncontrolledOpen);
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    }, [openProp, uncontrolledOpen, onOpenChange]);

    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | null>(null);
    useIsoLayoutEffect(() => {
      if (!collapsible) return;
      const el = contentRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const measure = () => setContentHeight(el.offsetHeight);
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, [collapsible]);
    const measured = contentHeight !== null;

    // Clip while animating; release once settled so focus rings aren't shaved.
    const [settled, setSettled] = useState(open);
    useEffect(() => {
      if (!open) setSettled(false);
    }, [open]);

    // Height animates only when THIS group toggles — a nested re-measure
    // snaps instead of chasing the child's own animation.
    const prevOpenRef = useRef(open);
    const togglingRef = useRef(false);
    if (prevOpenRef.current !== open) {
      prevOpenRef.current = open;
      togglingRef.current = true;
    }

    const isHeaderAction = (k: ReactNode) =>
      isValidElement(k) &&
      (k.type === SidebarGroupAction || k.type === SidebarGroupActions);
    let inner: ReactNode = children;
    let actionsCount = 0;
    if (collapsible) {
      const kids = Children.toArray(children);
      const labelIdx = kids.findIndex(
        (k) => isValidElement(k) && k.type === SidebarGroupLabel,
      );
      if (labelIdx !== -1) {
        const tail = kids.slice(labelIdx + 1);
        const headerActions = tail.filter(isHeaderAction);
        const rest = tail.filter((k) => !isHeaderAction(k));
        actionsCount = headerActions.reduce<number>(
          (n, k) =>
            n +
            (isValidElement(k) && k.type === SidebarGroupActions
              ? Children.count(
                  (k.props as { children?: ReactNode }).children,
                )
              : 1),
          0,
        );
        inner = (
          <>
            {kids.slice(0, labelIdx)}
            <div className="sb-group-header">
              {kids[labelIdx]}
              {headerActions}
            </div>
            <div
              id={contentId}
              aria-hidden={open ? undefined : true}
              className={cn(
                "sb-group-collapse",
                open && settled && "settled",
                togglingRef.current && "anim",
                !measured && !open && "sb-h0",
              )}
              style={{
                height: measured ? (open ? contentHeight : 0) : undefined,
                opacity: open ? 1 : 0,
              }}
              onTransitionEnd={(e) => {
                if (e.propertyName !== "height") return;
                togglingRef.current = false;
                if (open) setSettled(true);
              }}
            >
              <div ref={contentRef} className="sb-group-content-col">
                {rest}
              </div>
            </div>
          </>
        );
      }
    }

    const ctx = useMemo(
      () => ({ open, toggle, contentId, actionsCount }),
      [open, toggle, contentId, actionsCount],
    );

    return (
      <div
        ref={ref}
        data-sidebar="group"
        data-state={collapsible ? (open ? "open" : "closed") : undefined}
        className={cn("sb-group", className)}
        {...props}
      >
        <SidebarGroupContext.Provider value={collapsible ? ctx : null}>
          {inner}
        </SidebarGroupContext.Provider>
      </div>
    );
  },
);
SidebarGroup.displayName = "SidebarGroup";

export interface SidebarGroupLabelProps extends HTMLAttributes<HTMLDivElement> {
  render?: ReactElement;
  asChild?: boolean;
}

export const SidebarGroupLabel = forwardRef<
  HTMLDivElement,
  SidebarGroupLabelProps
>(({ className, render, asChild, children, ...props }, ref) => {
  const sizeVariant = useSizeVariant();
  const sizeClasses = useSize();
  const group = useContext(SidebarGroupContext);

  const body = (
    <>
      <span className="sb-group-label-text">{children}</span>
      {group && (
        <svg
          width={sizeClasses.icon}
          height={sizeClasses.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="sb-chevron"
          data-open={group.open || undefined}
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      )}
    </>
  );

  // Collapsible: the label is a button toggling the group, padded clear of
  // any header actions overlaid on its right edge.
  if (group) {
    return (
      <button
        type="button"
        ref={ref as React.Ref<HTMLButtonElement>}
        data-sidebar="group-label"
        aria-expanded={group.open}
        aria-controls={group.contentId}
        className={cn(
          "sb-group-label sb-group-label-btn",
          sizeClasses.text,
          sizeVariant === "compact" && "compact",
          className,
        )}
        style={{ paddingRight: `${group.actionsCount * 24 + 8}px` }}
        onClick={group.toggle}
      >
        {body}
      </button>
    );
  }

  const { template, content } = resolveSlotTemplate(render, asChild, body);
  return slotElement(
    template,
    "div",
    {
      ref: ref as Ref<HTMLElement>,
      "data-sidebar": "group-label",
      className: cn(
        "sb-group-label",
        sizeClasses.text,
        sizeVariant === "compact" && "compact",
        className,
      ),
      ...props,
    },
    content,
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export interface SidebarGroupActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showOnHover?: boolean;
}

/** One header action button, overlaid on the group's label row. */
export const SidebarGroupAction = forwardRef<
  HTMLButtonElement,
  SidebarGroupActionProps
>(({ className, showOnHover, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    data-sidebar="group-action"
    className={cn("sb-group-action", showOnHover && "hover-only", className)}
    {...props}
  />
));
SidebarGroupAction.displayName = "SidebarGroupAction";

/** Several header actions clustered on the label row's right edge. */
export const SidebarGroupActions = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-actions"
    className={cn("sb-group-actions", className)}
    {...props}
  />
));
SidebarGroupActions.displayName = "SidebarGroupActions";

export const SidebarGroupContent = forwardRef<
  HTMLDivElement,
  SidebarSectionProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("sb-group-content", className)}
    {...props}
  />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

export { SizeProvider, useSize } from "./size-context";
