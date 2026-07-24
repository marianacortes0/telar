---
name: tailwind-best-practices
description: Styling guardrails for Tailwind CSS work in the component library. Use whenever writing, reviewing, or refactoring React components with Tailwind classes, adding or modifying UI elements, or checking styling consistency — especially in packages/playground-ui and packages/playground. Enforces reusing existing design-system components, only using tokens from tailwind.config.ts, and avoiding arbitrary Tailwind values so the design system stays consistent and free of token drift.
---

# Tailwind Best Practices

## Overview

Styling guidelines for the component library UI: 5 rules across 3 categories,
prioritized by impact. These rules exist to keep the design system consistent,
prevent token drift, and protect the integrity of the component library.

## Scope

Apply these rules primarily in:

- `packages/playground-ui`
- `packages/playground`

## When to apply

Reach for these guidelines when:

- Writing new React components with Tailwind styles
- Reviewing code for styling consistency
- Refactoring existing styled components
- Adding or modifying UI elements

## Priority-ordered guidelines

Rules are ordered by impact — apply the higher-priority ones first when they conflict.

| Priority | Category        | Impact   |
| -------- | --------------- | -------- |
| 1        | Component Usage | CRITICAL |
| 2        | Design Tokens   | CRITICAL |
| 3        | ClassName Usage | HIGH     |

## The rules

### 1. Component Usage (CRITICAL)

- **`component-use-existing`** — Use existing components from
  `@playground-ui/ds/components/` instead of building new ones. The design
  system already covers most needs; reinventing a component fragments the UI and
  duplicates maintenance.
- **Never create new components in the `ds/` folder.** That folder is the source
  of truth for the design system — additions there change the system for everyone.

### 2. Design Tokens (CRITICAL)

- **`tokens-use-existing`** — Only use tokens already defined in
  `tailwind.config.ts` within `@playground-ui`. Tokens are the shared vocabulary
  of the design system; using values outside them causes visual drift.
- **`tokens-no-modification`** — Never modify design tokens or edit
  `tailwind.config.ts`. Changing a token ripples across every component that uses
  it, often in unintended ways.

### 3. ClassName Usage (HIGH)

- **`classname-no-arbitrary`** — No arbitrary Tailwind values (e.g. `p-[13px]`,
  `text-[#123456]`) **except** for `height` and `width`, where arbitrary values
  are permitted. Arbitrary values bypass the token system and reintroduce drift.
- **`classname-no-ds-override`** — Do not pass a `className` prop to design-system
  components to override their styles. The only exception: `h-`/`w-` utilities on
  `DialogContent` and `Popover`, where sizing overrides are expected.

## Quick reference

**Critical patterns (apply first):**

- Reuse components from `@playground-ui/ds/components/`; never add to `ds/`.
- Only use tokens from `tailwind.config.ts`; never modify it.

**High-impact patterns:**

- No arbitrary Tailwind values except `height` and `width`.
- No `className` overrides on DS components except `h-`/`w-` on `DialogContent`
  and `Popover`.

## References

Deeper documentation and per-rule detail live in:

- `references/tailwind-best-practices-reference.md` — complete guide with all patterns
- `references/rules/` — individual rule files organized by category

To look up a specific pattern, grep the rules directory:

```
grep -l "component" references/rules/
grep -l "token" references/rules/
grep -l "className" references/rules/
```

Rule categories in `references/rules/`:

- `component-*` — Component usage rules (1 rule)
- `tokens-*` — Design token rules (2 rules)
- `classname-*` — ClassName usage rules (2 rules)
