# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Copy conventions (client request): every page addresses the visitor as **usted**, and visible copy never uses dashes (— or –) as punctuation.

`telar` is the commercial marketing site for **Telar** (Bogotá, SAS BIC): eight branches ("ramas") grouped in four layers — **Acceso** (Telar Tag, Casa, Office), **Atención** (Web, AI), **Automatización** (Flow), **Datos** (Monitor, Teams) — plus the Plan Social (`/telar-para-todos`). It is a static Astro site whose single job is to get a visitor into a **WhatsApp** conversation. There is no backend, database, or form — contact is always a `wa.me` deep link. The base spec is `planeacion/telar-proyecto-web.md`; the v8 update `planeacion/modulos/v8.md` overrides it for routes, prices and content. Site rules (v8): everything is organised by branch, each piece of information appears on exactly one page, and every price comes from the Excel (`src/lib/precios.ts`).

Production domain is `https://telar.co`, set in `astro.config.mjs` (`site:`) and `public/robots.txt` — confirm ownership before publishing.

**Known TODOs before launch** (also flagged in-page): fill `[razón social]` / `[NIT]` placeholders in the footer and legal pages; no draft banners or bracketed placeholders are shown to visitors (client request), so the pending items live only here: add the razón social and NIT to `NEGOCIO`, the footer and the legal pages; have a lawyer review the five `/legal/*` pages (still `noindex` and excluded from the sitemap until approved) and the legal framework on `/telar-para-todos`; publish the Plan Social cupos and vigencia on `/telar-para-todos`; the "Así se usa" cases on each branch page are illustrative until there are real client cases with written authorisation; verify the Umami/Plausible analytics choice; the domótica page copy must never promise "security" (§11.6 of the spec).

## Commands

Node `>=22.12.0` is required. Package manager is npm (there is a `package-lock.json`).

- `npm run dev` — dev server at `localhost:4321`
- `npm run build` — build the production site to `./dist/`
- `npm run preview` — serve the production build locally
- `npm run astro check` — type-check (`@astrojs/check` + strict TS); this is the closest thing to a lint/test step
- `npm run astro add <integration>` — install and auto-register an integration in `astro.config.mjs`

There is no test runner or standalone linter configured. `prettier` (with the astro + tailwind plugins) is installed for formatting.

### Dev server (background mode)

Start the dev server in background mode and manage it with the wrapper commands:

