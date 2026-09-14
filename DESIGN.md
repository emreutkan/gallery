---
name: UI Elements
description: A categorized showcase of UI components with live previews and copyable code.
colors:
  canvas: "#ffffff"
  canvas-subtle: "#fafafa"
  ink: "#09090b"
  ink-secondary: "#3f3f46"
  ink-muted: "#71717a"
  wash: "#f4f4f5"
  line: "#e4e4e7"
  line-strong: "#d4d4d8"
  code-surface: "#f7f7f8"
  canvas-dark: "#09090b"
  canvas-subtle-dark: "#0e0e10"
  ink-dark: "#fafafa"
  ink-secondary-dark: "#d4d4d8"
  ink-muted-dark: "#a1a1aa"
  wash-dark: "#18181b"
  line-dark: "#27272a"
  line-strong-dark: "#3f3f46"
  code-surface-dark: "#121214"
typography:
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.04em"
  code:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "44px"
components:
  copy-button:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-secondary}"
    rounded: "7px"
    padding: "5px 10px"
  segmented-option-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  code-block:
    backgroundColor: "{colors.code-surface}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  preview-plate:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
  sidebar-link-active:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    rounded: "7px"
    padding: "6px 8px"
---

# Design System: UI Elements

## Overview

**Creative North Star: "The Category Standard"**

This system is the deliberate canon: the docs-grade component gallery that
Storybook and shadcn/ui set as the craft bar, executed without irony or
smuggled quirk. Zinc-neutrals, hairline borders, quiet type hierarchy — every
surface decision exists so the showcased element stays the loudest thing on
the page. The UI recedes; the element leads.

Personality is restrained and instrumental. Density follows docs conventions:
a 56px topbar, a 264px category rail, an 880px doc column, and a fixed doc
shape per element — name, provenance chip, live preview with controls, generated
code, variants, usage in context, props table. Familiarity is the feature:
a visitor who has read any modern component docs already knows how to use
this site.

**Key Characteristics:**
- Live preview on a dot-grid canvas — the one textured surface in the system
- Controls drive the code snippet: the generated source always mirrors the preview state
- Strict light/dark theming via `.dark` / `.light` class on `<html>`; showcased elements follow it
- Monochrome-ink philosophy extends to hosted components (ThinkingOrb resolves ink from the page theme)

## Colors

The palette is a two-mode zinc ramp: near-white canvases and near-black ink
in light mode, inverted in dark mode. There is no brand accent — the primary
is the ink itself, used for active states and the selection color.

