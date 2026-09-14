// Adapted from fluidfunctionalism.com sidebar-menu.tsx — framer-motion,
// cva, lucide removed. Zero-dependency port.
//
// Upstream's useMenuScope fluid-hover machine becomes: each menu keeps an
// ordered map of row elements; hover/active indices position two sliding
// overlays (hover fill, active marker) via CSS-transitioned top/height —
// the same "one highlight glides between rows" feel with no motion lib.
// The ghost-span label weight animation is verbatim (fontVariationSettings;
// inert on non-variable fonts). Roving tabindex + arrow navigation kept.
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
  useLayoutEffect,
  Children,
  type ReactNode,
  type CSSProperties,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactElement,
  type Ref,
} from "react";
import { useSize } from "./size-context";
import { resolveSlotTemplate, slotElement } from "./sidebar";

const cn = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(" ");

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Inter weight tokens — `wght` + compensating `opsz` keep advance width
// nearly constant, so a weight bump never reflows the row.
const fontWeights = {
  normal: "'wght' 400, 'opsz' 14",
  semibold: "'wght' 550, 'opsz' 18",
} as const;

// ─── Menu scope ──────────────────────────────────────────────────────────────

interface MenuScopeValue {
  /** Rows in DOM order; each registers its <li> + primary button. */
  rows: React.MutableRefObject<
    Map<HTMLElement, { row: HTMLElement; button: HTMLElement | null }>
  >;
  hasActive: boolean;
  firstRowEl: HTMLElement | null;
  hoveredRow: HTMLElement | null;
  setHoveredRow: (row: HTMLElement | null) => void;
  activeRow: HTMLElement | null;
  setActiveRow: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}

const MenuScopeContext = createContext<MenuScopeValue | null>(null);

interface MenuItemValue {
  rowRef: React.RefObject<HTMLElement | null>;
  attachRow: (n: HTMLElement | null) => void;
}

const MenuItemContext = createContext<MenuItemValue | null>(null);

// ─── SidebarMenu ─────────────────────────────────────────────────────────────

export type SidebarMenuProps = HTMLAttributes<HTMLUListElement>;