```
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Architecture

- **Routing is file-based**: `.astro` / `.md` / `.mdx` files in `src/pages/` become routes by filename.
- **Static assets** live in `public/` and are served from the site root (`/`).
- **TypeScript is strict** (`tsconfig.json` extends `astro/tsconfigs/strict`); `jsx`/`jsxImportSource` are set to `preact` so `.tsx` islands type-check.

### Layouts

- `src/layouts/Base.astro` is the single HTML shell: imports the variable fonts + `global.css`, renders SEO/canonical/OG/Twitter + JSON-LD `LocalBusiness` from `titulo`/`descripcion`/`imagen`/`noindex` props, and mounts `Header`, `Footer`, the `Cursor` island, and the floating WhatsApp button. Every page renders inside it. Props are in **Spanish** (the whole codebase is Spanish — identifiers, CSS classes, content).
- `src/layouts/RamaLayout.astro` is the fixed 8-part structure of every branch page (hero → problema → niveles (default slot, `ui/NivelesRama.astro`: one card per level with a per-level WhatsApp link) → combo → casos → FAQ → suscripción link → Cotizar); the `extra` slot holds disclaimers (Casa, Office). `src/layouts/LegalLayout.astro` wraps `Base` (with `noindex`) + the "borrador" banner + a `.prosa` container for the `/legal/*` pages.

### Directory layout (layered — Pages → Hooks → lib services)

- `src/pages/` — routes only: composition + hydration directives. One file per branch (`telar-*.astro`); Telar Tag has one section per type (`#tarjetas`, `#restaurante`, `#merchandising`, `#rutinas`, `#empaques`). v7 routes are 301-redirected via `REDIRECCIONES` in `astro.config.mjs` (also written to `dist/_redirects` at build).
- `src/hooks/` — Preact state/effects (`useMediaQuery`, `usePrefiereMenosMovimiento`, `useCursorTelar`, `useRevelar`, `useAcordeon`, `useMenuMovil`). Animation hooks must consult `usePrefiereMenosMovimiento` before moving anything; high-frequency values (cursor position) live in `useRef`, never `useState`.
- `src/lib/` — pure data/logic, no Preact: `constantes.ts` (`NEGOCIO`), `precios.ts` (the price catalog: Excel value without IVA per level; `precioPublicado()` adds 19 % IVA except Telar Web and rounds up to the thousand; combos, suscripción and Plan Social figures — never hardcode a price in a page), `whatsapp.ts` (`linkWhatsApp()` + the `MENSAJES` map of per-context prefilled messages — every CTA uses one), `navegacion.ts` (`CAPAS` → header, footer and home; nav arrays).
- `src/components/` by role: `estaticos/` (zero-JS `.astro`: Header, Footer, Pasos, BotonWhatsApp, HiloScroll, PantallaCarga), `islas/` (`.tsx` Preact islands: Cursor, MenuMovil, FAQ), `marca/LogoTelar.astro`, `trama/TejidoHero.astro`, `ui/` (TablaPrecios with a `texto` prop for non-price tables, NivelesRama, ListaSiNo, Aviso).
- WhatsApp links always carry `target="_blank" rel="noopener noreferrer"` (tabnabbing).

### Design system (`src/styles/global.css`)

- Tailwind v4 is **CSS-first**: tokens live in `@theme { … }` — colours sampled from the logo (`--color-abismo/fondo/navy/borde/oro/oro-hondo/teal/teal-luz/lino/humo` → `bg-*`/`text-*`/`border-*` utilities) and fonts (`--fuente-display/cuerpo/mono`, used as CSS vars, not utilities). Motion tokens (`--ease-*`, `--dur-*`, `--stagger`) are in `:root`.
- Colour rule: **oro = action** (CTAs, prices, active node), **teal = connection** (threads, data). Never use teal for body text (fails contrast — §4.1). Shared helper classes (`.contenedor`, `.seccion`, `.btn-oro/linea/texto`, `.card`, `.tabla-precios`, `.eyebrow`, `.encabezado-seccion`, `.prosa`, reveal/cursor/FAQ/menu styles) live here so islands never inject `<style>` at runtime (required for the CSP hashing to hold).
- Icons: `import { Icon } from 'astro-icon/components'`; `<Icon name="lucide:..." />` inlines SVG at build.

### Performance & security conventions (configured in `astro.config.mjs` — preserve)

- **Custom cursor is the signature effect**: the `Cursor` island mounts with `client:media="(hover: hover) and (pointer: fine)"` so its JS **never downloads on touch/mobile**. Its CSS lives in `global.css` so `cursor: none` applies on first paint.
- **JS budget**: keep mobile JS under **30 KB gzip** (currently ~12 KB). Prefer `client:visible`/`client:idle`; every island must justify its bytes. No View Transitions/ClientRouter — `prefetch` (hover, `prefetchAll`) gives fast nav without the runtime.
- Animate only `transform`/`opacity`; everything respects `prefers-reduced-motion`. Scroll reveals use `[data-revelar]` + `src/scripts/revelar.js` (IntersectionObserver, once). Price tables use `ui/TablaPrecios.astro`, which collapses to cards under 640px via `data-label`.
- **CSP** is generated by Astro (`security.csp` in config) as a `<meta http-equiv>` with per-build hashes for its inline scripts/scoped styles; `style-src-attr 'unsafe-inline'` is the only relaxation (for the `style="--i:…"` stagger attributes). `public/_headers` carries HSTS/nosniff/frame/referrer/permissions.
- `sharp` backs `astro:assets` (use `<Image />`/`<Picture />`, not raw `<img>`). `scripts/generar-imagenes.mjs` regenerates `public/og-default.png` + `apple-touch-icon.png` from the logo — rerun it (`node scripts/generar-imagenes.mjs`) if the branding changes.

> Note: `AGENTS.md` still holds the original Astro boilerplate. Prefer keeping project guidance here in `CLAUDE.md`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
