// Vendored from fluidfunctionalism.com/r/size-context.json, trimmed to what
// the shipped components consume: the variant ladder + the class tokens each
// step maps to. Tailwind class strings are replaced by sw-* CSS classes
// (see switch.css / the component's own stylesheet).

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
  /** Gap between control glyph and label / between neighbouring controls. */
  gap: string;
  /** Horizontal padding of bounded controls. */
  px: string;
  /** Vertical padding for the switch row. */
  py: string;
  /** Label/body text size. */
  text: string;
}

const sizeMap: Record<SizeVariant, SizeClasses> = {
  // 36px control height, 13px label.
  default: {
    variant: "default",
    gap: "sz-gap-d",
    px: "sz-px-d",
    py: "sz-py-d",
    text: "sz-text-d",
  },
  // 28px control height, 12px label — dense surfaces.
  compact: {
    variant: "compact",
    gap: "sz-gap-c",
    px: "sz-px-c",
    py: "sz-py-c",
    text: "sz-text-c",
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
