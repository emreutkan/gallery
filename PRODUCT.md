# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React (user-chosen). Styling delegated: vanilla CSS, chosen so each showcased element's copyable code stays portable and dependency-free.

## Users

Public visitors — developers and designers browsing a UI component gallery, previewing live elements, and copying code into their own projects.

## Product Purpose

A public showcase of UI components, organized by category. Each element is rendered live with a "copy code" action. Success = a visitor finds an element, sees it working, and copies its code in seconds.

## Operating Context

- First element: `ThinkingOrb` — source vendored from `thinking-orbs` (MIT © Jakub Antalik, Libraries.dev) into `src/elements/thinking-orb/`; nine animated "AI thinking" states, props: `state`, `size`, `theme`, `speed`, `paused`.
- Action Feedback category (7 elements, adapted from interior.dev): Copy Button, Loading Button, Hold to Confirm, Like Burst, Ripple, Icon Morph, Press Depth — upstream used motion + Tailwind; vendored versions keep the hooks verbatim and port the view to CSS/rAF so they need nothing but React.
- Elements are grouped under categories; the collection grows over time.

## Capabilities and Constraints

- Elements are vendored source, never npm packages — the site renders from the vendored files and the copy button hands visitors the complete implementation, portable to any platform.
- Every element needs a copy-source affordance (per-file and copy-all).
- Third-party sources keep their license + attribution alongside the vendored files.

## Product Principles

- The element is the exhibit — live rendering first, code second.
- Copy must be one click, no friction.
- Categories keep the collection browsable as it grows.
