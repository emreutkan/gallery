// Vendored from fluidfunctionalism.com/r/size-context.json, trimmed to what
// the shipped components consume: the variant ladder + the class tokens each
// step maps to. Tailwind class strings are replaced by sz-*/cb-* CSS classes
// (see the component's own stylesheet).

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export type SizeVariant = "default" | "compact";

export interface SizeClasses {
  variant: SizeVariant;
  /** Bounded control height class — buttons, inputs, list rows. */
  control: string;
  /** control height in px, for consumers that need raw pixels. */
  controlHeight: number;
  /** Gap between glyph and label / neighbouring controls. */
  gap: string;
  /** Horizontal padding of bounded controls. */
  px: string;
  /** Horizontal padding of list rows inside a padded popup. */
  itemPx: string;
  /** Vertical padding for the switch row. */
  py: string;
  /** Label/body text size. */
  text: string;
  /** Glyph size in px. */
  icon: number;
}

const sizeMap: Record<SizeVariant, SizeClasses> = {
  default: {
    variant: "default",
    control: "sz-h-d",
    controlHeight: 36,
    gap: "sz-gap-d",
    px: "sz-px-d",
    itemPx: "sz-ipx-d",
    py: "sz-py-d",
    text: "sz-text-d",
    icon: 16,
  },
  compact: {
    variant: "compact",
    control: "sz-h-c",
    controlHeight: 28,
    gap: "sz-gap-c",
    px: "sz-px-c",
    itemPx: "sz-ipx-c",
    py: "sz-py-c",
    text: "sz-text-c",
    icon: 14,
  },
};

interface SizeContextValue {
  size: SizeVariant;
  setSize: (size: SizeVariant) => void;
  classes: SizeClasses;
}

const SizeContext = createContext<SizeContextValue | null>(null);

/** Resolve the active variant: explicit prop > provider > "default". */
export function useSizeVariant(override?: SizeVariant | null): SizeVariant {
  const ctx = useContext(SizeContext);
  return override ?? ctx?.size ?? "default";
}

/** Resolve size classes: explicit prop > provider > "default". */
export function useSize(override?: SizeVariant | null): SizeClasses {
  return sizeMap[useSizeVariant(override)];
}

export function SizeProvider({
  children,
  size,
  defaultSize = "default",
}: {
  children: ReactNode;
  size?: SizeVariant;
  defaultSize?: SizeVariant;
}) {
  const [internalSize, setInternalSize] = useState<SizeVariant>(defaultSize);
  const isControlled = size !== undefined;
  const resolved = size ?? internalSize;

  const setSize = useCallback(
    (next: SizeVariant) => {
      if (isControlled) return;
      setInternalSize(next);
    },
    [isControlled],
  );

  const value = useMemo(
    () => ({ size: resolved, setSize, classes: sizeMap[resolved] }),
    [resolved, setSize],
  );

  return <SizeContext.Provider value={value}>{children}</SizeContext.Provider>;
}
