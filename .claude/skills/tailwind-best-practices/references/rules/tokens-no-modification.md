# tokens-no-modification

**Category:** Design Tokens
**Priority:** 2 (CRITICAL)

## Rule

Never modify design tokens or edit `tailwind.config.ts`.

## Why

A token change ripples across every component that references it, often producing
regressions far from the file you edited. Token changes are a
design-system-level decision, not a per-feature one.
