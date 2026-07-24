# classname-no-arbitrary

**Category:** ClassName Usage
**Priority:** 3 (HIGH)

## Rule

No arbitrary Tailwind values (e.g. `p-[13px]`, `text-[#123456]`), **except** for
`height` and `width`, where arbitrary values are permitted.

## Why

Arbitrary values bypass the token system and reintroduce the drift tokens are
meant to prevent. Sizing (`h-`/`w-`) is the pragmatic exception because exact
dimensions are often layout-driven and not part of the token scale.

## Example

```tsx
// ❌ Avoid
<div className="gap-[11px] text-[13px]" />

// ✅ Allowed exception
<div className="h-[420px] w-[280px]" />
```
