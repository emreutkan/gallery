# Surface brief — component doc pages

- Scope: the element doc route (`#/category/element`), currently `#/ai-agents/thinking-orb`.
- Visitor mode: Operate — scan the rail, watch the element, tune props, copy code.
- Audience: public developers/designers evaluating elements for their own projects.
- Direction: canon — the Storybook/shadcn docs arrangement, chosen via the standing exit (seed cb1d8d17); quality bar = shadcn/ui + Storybook.
- Memorable moment: the source browser — every element's complete implementation is vendored in-repo and copyable in one click (per-file or concatenated copy-all), so a visitor can drop it into any project or hand it to an agent to port (Swift, Kotlin, Skia).
- Constraints: elements are vendored source, never npm packages — no install step, license + attribution ship with the files; chrome stays achromatic so hosted palettes never fight. `.dark`/`.light` classes on `<html>` are both maintained so `theme="auto"` components resolve correctly.
- Unresolved: none blocking. Future elements vendor into `src/elements/<name>/` and register in `src/registry.jsx`.