export const SidebarMenu = forwardRef<HTMLUListElement, SidebarMenuProps>(
  ({ className, children, onKeyDown, ...props }, ref) => {
    const listRef = useRef<HTMLUListElement | null>(null);
    const rows = useRef(
      new Map<HTMLElement, { row: HTMLElement; button: HTMLElement | null }>(),
    );
    const [hoveredRow, setHoveredRow] = useState<HTMLElement | null>(null);
    const [activeRow, setActiveRow] = useState<HTMLElement | null>(null);
    const [firstRowEl, setFirstRowEl] = useState<HTMLElement | null>(null);
    const [rects, setRects] = useState<{
      hover: { top: number; height: number } | null;
      active: { top: number; height: number } | null;
    }>({ hover: null, active: null });

    const scope = useMemo<MenuScopeValue>(
      () => ({
        rows,
        hasActive: activeRow !== null,
        firstRowEl,
        hoveredRow,
        setHoveredRow,
        activeRow,
        setActiveRow,
      }),
      [activeRow, firstRowEl, hoveredRow],
    );

    // Position both overlays from the rows' real offsets — the list is the
    // offsetParent, so hover/active slides track scroll too.
    useIsoLayoutEffect(() => {
      const list = listRef.current;
      if (!list) return;
      const measure = () => {
        const listTop = list.getBoundingClientRect().top;
        const toRect = (row: HTMLElement | null) => {
          if (!row) return null;
          const r = row.getBoundingClientRect();
          return { top: r.top - listTop + list.scrollTop, height: r.height };
        };
        setRects({ hover: toRect(hoveredRow), active: toRect(activeRow) });
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(list);
      return () => ro.disconnect();
    }, [hoveredRow, activeRow, children]);

    // Keep firstRowEl fresh for the roving-tabindex fallback.
    useIsoLayoutEffect(() => {
      const first = listRef.current?.querySelector(
        '[data-sidebar="menu-item"], [data-sidebar="menu-sub-item"]',
      );
      setFirstRowEl((first as HTMLElement) ?? null);
    }, [children]);

    const buttonsInOrder = useCallback(() => {
      const list = listRef.current;
      if (!list) return [] as HTMLElement[];
      return Array.from(
        list.querySelectorAll<HTMLElement>(
          '[data-sidebar="menu-button"], [data-sidebar="menu-sub-button"]',
        ),
      ).filter((el) => !(el as HTMLButtonElement).disabled);
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLUListElement>) => {
        onKeyDown?.(e);
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End")
          return;
        const buttons = buttonsInOrder();
        if (buttons.length === 0) return;
        const current = document.activeElement as HTMLElement | null;
        const idx = current ? buttons.indexOf(current) : -1;
        e.preventDefault();
        let next: number;
        if (e.key === "Home") next = 0;
        else if (e.key === "End") next = buttons.length - 1;
        else next = (idx + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
      },
      [onKeyDown, buttonsInOrder],
    );

    return (
      <MenuScopeContext.Provider value={scope}>
        <ul
          ref={(node) => {
            listRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref)
              (ref as React.MutableRefObject<HTMLUListElement | null>).current =
                node;
          }}
          data-sidebar="menu"
          role="list"
          className={cn("sb-menu", className)}
          onKeyDown={handleKeyDown}
          onMouseLeave={() => setHoveredRow(null)}
          {...props}
        >
          {/* Sliding overlays — the list is the offsetParent. */}
          {rects.hover && (
            <div
              aria-hidden
              className="sb-menu-hover"
              style={{ top: rects.hover.top, height: rects.hover.height }}
            />
          )}
          {rects.active && (
            <div
              aria-hidden
              className="sb-menu-active"
              style={{ top: rects.active.top, height: rects.active.height }}
            />
          )}
          {children}
        </ul>
      </MenuScopeContext.Provider>
    );
  },
);
SidebarMenu.displayName = "SidebarMenu";

// ─── Row items ───────────────────────────────────────────────────────────────

function useMenuRow(
  rowRef: React.RefObject<HTMLElement | null>,
): MenuItemValue & { attachRow: (n: HTMLElement | null) => void } {
  const scope = useContext(MenuScopeContext);
  const lastNode = useRef<HTMLElement | null>(null);

  const attachRow = useCallback(
    (node: HTMLElement | null) => {
      (rowRef as React.MutableRefObject<HTMLElement | null>).current = node;
      if (!scope) return;
      if (lastNode.current && lastNode.current !== node)
        scope.rows.current.delete(lastNode.current);
      lastNode.current = node;
      if (node) scope.rows.current.set(node, { row: node, button: null });
    },
    [scope, rowRef],
  );

  // Hover reports: the row tells the scope which <li> the pointer is on.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !scope) return;
    const onEnter = () => scope.setHoveredRow(row);
    row.addEventListener("pointerenter", onEnter);
    return () => row.removeEventListener("pointerenter", onEnter);
  }, [scope, rowRef]);

  return { rowRef: rowRef as React.RefObject<HTMLElement | null>, attachRow };
}

// ─── SidebarMenuItem / SubItem ───────────────────────────────────────────────

export type SidebarMenuItemProps = LiHTMLAttributes<HTMLLIElement>;

export const SidebarMenuItem = forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  ({ className, children, ...props }, ref) => {
    const rowRef = useRef<HTMLElement | null>(null);
    const item = useMenuRow(rowRef);
    const refCb = useCallback(
      (node: HTMLLIElement | null) => {
        item.attachRow(node);
        if (typeof ref === "function") ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLLIElement | null>).current = node;
      },
      // item.attachRow is stable (useCallback on scope)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [item.attachRow, ref],
    );
    return (
      <MenuItemContext.Provider value={item}>
        <li
          ref={refCb}
          data-sidebar="menu-item"
          className={cn("sb-menu-item", className)}
          {...props}
        >
          {children}
        </li>
      </MenuItemContext.Provider>
    );
  },
);
SidebarMenuItem.displayName = "SidebarMenuItem";

export type SidebarMenuSubItemProps = LiHTMLAttributes<HTMLLIElement>;

export const SidebarMenuSubItem = forwardRef<
  HTMLLIElement,
  SidebarMenuSubItemProps
