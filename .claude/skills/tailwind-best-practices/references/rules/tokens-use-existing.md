# tokens-use-existing

**Category:** Design Tokens
**Priority:** 2 (CRITICAL)

## Rule

Only use tokens defined in `tailwind.config.ts` within `@playground-ui`.

## Why

Tokens are the design system's shared vocabulary. Referencing values outside that
vocabulary produces visual drift that is hard to detect and hard to unwind.

## Example

```tsx
// ❌ Avoid
<div className="bg-[#0a0a0a] mt-[7px]" />

// ✅ Prefer
<div className="bg-surface mt-2" />
```
