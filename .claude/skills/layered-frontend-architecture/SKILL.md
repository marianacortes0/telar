---
name: layered-frontend-architecture
description: Enforces a three-layer frontend architecture — Pages → Hooks → Services — with strict single responsibility and a one-way dependency direction. Use when creating or reviewing frontend features, deciding where data fetching / state / UI logic belongs, structuring directories, or refactoring components that mix concerns. Trigger it whenever you see fetch() or axios in a component, useState holding business logic inside a page, a page importing a service directly, or a single file mixing UI, state, and I/O. Covers React, Vue 3, and Angular adaptations.
---

# Layered Frontend Architecture — Pages · Hooks · Services

## Core principle

Each layer has a single responsibility, and no layer may reach past the one
directly below it.

```
┌─────────────────────────────────┐
│           PAGES                 │  ← Visual composition, routes, user input
├─────────────────────────────────┤
│           HOOKS                 │  ← State, effects, logic orchestration
├─────────────────────────────────┤
│          SERVICES               │  ← External communication (APIs, storage…)
└─────────────────────────────────┘
```

**Dependency rule:** Pages → Hooks → Services. Never the reverse. A Page talks
to a Hook, a Hook talks to a Service, a Service talks to the outside world. Skipping
a layer (e.g. a Page calling a Service) is the thing this architecture exists to
prevent.

## Directory structure

```
src/
├── pages/              # Route components / full views
│   └── Users/
│       └── UsersPage.tsx
├── hooks/              # Custom hooks per domain or feature
│   └── useUsers.ts
├── services/           # Data-access logic
│   └── usersService.ts
├── components/         # Reusable UI (pure, no business logic)
├── types/              # Shared interfaces and types
└── utils/              # Pure utility functions
```

For large projects, organize by feature instead:

```
src/features/
└── users/
    ├── pages/UsersPage.tsx
    ├── hooks/useUsers.ts
    ├── services/usersService.ts
    └── types.ts
```

## Layer 1: Services

**Sole responsibility:** communication with the outside world — HTTP (`fetch`,
`axios`), `localStorage`/`sessionStorage`/cookies, WebSockets, GraphQL, any I/O
side effect.

Rules:

- They are **pure functions** — no React state, no hooks.
- They take parameters and return data, or throw errors.
- They know nothing about React, Vue, or Angular.
- They handle basic response transformation (map DTO → domain).

```typescript
// services/usersService.ts
const BASE_URL = '/api/users';

export async function getUsers(): Promise<User[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function createUser(data: CreateUserDTO): Promise<User> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}
```

## Layer 2: Hooks

**Sole responsibility:** reactive state, effects, and orchestration —
`useState`, `useEffect`, `useReducer`, `useCallback`, `useMemo`. Call Services and
own the `loading`/`error`/`data` lifecycle. Expose clean actions and state to the
Pages, and hold the business logic (filters, validations, state derivations).

Rules:

- They only call Services — never `fetch` directly.
- They never render JSX/templates.
- One hook per domain or feature — not one giant hook for everything.
- Name them with the `use` prefix.

```typescript
// hooks/useUsers.ts
import { useState, useEffect, useCallback } from 'react';
import { getUsers, createUser, deleteUser } from '../services/usersService';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await getUsers());
    } catch {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = useCallback(async (data: CreateUserDTO) => {
    setLoading(true);
    try {
      const newUser = await createUser(data);
      setUsers(prev => [...prev, newUser]);
    } catch {
      setError('No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeUser = useCallback(async (id: string) => {
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {
      setError('No se pudo eliminar el usuario');
    }
  }, []);

  return { users, loading, error, addUser, removeUser, refresh: fetchUsers };
}
```

## Layer 3: Pages

**Sole responsibility:** visual composition and handling user input — import and
use hooks, render UI components, pass user events (clicks, forms) to the hooks,
define view layout, handle routing.

Rules:

- They **never** call Services directly.
- They contain no business logic.
- They don't `fetch` and don't manage complex state.
- They read easily: just JSX plus calls to the hook.

```tsx
// pages/Users/UsersPage.tsx
import { useUsers } from '../../hooks/useUsers';
import { UserCard } from '../../components/UserCard';
import { CreateUserForm } from '../../components/CreateUserForm';

export function UsersPage() {
  const { users, loading, error, addUser, removeUser } = useUsers();

  return (
    <div className="users-page">
      <h1>Usuarios</h1>
      <CreateUserForm onSubmit={addUser} />
      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}
      <ul>
        {users.map(user => (
          <UserCard key={user.id} user={user} onDelete={() => removeUser(user.id)} />
        ))}
      </ul>
    </div>
  );
}
```

## Framework adaptations

### Vue 3 (Composition API)

- `services/` → plain async functions (identical to React).
- `hooks/` → composables: `useUsers.ts` using `ref()`, `reactive()`, `watch()`.
- `pages/` → `<script setup>` that imports the composable.

```typescript
// hooks/useUsers.ts (Vue composable)
import { ref, onMounted } from 'vue';
import { getUsers } from '../services/usersService';

export function useUsers() {
  const users = ref<User[]>([]);
  const loading = ref(false);

  onMounted(async () => {
    loading.value = true;
    users.value = await getUsers();
    loading.value = false;
  });

  return { users, loading };
}
```

### Angular

- `services/` → `@Injectable()` with `HttpClient`.
- `hooks/` → don't exist; logic lives in the service itself or in a store (NgRx / Signals).
- `pages/` → `@Component()` with `ChangeDetectionStrategy.OnPush`.

In Angular the "hooks" layer is replaced by stateful Services or reactive stores.

## Anti-patterns to avoid

| ❌ Anti-pattern | ✅ Correction |
| --- | --- |
| `fetch()` directly in a Page component | Move it to a Service |
| State logic inside the Page | Extract to a Hook |
| A Hook importing another domain's Hook | Create an orchestrator Hook or unify services |
| A Service using `useState` | Services are pure functions, no hooks |
| A Page calling a Service directly | Page → Hook → Service, always |
| A 500-line file with everything mixed | Split into its three layers |

## Review checklist

When generating or reviewing code, verify:

- [ ] Services are pure functions with no hooks or state.
- [ ] Hooks only call Services, never `fetch` directly.
- [ ] Pages have no `useState` for business logic.
- [ ] Pages don't import Services directly.
- [ ] The hook returns a clean interface (data + actions).
- [ ] Errors and loading are handled in the Hook, not the Page.
- [ ] One file per responsibility (not everything in one file).

## Data flow

```
User interacts with the Page
  → Page calls a Hook action (e.g. addUser(data))
    → Hook calls a Service (e.g. createUser(data))
      → Service fetches the API
    ← Service returns the created User
  ← Hook updates state (setUsers)
← Page re-renders with the new state
```

## Further reading

For very large projects:

- Feature-Sliced Design — https://feature-sliced.design/
- Bulletproof React — https://github.com/alan2207/bulletproof-react
- Repository pattern applied to the frontend to further isolate Services.