>(({ className, children, ...props }, ref) => {
  const rowRef = useRef<HTMLElement | null>(null);
  const item = useMenuRow(rowRef);
  const refCb = useCallback(
    (node: HTMLLIElement | null) => {
      item.attachRow(node);
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLLIElement | null>).current = node;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.attachRow, ref],
  );
  return (
    <MenuItemContext.Provider value={item}>
      <li
        ref={refCb}
        data-sidebar="menu-sub-item"
        className={cn("sb-menu-item", className)}
        {...props}
      >
        {children}
      </li>
    </MenuItemContext.Provider>
  );
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

// ─── Row label (ghost-span weight animation) ─────────────────────────────────

function MenuRowLabel({
  content,
  lit,
  emphasized,
  textClass,
}: {
  content: ReactNode;
  lit: boolean;
  emphasized: boolean;
  textClass: string;
}) {
  const nodes = Children.toArray(content);
  const textParts: string[] = [];
  let i = 0;
  while (
    i < nodes.length &&
    (typeof nodes[i] === "string" || typeof nodes[i] === "number")
  ) {
    textParts.push(String(nodes[i]));
    i++;
  }
  const label = textParts.join("");
  const rest = nodes.slice(i);

  if (!label) {
    return (
      <span
        className={cn("sb-row-label", lit && "lit", textClass)}
      >
        {content}
      </span>
    );
  }

  return (
    <>
      <span className={cn("sb-row-ghost", textClass)}>
        {/* Ghost: reserves width at the heaviest weight, hidden from AT. */}
        <span
          className="sb-row-ghost-cell"
          style={{ fontVariationSettings: fontWeights.semibold }}
          aria-hidden="true"
        >
          {label}
        </span>
        {/* Visible: animates between weights in the same cell. */}
        <span
          className={cn("sb-row-ghost-cell", "sb-row-ghost-vis", lit && "lit")}
          style={{
            fontVariationSettings: emphasized
              ? fontWeights.semibold
              : fontWeights.normal,
          }}
        >
          {label}
        </span>
      </span>
      {rest}
    </>
  );
}

// ─── SidebarMenuButton ───────────────────────────────────────────────────────

export interface SidebarMenuButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
  icon?: React.ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
  }>;
  status?: "active" | "unread" | "idle";
  dot?: "filled" | "ring";
  render?: ReactElement;
  asChild?: boolean;
}