### Primary
- **Ink** (#09090b light / #fafafa dark): text, active segmented options, selection fill, switch track when on.

### Neutral
- **Canvas** (#ffffff / #09090b): page and plate ground.
- **Canvas Subtle** (#fafafa / #0e0e10): controls strip under the preview.
- **Wash** (#f4f4f5 / #18181b): hover fills, active sidebar links, chat bubble, switch-off track.
- **Line** (#e4e4e7 / #27272a): every border — hairlines only.
- **Line Strong** (#d4d4d8 / #3f3f46): hover borders, scrollbar thumbs, dot-grid dots.
- **Ink Secondary** (#3f3f46 / #d4d4d8): secondary text, code body.
- **Ink Muted** (#71717a / #a1a1aa): descriptions, labels, captions — always ≥4.5:1 on its ground.
- **Code Surface** (#f7f7f8 / #121214): code blocks and provenance chips.

### Named Rules
**The Ink Is the Accent Rule.** Active state is shown by inverting to
ink-on-canvas, never by introducing a hue. Color enters the page only through
the showcased components themselves — the chrome stays achromatic so
third-party palettes never fight the frame.

**The Two-Mode Rule.** Every token exists as a light/dark pair switched by
`.dark`/`.light` on `<html>`. Both classes are always present (one active) so
hosted components can resolve `theme="auto"` from an ancestor class rather
than falling through to OS preference.

## Typography

**Body Font:** Inter (system-ui fallback)
**Label/Mono Font:** JetBrains Mono (ui-monospace fallback)

**Character:** Inter is the canon's workhorse — its familiarity here is the
point, not a lapse. JetBrains Mono is reserved for code, data, and HUD-style
labels (state names, stage captions, package tags), never as a "technical"
costume on prose.

### Hierarchy
- **Headline** (700, 28px, -0.02em): element name at the top of its doc.
- **Title** (600, 18px, -0.01em): doc sections — States, In context, Props.
- **Body** (400, 15px, 1.6): descriptions, table cells; measure capped at 65ch.
- **Label** (600, 11px, +0.04em, uppercase): control labels only.
- **Code** (400, 13px, 1.7, JetBrains Mono): snippets, provenance chip, captions (11–12px).

## Layout

A two-axis docs shell: 56px sticky topbar over a 264px sidebar + fluid doc
column (max 880px, 40/48px padding). Below 860px the sidebar becomes an
off-canvas drawer with a scrim, the hamburger appears in the topbar, and the
doc column takes full width. Spacing rhythm: tight groups inside a unit,
generous separation between doc sections (44px), more space above a heading
than below it. The preview stage is a fixed 340px-min dot-grid canvas; the
controls strip sits directly under it inside the same plate.

## Elevation & Depth

Flat by default. Depth is tonal layering (canvas → subtle → wash) plus one
ambient shadow, never stacked cards.

### Shadow Vocabulary
- **Ambient plate** (`0 1px 2px rgba(9,9,11,.05), 0 4px 16px -8px rgba(9,9,11,.1)`; dark mode doubles opacity): the preview plate and the mobile drawer only.
- **Focus ring** (`2px solid {ink}`, offset 2px): `:focus-visible` on every interactive element.

### Named Rules
**The Flat-By-Default Rule.** Cards, cells, and code blocks sit flat on the
canvas behind hairline borders. The shadow belongs to surfaces that present
an element (the preview plate) or float above the layout (the drawer) —
never as decoration.

## Shapes

Small radii, squared-off but not sharp: 6px for tags and segmented options,
7–8px for buttons, links, and chips, 10px for plates and blocks, 999px for
the switch track. All borders are 1px hairlines; the selected state cell
doubles its ring with an inset `box-shadow`, not a thicker border.

## Components

### Buttons
- **Shape:** 7px radius, hairline border, 5px 10px padding.
- **Default (copy / icon actions):** canvas background, secondary-ink text, `Line Strong` border on hover, 1px press-down on `:active`.
- **Feedback:** the copy button swaps its icon for a check and reads "Copied" for 1.6s — the state change is the confirmation.
- **Icon buttons:** same chrome, square 34px, for the theme toggle and drawer trigger.

### Segmented control
- **Style:** 8px-radius pill track on canvas inside a hairline; options are mono-text buttons.
- **Active option:** inverted to ink-on-canvas — the system's one emphatic fill.

### Switch
- **Style:** 36×20px pill, 14px ink thumb; on = accent track + thumb translated 16px. Real `role="switch"` + `aria-checked`.

### Code block
- **Style:** code-surface ground, hairline border, 10px radius; a slim head row carries the filename and a copy button.
- **Content:** hand-rolled JSX highlighting — tag/attr/string/keyword/comment tones, each ≥4.5:1 in both modes.

### Preview plate
- **Style:** the only shadowed surface; dot-grid canvas (20px cells, `Line Strong` dots), 340px-min stage, mono HUD captions ("preview", size note) in the corners; controls strip attached below.

### Sidebar navigation
- **Style:** category label in 12px semibold; links are flat rows, muted ink default, wash fill on hover/active; package name in 11px mono floats right.

### Props table
- **Style:** hairline row rules, prop names in mono, types/defaults in small mono; wraps in a horizontal scroller below the breakpoint.

## Do's and Don'ts

### Do:
- **Do** let the showcased element be the only colored or animated thing on the page.
- **Do** keep the generated snippet in sync with the preview controls — omit props at their defaults.
- **Do** set both `dark` and `light` classes on `<html>` so hosted components resolve `theme="auto"` correctly.
- **Do** add elements by vendoring their full source into `src/elements/<name>/` (license file included) plus a doc component registered in `src/registry.jsx` — never an npm dependency, never by editing the shell.
- **Do** port upstream dependencies away when vendoring: hooks/logic stay verbatim, but a source that imports `motion` or Tailwind is rewritten to CSS transitions, keyframes, or a rAF tween so the copied file needs nothing but React. Vendored elements keep their own palette (e.g. interior.dev's stone ramp) — the Ink-Is-the-Accent rule governs the chrome, not the exhibits.

### Don't:
- **Don't** let the copy button hand out a package import — the deliverable is the source code itself, portable to any platform.
- **Don't** introduce a brand accent color; the ink inversion is the active state.
- **Don't** put shadows on cards, cells, or code blocks — hairlines carry them.
- **Don't** use the mono face for prose or headings; it is for code, data, and HUD labels only.
- **Don't** add kickers or eyebrows above headings; the heading carries its own weight.
