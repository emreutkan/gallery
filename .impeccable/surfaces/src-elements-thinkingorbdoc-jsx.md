---
version: 1
slug: "src-elements-thinkingorbdoc-jsx"
primary_target: "src/elements/ThinkingOrbDoc.jsx"
related_targets: []
---

# Surface brief — component doc pages

- Scope: the element doc route (`#/category/element`), currently `#/ai-agents/thinking-orb`.
- Visitor mode: Operate — scan the rail, watch the element, tune props, copy code.
- Audience: public developers/designers evaluating elements for their own projects.
- Direction: canon — the Storybook/shadcn docs arrangement, chosen via the standing exit (seed cb1d8d17); quality bar = shadcn/ui + Storybook.
- Memorable moment: controls panel rewrites the code snippet live; copy is one click and echoes back "Copied".
- Constraints: elements come from third-party libs with their own styles; chrome stays achromatic so their palettes never fight. `.dark`/`.light` classes on `<html>` are both maintained so `theme="auto"` components resolve correctly.
- Unresolved: none blocking. Future elements register in `src/registry.jsx`.