export const SidebarMenuButton = forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(
  (
    {
      isActive = false,
      size = "default",
      variant,
      icon: Icon,
      status,
      dot,
      render,
      asChild,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const scope = useContext(MenuScopeContext);
    const item = useContext(MenuItemContext);
    const sizeClasses = useSize();
    const buttonRef = useRef<HTMLElement | null>(null);

    const effectiveActive = isActive || status === "active";

    // Report active + button element up to the scope: the marker overlay
    // glides to this row and the roving tabindex keys off it.
    useIsoLayoutEffect(() => {
      const row = item?.rowRef.current;
      if (!scope || !row || !effectiveActive) return;
      scope.setActiveRow(row);
      return () => {
        scope.setActiveRow((prev) => (prev === row ? null : prev));
      };
      // item is a fresh object each render; only identity-relevant deps matter
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveActive, scope, item?.rowRef]);

    useIsoLayoutEffect(() => {
      const row = item?.rowRef.current;
      if (scope && row) {
        const rec = scope.rows.current.get(row);
        if (rec) rec.button = buttonRef.current;
      }
    }, [scope, item]);

    const resolvedDot =
      dot ?? (status ? (status === "idle" ? "ring" : "filled") : undefined);
    const isHovered = scope?.hoveredRow === item?.rowRef.current;
    const lit = effectiveActive || isHovered;
    const heightClass =
      size === "sm"
        ? "sb-h-sm"
        : size === "lg"
          ? "sb-h-lg"
          : sizeClasses.variant === "compact"
            ? "sb-h-sm"
            : "sb-h-d";
    const textClass = size === "sm" ? "sz-text-c" : sizeClasses.text;

    // Roving tabindex: the active row is the menu's tab stop; with no
    // active row, the first row keeps the menu keyboard-reachable.
    const row = item?.rowRef.current ?? null;
    const tabIdx = effectiveActive
      ? 0
      : scope?.hasActive
        ? -1
        : row !== null && row === scope?.firstRowEl
          ? 0
          : -1;

    const { template, content } = resolveSlotTemplate(render, asChild, children);

    const inner = (
      <>
        {Icon && (
          <Icon
            size={sizeClasses.icon}
            strokeWidth={lit ? 2 : 1.5}
            className={cn("sb-row-icon", lit && "lit")}
          />
        )}
        {!Icon && resolvedDot && (
          <span
            className="sb-dot-wrap"
            style={{ width: sizeClasses.icon, height: sizeClasses.icon }}
          >
            <span
              className={cn(
                "sb-dot",
                resolvedDot === "filled" ? "filled" : "ring",
                lit && "lit",
              )}
            />
          </span>
        )}
        <MenuRowLabel
          content={content}
          lit={lit}
          emphasized={effectiveActive}
          textClass={textClass}
        />
        {status === "unread" && <span className="sb-sr">, unread</span>}
      </>
    );

    return slotElement(
      template,
      "button",
      {
        ref: (node: HTMLElement | null) => {
          buttonRef.current = node;
          if (typeof ref === "function") ref(node as HTMLButtonElement | null);
          else if (ref)
            (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        },
        type: template ? undefined : "button",
        "data-sidebar": "menu-button",
        "data-size": size,
        "data-active": effectiveActive ? "true" : undefined,
        "data-status": status,
        "aria-current": effectiveActive ? "page" : undefined,
        tabIndex: tabIdx,
        className: cn(
          "sb-row-btn",
          variant === "outline" && "sb-row-outline",
          heightClass,
          className,
        ),
        ...props,
      },
      inner,
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

// ─── MenuAction / Actions / Badge / Skeleton ─────────────────────────────────

export interface SidebarMenuActionProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  showOnHover?: boolean;
}

export const SidebarMenuAction = forwardRef<
  HTMLButtonElement,
  SidebarMenuActionProps
>(({ className, showOnHover, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    data-sidebar="menu-action"
    className={cn("sb-menu-action", showOnHover !== false && "hover-only", className)}
    {...props}
  />
));
SidebarMenuAction.displayName = "SidebarMenuAction";

export const SidebarMenuActions = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-actions"
    className={cn("sb-menu-actions", className)}
    {...props}
  />
));
SidebarMenuActions.displayName = "SidebarMenuActions";

export type SidebarMenuBadgeProps = HTMLAttributes<HTMLDivElement>;

export const SidebarMenuBadge = forwardRef<HTMLDivElement, SidebarMenuBadgeProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="menu-badge"
      className={cn("sb-menu-badge", className)}
      {...props}
    />
  ),
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";

export interface SidebarMenuSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  showIcon?: boolean;
}

export const SidebarMenuSkeleton = forwardRef<
  HTMLDivElement,
  SidebarMenuSkeletonProps
>(({ className, showIcon = true, ...props }, ref) => {
  const width = useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, []);
  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("sb-skel", className)}
      {...props}
    >
      {showIcon && <span className="sb-skel-icon" />}
      <span className="sb-skel-bar" style={{ width }} />
    </div>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

// ─── MenuSub family ──────────────────────────────────────────────────────────

export type SidebarMenuSubProps = HTMLAttributes<HTMLUListElement>;

export const SidebarMenuSub = forwardRef<HTMLUListElement, SidebarMenuSubProps>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu-sub"
      className={cn("sb-menu-sub", className)}
      {...props}
    />
  ),
);
SidebarMenuSub.displayName = "SidebarMenuSub";

export interface SidebarMenuSubButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  size?: "sm" | "default";
  render?: ReactElement;
  asChild?: boolean;
}

export const SidebarMenuSubButton = forwardRef<
  HTMLButtonElement,
  SidebarMenuSubButtonProps
>(
  (
    { isActive = false, size = "default", render, asChild, className, children, ...props },
    ref,
  ) => {
    const sizeClasses = useSize();
    const { template, content } = resolveSlotTemplate(render, asChild, children);
    return slotElement(
      template,
      "button",
      {
        ref: ref as Ref<HTMLElement>,
        type: template ? undefined : "button",
        "data-sidebar": "menu-sub-button",
        "data-active": isActive ? "true" : undefined,
        "aria-current": isActive ? "page" : undefined,
        className: cn(
          "sb-sub-btn",
          size === "sm" ? "sb-h-sm" : sizeClasses.variant === "compact" ? "sb-h-sm" : "sb-h-d",
          size === "sm" ? "sz-text-c" : sizeClasses.text,
          isActive && "lit",
          className,
        ),
        ...props,
      },
      content,
    );
  },
);
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";
