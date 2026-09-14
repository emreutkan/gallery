// Local replacement for `esm-env` (upstream's only runtime dep) —
// keeps the vendored tree dependency-free.
export const BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined'
