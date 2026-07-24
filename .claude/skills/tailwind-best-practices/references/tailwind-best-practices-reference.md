# Tailwind Best Practices — Full Reference

Complete guide to the styling rules for the component library UI. These patterns
keep the design system consistent, prevent token drift, and protect the
integrity of the shared component library.

## Table of contents

- [Component Usage](#component-usage)
- [Design Tokens](#design-tokens)
- [ClassName Usage](#classname-usage)

---

## Component Usage

### `component-use-existing`

**Rule:** Use existing components from `@playground-ui/ds/components/`. Never
create new components inside the `ds/` folder.

**Why:** The design system is the shared visual language of the app. Building a
one-off component that duplicates something the DS already provides fragments the
UI, doubles maintenance, and lets inconsistencies creep in. The `ds/` folder is
the source of truth — adding to it silently changes the system for every consumer.

```tsx
// ❌ Avoid — new bespoke button
function MyButton(props) {
  return <button className="rounded-md bg-blue-500 px-4 py-2" {...props} />;
}

// ✅ Prefer — reuse the design-system component
import { Button } from '@playground-ui/ds/components/Button';

function Toolbar() {
  return <Button variant="primary">Save</Button>;
}
```

If the design system genuinely lacks what you need, raise it with the DS owners
rather than adding to `ds/` yourself.

---

## Design Tokens

### `tokens-use-existing`

**Rule:** Only use tokens defined in `tailwind.config.ts` within
`@playground-ui`.

**Why:** Tokens (colors, spacing, radii, typography) are the design system's
shared vocabulary. Referencing values outside that vocabulary produces visual
drift that's hard to detect and hard to unwind later.

```tsx
// ❌ Avoid — off-token color and spacing
<div className="bg-[#0a0a0a] mt-[7px]" />

// ✅ Prefer — configured tokens
<div className="bg-surface mt-2" />
```

### `tokens-no-modification`

**Rule:** Never modify design tokens or edit `tailwind.config.ts`.

**Why:** A token change ripples across every component that references it, often
producing regressions far from the file you edited. Token changes are a
design-system-level decision, not a per-feature one.

---

## ClassName Usage

### `classname-no-arbitrary`

**Rule:** No arbitrary Tailwind values, **except** `height` and `width`.

**Why:** Arbitrary values like `p-[13px]` or `text-[#123]` bypass the token
system and reintroduce the drift tokens are meant to prevent. Sizing (`h-`/`w-`)
is the pragmatic exception because exact dimensions are often layout-driven and
not part of the token scale.

```tsx
// ❌ Avoid
<div className="gap-[11px] text-[13px]" />

// ✅ Allowed exception — arbitrary height/width
<div className="h-[420px] w-[280px]" />
```

### `classname-no-ds-override`

**Rule:** Do not pass a `className` prop to design-system components to override
their styling. The only exception: `h-`/`w-` utilities on `DialogContent` and
`Popover`.

**Why:** Overriding a DS component's internal styling defeats the purpose of a
shared component — it makes each usage subtly different and breaks when the
component evolves. Sizing on `DialogContent` and `Popover` is exempted because
those containers legitimately need per-usage dimensions.

```tsx
// ❌ Avoid — overriding DS component styles
<Button className="bg-red-500 px-8" />

// ✅ Allowed exception — sizing an overlay container
<DialogContent className="w-[560px]" />
<Popover className="h-[320px]" />
```
