# classname-no-ds-override

**Category:** ClassName Usage
**Priority:** 3 (HIGH)

## Rule

Do not pass a `className` prop to design-system components to override their
styles. The only exception: `h-`/`w-` utilities on `DialogContent` and `Popover`.

## Why

Overriding a DS component's internal styling defeats the purpose of a shared
component — it makes each usage subtly different and breaks when the component
evolves. Sizing on `DialogContent` and `Popover` is exempted because those
containers legitimately need per-usage dimensions.

## Example

```tsx
// ❌ Avoid
<Button className="bg-red-500 px-8" />

// ✅ Allowed exception
<DialogContent className="w-[560px]" />
<Popover className="h-[320px]" />
```
