# component-use-existing

**Category:** Component Usage
**Priority:** 1 (CRITICAL)

## Rule

Use existing components from `@playground-ui/ds/components/`. Never create new
components inside the `ds/` folder.

## Why

The design system is the shared visual language of the app. A one-off component
that duplicates an existing DS component fragments the UI and doubles
maintenance. The `ds/` folder is the source of truth — adding to it changes the
system for every consumer.

## Example

```tsx
// ❌ Avoid
function MyButton(props) {
  return <button className="rounded-md bg-blue-500 px-4 py-2" {...props} />;
}

// ✅ Prefer
import { Button } from '@playground-ui/ds/components/Button';
<Button variant="primary">Save</Button>;
```
