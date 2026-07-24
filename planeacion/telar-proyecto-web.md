# TELAR — Sitio Web Comercial

> Documento maestro de desarrollo. Stack, contenido, seguridad, cumplimiento legal y condiciones comerciales.
> **Versión:** 7.0 — completo · **Contacto comercial:** WhatsApp +57 301 183 6458

---

## 1. Objetivo del proyecto

Sitio web **estático, promocional y de captación** para **Telar**. Su único trabajo es que un visitante entienda qué vendes en menos de 15 segundos y abra una conversación de WhatsApp.

### Las tres líneas de negocio

| Línea | Qué es | Ticket |
|---|---|---|
| **Telar Tag** | Productos NFC: tarjetas, menús, merchandising, packaging | $15.000 – $550.000 |
| **Telar Web** | Desarrollo web completo: frontend, backend, BD, pagos, CRUD | $700.000 – $12.000.000 |
| **Telar Casa** | Domótica remota con Home Assistant | $830.000 – $2.500.000 + mensual |

Las tres se conectan de verdad, y esa conexión es tu argumento de venta: un tag NFC en la pared puede disparar una escena de Home Assistant, y el panel que administra el negocio del cliente lo desarrollas tú. Nadie más en tu mercado ofrece las tres cosas con una sola persona responsable.

**No incluye** (por ahora): plataforma de landing pages NFC, panel de administración propio, base de datos, pasarela de pagos, ni login. Eso se maneja aparte.

**Métrica de éxito:** número de conversaciones de WhatsApp iniciadas desde el sitio, segmentadas por línea.

---

## 2. Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | **Astro 7** + TypeScript | Envía casi cero JavaScript. Genera HTML estático real con meta tags por ruta (crítico para las previsualizaciones de WhatsApp). |
| Estilos | **Tailwind CSS v4** | Vía `@tailwindcss/vite`. Configuración por CSS, sin `tailwind.config.js`. |
| Contenido | **Content Collections** de Astro | Blog y portafolio en Markdown con validación de esquema por Zod. Sin CMS externo. |
| Interactividad | **Preact islands** (`@astrojs/preact`) | Hooks reales (`useState`, `useEffect`, `useRef`) con ~4 KB en vez de los ~45 KB de React. API idéntica. Ver §3.1. |
| Iconos | **astro-icon** + Lucide | Se compilan en build, no cargan librería en cliente. |
| Imágenes | `astro:assets` (`<Image />` / `<Picture />`) | WebP/AVIF automático, `width`/`height` para evitar CLS. |
| Formularios | **Deep link a WhatsApp** | Sin backend. Sin almacenar datos. Menos superficie de ataque y muchísimo menos peso legal. |
| Deploy | **Cloudflare Pages** o **Vercel** | Ambos con plan gratuito suficiente, SSL automático, headers configurables. |
| Analítica | **Umami Cloud** o **Plausible** | Sin cookies, sin banner obligatorio, cumplen por diseño. Alternativa: GA4 (exige banner de consentimiento). |
| Control de versiones | Git + GitHub | Con 2FA obligatorio. |

### Dependencias exactas

```bash
npm create astro@latest -- --template minimal
cd tu-proyecto

npm install tailwindcss @tailwindcss/vite
npm install @astrojs/sitemap @astrojs/mdx
npm install @astrojs/preact preact
npm install astro-icon @iconify-json/lucide
npm install -D @astrojs/check typescript prettier prettier-plugin-astro
```

### `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://tudominio.com', // obligatorio para sitemap y canonical
  output: 'static',
  integrations: [preact({ compat: true }), sitemap(), mdx(), icon()],
  vite: { plugins: [tailwindcss()] },
  image: { domains: [] },
});
```

---

## 3. Arquitectura por capas

### 3.1 Islas: HTML estático por fuera, React por dentro

Astro no obliga a ser estático. Soporta **islas**: componentes que se hidratan en el navegador con estado, efectos y hooks reales, dentro de una página que sigue sirviéndose como HTML.

Esto resuelve las dos cosas a la vez:

| | Se conserva | Se gana |
|---|---|---|
| HTML estático | Meta tags por ruta → las previsualizaciones de WhatsApp funcionan. SEO real. Carga rápida. | |
| Islas con hooks | | Estado, animaciones controladas, cotizador, filtros, acordeones |

Solo se hidrata lo que necesita interactividad. El texto, las tablas de precios y el footer siguen siendo HTML puro: cero JavaScript.

#### La decisión: Preact o React

Definimos un techo de 30 KB de JS en móvil (§4.6). Los números:

| Opción | Peso (gzip) | Hooks |
|---|---|---|
| **Preact** | **~4 KB** | `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useReducer` — API idéntica |
| React + ReactDOM | ~45 KB | Iguales |

**Recomiendo Preact para el sitio de Telar.** La API de hooks es la misma —`import { useState } from 'preact/hooks'`— así que no cambia cómo escriben. Con React, solo el framework ya consume 1.5× el presupuesto completo de JS antes de escribir una línea propia.

Para los **proyectos de cliente** usen React normal: ahí hay ecosistema, librerías y equipos que lo esperan. El sitio propio es el caso donde cada kilobyte se paga en conversión, porque el visitante llega desde Instagram con datos móviles.

Si prefieren React por consistencia mental, es defendible — solo suban el techo a 60 KB conscientemente y usen `client:visible` en todo.

```bash
npm install @astrojs/preact preact
```

```js
// astro.config.mjs
import preact from '@astrojs/preact';
export default defineConfig({
  integrations: [preact({ compat: true }), sitemap(), mdx(), icon()],
  // compat: true permite usar librerías de React si hace falta
});
```

#### Directivas de hidratación

Cuál eligen cambia el rendimiento más que el código del componente:

| Directiva | Cuándo | Ejemplo |
|---|---|---|
| `client:load` | Interactivo y visible al entrar | `MenuMovil` |
| `client:visible` | **La opción por defecto.** Se hidrata al entrar en pantalla | `Cotizador`, `FAQ`, `FiltroPortafolio` |
| `client:idle` | No urgente | `TejidoHero` |
| `client:media` | **Solo si la pantalla cumple una condición** | `Cursor` |

`client:media` es la pieza clave para el cursor:

```astro
<Cursor client:media="(hover: hover) and (pointer: fine)" />
```

Con eso el cursor **nunca se descarga en móvil**. No es que se cargue y se desactive: el JavaScript no viaja. Es lo que permite tener un puntero elaborado sin castigar al visitante de celular.

### 3.2 Las tres capas

```
┌─────────────────────────────────┐
│           PAGES                 │  ← Rutas, composición, hidratación
├─────────────────────────────────┤
│           HOOKS                 │  ← Estado, efectos, animaciones
├─────────────────────────────────┤
│          SERVICES               │  ← Datos, cálculo, I/O
└─────────────────────────────────┘
```

**Regla de dependencia: Pages → Hooks → Services. Nunca al revés.**

Es el mismo estándar que usan en los proyectos de cliente. Que sea idéntico no es casualidad: en §6.3 le prometen al cliente que si uno no está disponible, el otro entra sin que se note. Esa promesa solo es sostenible si ambos escriben el código igual, en todos los proyectos, incluido el propio.

```
src/
├── pages/                    # Rutas. Solo composición + directivas de hidratación.
│   ├── index.astro
│   ├── nosotros.astro
│   ├── servicios/[...slug].astro
│   ├── para/[segmento].astro
│   ├── precios.astro
│   ├── portafolio/index.astro
│   ├── blog/[...slug].astro
│   ├── legal/{privacidad,terminos,cookies,datos-personales}.astro
│   ├── 404.astro
│   └── robots.txt.ts
│
├── layouts/
│   ├── Base.astro
│   └── Servicio.astro
│
├── hooks/                    # ← CAPA 2. Estado y efectos.
│   ├── useMediaQuery.ts
│   ├── usePrefiereMenosMovimiento.ts
│   ├── useCursorTelar.ts
│   ├── useTejido.ts
│   ├── useRevelar.ts
│   ├── useCotizador.ts
│   ├── useAcordeon.ts
│   ├── useMenuMovil.ts
│   └── useFiltroPortafolio.ts
│
├── services/                 # ← CAPA 3. Funciones puras, sin Preact.
│   ├── preciosService.ts
│   ├── whatsappService.ts
│   ├── cotizadorService.ts
│   └── contenidoService.ts
│
├── components/
│   ├── islas/                # .tsx — se hidratan, usan hooks
│   │   ├── Cursor.tsx
│   │   ├── Cotizador.tsx
│   │   ├── FAQ.tsx
│   │   ├── MenuMovil.tsx
│   │   ├── FiltroPortafolio.tsx
│   │   └── TejidoHero.tsx
│   ├── estaticos/            # .astro — cero JS
│   │   ├── TablaPrecios.astro
│   │   ├── CardSegmento.astro
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── marca/LogoTelar.astro
│   └── seo/MetaTags.astro
│
├── content/                  # Datos en Markdown, validados por Zod
│   ├── config.ts
│   ├── servicios/ · equipo/ · portafolio/ · blog/
│
├── types/index.ts
└── styles/global.css
```

**La separación `islas/` vs `estaticos/` es la decisión de arquitectura más importante del proyecto.** Cada archivo en `islas/` cuesta JavaScript en el celular de un cliente. Antes de crear uno, la pregunta es: *¿esto necesita estado, o solo parece que sí?* Una tabla de precios no lo necesita. Un acordeón de FAQ, discutible —se puede hacer con `<details>` sin una línea de JS—. Un cotizador, sí.

**Anti-patrones:**

| ❌ | ✅ |
|---|---|
| `fetch()` dentro de un componente | Moverlo a `services/` |
| `useState` en una Page `.astro` | Extraer a un hook dentro de una isla |
| Una isla que importa un Service directamente | Isla → Hook → Service |
| Formatear precios en el JSX | `formatearPrecio()` en `preciosService.ts` |
| Un hook que hace `fetch` | El hook llama al Service |
| Hidratar un componente que solo muestra texto | Que sea `.astro` |
| `client:load` por costumbre | `client:visible` salvo que esté sobre el pliegue |

### 3.3 Catálogo de hooks

#### Base

```ts
// hooks/useMediaQuery.ts
import { useState, useEffect } from 'preact/hooks';

export function useMediaQuery(consulta: string): boolean {
  const [coincide, setCoincide] = useState(false);

  useEffect(() => {
    const mq = matchMedia(consulta);
    setCoincide(mq.matches);
    const alCambiar = (e: MediaQueryListEvent) => setCoincide(e.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, [consulta]);

  return coincide;
}
```

```ts
// hooks/usePrefiereMenosMovimiento.ts
import { useMediaQuery } from './useMediaQuery';

/** Todo hook de animación debe consultarlo antes de mover algo. */
export function usePrefiereMenosMovimiento(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
```

#### Animación

```ts
// hooks/useTejido.ts
import { useState, useEffect, useRef } from 'preact/hooks';
import { usePrefiereMenosMovimiento } from './usePrefiereMenosMovimiento';

type Fase = 'inicio' | 'hilos' | 'nodos' | 'completo';

/** Orquesta el tejido del hero. La Page solo lee la fase y pinta clases. */
export function useTejido(duracionHilos = 1600, duracionNodos = 420) {
  const menos = usePrefiereMenosMovimiento();
  const [fase, setFase] = useState<Fase>('inicio');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (menos) {
      setFase('completo');   // aparece todo, quieto
      return;
    }

    setFase('hilos');
    timers.current.push(
      window.setTimeout(() => setFase('nodos'), duracionHilos * 0.62),
      window.setTimeout(() => setFase('completo'), duracionHilos + duracionNodos)
    );

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [menos, duracionHilos, duracionNodos]);

  return {
    fase,
    tejiendo: fase === 'hilos' || fase === 'nodos',
    listo: fase === 'completo',
  };
}
```

```ts
// hooks/useRevelar.ts
import { useEffect, useRef, useState } from 'preact/hooks';

export function useRevelar<T extends Element>(umbral = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setVisible(true);
        io.disconnect();          // una sola vez
      },
      { threshold: umbral, rootMargin: '0px 0px -8% 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [umbral]);

  return { ref, visible };
}
```

```ts
// hooks/useCursorTelar.ts
import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * El puntero. La interpolación va por ref, no por estado:
 * meter la posición en useState dispararía 60 renders por segundo.
 */
export function useCursorTelar(retardo = 0.16) {
  const nucleo = useRef<HTMLDivElement>(null);
  const anillo = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(false);
  const [presionado, setPresionado] = useState(false);
  const [visible, setVisible] = useState(false);

  const pos = useRef({ mx: 0, my: 0, ax: 0, ay: 0 });
  const raf = useRef<number>();

  useEffect(() => {
    const SELECTOR = 'a, button, [role="button"], summary, [data-interactivo]';

    const alMover = (e: MouseEvent) => {
      const p = pos.current;
      p.mx = e.clientX;
      p.my = e.clientY;
      if (!visible) {
        p.ax = p.mx;
        p.ay = p.my;
        setVisible(true);
      }
    };

    const alEntrarEn = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(SELECTOR)) setActivo(true);
    };
    const alSalirDe = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(SELECTOR)) setActivo(false);
    };

    const bucle = () => {
      const p = pos.current;
      p.ax += (p.mx - p.ax) * retardo;
      p.ay += (p.my - p.ay) * retardo;
      if (nucleo.current)
        nucleo.current.style.transform = `translate3d(${p.mx}px, ${p.my}px, 0)`;
      if (anillo.current)
        anillo.current.style.transform = `translate3d(${p.ax}px, ${p.ay}px, 0)`;
      raf.current = requestAnimationFrame(bucle);
    };
    raf.current = requestAnimationFrame(bucle);

    addEventListener('mousemove', alMover, { passive: true });
    document.addEventListener('mouseover', alEntrarEn);
    document.addEventListener('mouseout', alSalirDe);
    const abajo = () => setPresionado(true);
    const arriba = () => setPresionado(false);
    const fuera = () => setVisible(false);
    addEventListener('mousedown', abajo);
    addEventListener('mouseup', arriba);
    document.addEventListener('mouseleave', fuera);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      removeEventListener('mousemove', alMover);
      document.removeEventListener('mouseover', alEntrarEn);
      document.removeEventListener('mouseout', alSalirDe);
      removeEventListener('mousedown', abajo);
      removeEventListener('mouseup', arriba);
      document.removeEventListener('mouseleave', fuera);
    };
  }, [retardo, visible]);

  return { nucleo, anillo, activo, presionado, visible };
}
```

**La lección del cursor:** la posición vive en un `useRef`, no en `useState`. Guardarla en estado dispararía un render por fotograma —60 por segundo— y el sitio se arrastraría. El estado se reserva para lo que cambia poco: `activo`, `presionado`, `visible`.

#### Interfaz

```ts
// hooks/useAcordeon.ts
import { useState, useCallback } from 'preact/hooks';

export function useAcordeon(permitirVarios = false) {
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  const alternar = useCallback((id: string) => {
    setAbiertos((prev) => {
      const s = new Set(permitirVarios ? prev : []);
      prev.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, [permitirVarios]);

  return { abiertos, alternar, estaAbierto: (id: string) => abiertos.has(id) };
}
```

```ts
// hooks/useMenuMovil.ts
import { useState, useEffect, useCallback } from 'preact/hooks';

export function useMenuMovil() {
  const [abierto, setAbierto] = useState(false);

  const cerrar = useCallback(() => setAbierto(false), []);
  const alternar = useCallback(() => setAbierto((v) => !v), []);

  // Bloquear el scroll del fondo y cerrar con Escape
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar(); };
    addEventListener('keydown', alTeclear);

    return () => {
      document.body.style.overflow = previo;
      removeEventListener('keydown', alTeclear);
    };
  }, [abierto, cerrar]);

  return { abierto, alternar, cerrar };
}
```

#### El cotizador — donde los hooks se ganan el sueldo

Este es el caso que justifica toda la capa: estado real, cálculo derivado y una acción que sale al mundo.

```ts
// services/cotizadorService.ts — SIN Preact. Función pura.
import type { ItemCotizacion } from '../types';
import { CATALOGO } from './preciosService';

export function calcularTotal(items: ItemCotizacion[]): number {
  return items.reduce((suma, i) => {
    const p = CATALOGO.find((c) => c.id === i.id);
    return suma + (p ? p.precio * i.cantidad : 0);
  }, 0);
}

export function formatearPrecio(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);
}

export function construirMensaje(items: ItemCotizacion[], total: number): string {
  const lineas = items.map((i) => {
    const p = CATALOGO.find((c) => c.id === i.id);
    return `• ${p?.nombre} × ${i.cantidad}`;
  });
  return [
    'Hola Telar, quiero cotizar:',
    ...lineas,
    ``,
    `Total aproximado: ${formatearPrecio(total)}`,
  ].join('\n');
}
```

```ts
// hooks/useCotizador.ts
import { useState, useMemo, useCallback } from 'preact/hooks';
import { calcularTotal, construirMensaje, formatearPrecio } from '../services/cotizadorService';
import { enlaceWhatsApp } from '../services/whatsappService';
import type { ItemCotizacion } from '../types';

export function useCotizador() {
  const [items, setItems] = useState<ItemCotizacion[]>([]);

  const agregar = useCallback((id: string, cantidad = 1) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.id === id);
      return existe
        ? prev.map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + cantidad } : i))
        : [...prev, { id, cantidad }];
    });
  }, []);

  const cambiarCantidad = useCallback((id: string, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, cantidad } : i))
    );
  }, []);

  const limpiar = useCallback(() => setItems([]), []);

  const total = useMemo(() => calcularTotal(items), [items]);
  const totalFormateado = useMemo(() => formatearPrecio(total), [total]);
  const enlace = useMemo(
    () => enlaceWhatsApp(construirMensaje(items, total)),
    [items, total]
  );

  return {
    items,
    total,
    totalFormateado,
    enlace,
    vacio: items.length === 0,
    agregar,
    cambiarCantidad,
    limpiar,
  };
}
```

```tsx
// components/islas/Cotizador.tsx — solo JSX. Sin cálculo, sin fetch.
import { useCotizador } from '../../hooks/useCotizador';
import { CATALOGO } from '../../services/preciosService';

export default function Cotizador() {
  const { items, totalFormateado, enlace, vacio, agregar, cambiarCantidad, limpiar } =
    useCotizador();

  return (
    <div class="cotizador">
      <ul class="catalogo">
        {CATALOGO.map((p) => (
          <li key={p.id}>
            <span>{p.nombre}</span>
            <button onClick={() => agregar(p.id)} aria-label={`Agregar ${p.nombre}`}>
              Agregar
            </button>
          </li>
        ))}
      </ul>

      {vacio ? (
        <p class="vacio">Escoge lo que te interesa y armamos la cotización.</p>
      ) : (
        <>
          <ul class="seleccion">
            {items.map((i) => (
              <li key={i.id}>
                <span>{CATALOGO.find((c) => c.id === i.id)?.nombre}</span>
                <input
                  type="number"
                  min="0"
                  value={i.cantidad}
                  onInput={(e) =>
                    cambiarCantidad(i.id, Number((e.target as HTMLInputElement).value))
                  }
                  aria-label="Cantidad"
                />
              </li>
            ))}
          </ul>

          <p class="total" aria-live="polite">
            Total aproximado: <strong>{totalFormateado}</strong>
          </p>
          <p class="nota">Precios sin IVA. No somos responsables de IVA.</p>

          <a href={enlace} target="_blank" rel="noopener noreferrer" class="btn-oro">
            Enviar por WhatsApp
          </a>
          <button onClick={limpiar} class="btn-texto">Empezar de nuevo</button>
        </>
      )}
    </div>
  );
}
```

Fíjense en el reparto: el componente **no calcula nada**. No sabe formatear moneda ni construir el mensaje de WhatsApp. Solo pinta y despacha eventos al hook. Ese es el estándar en todos los archivos de `islas/`.

`aria-live="polite"` en el total no es decorativo: sin él, un lector de pantalla no anuncia que el precio cambió.

### 3.4 Proyectos de cliente

Mismo estándar, con React en vez de Preact, organizado por feature cuando el proyecto crece:

```
src/features/pedidos/
├── pages/PedidosPage.tsx
├── hooks/usePedidos.ts
├── services/pedidosService.ts
└── types.ts
```

**Extensión al backend**, que ustedes también venden:

```
Controller → Service → Repository → BD
```

Mismo principio: el Controller no toca la base de datos, el Repository no conoce HTTP. Si venden paneles a $3.500.000, esta separación es lo que hace que el mantenimiento anual sea rentable en vez de doloroso.

**Checklist de revisión cruzada** — úsenlo en la revisión mensual de §6.4:

- [ ] ¿Los Services son puros, sin hooks ni estado?
- [ ] ¿Los Hooks llaman Services, no `fetch`?
- [ ] ¿Los componentes están libres de lógica de negocio?
- [ ] ¿Ningún componente importa un Service directamente?
- [ ] ¿El hook devuelve una interfaz limpia: datos + acciones?
- [ ] ¿Las animaciones de alta frecuencia usan `useRef`, no `useState`?
- [ ] ¿Cada isla justifica su JavaScript?
- [ ] **¿Podría el otro tomar este proyecto mañana sin preguntar nada?**

La última es la que importa. Si la respuesta es no, la arquitectura no está cumpliendo su función.

---

## 4. Dirección de diseño

El logo ya resolvió la identidad: un telar circular donde los hilos cruzan y los nodos se encienden. Toda la interfaz es una extensión de esa imagen. Los colores salen del archivo del logo, muestreados pixel a pixel — no aproximados a ojo.

### 4.1 Paleta

```css
@theme {
  /* Base — navy del logo, oscurecido para dar profundidad */
  --color-abismo:    #0C1826;  /* fondo de página */
  --color-fondo:     #152538;  /* superficies, cards */
  --color-navy:      #1B2F47;  /* EXACTO del logo: texto y barras */
  --color-borde:     #24405E;  /* bordes, separadores */

  /* Acento primario — oro del logo */
  --color-oro:       #E1B366;  /* EXACTO del logo (nodo iluminado) */
  --color-oro-hondo: #CA9D5A;  /* EXACTO del logo (nodo en sombra) */

  /* Acento secundario — teal del logo */
  --color-teal:      #42818F;  /* EXACTO del logo (nodos y trama) */
  --color-teal-luz:  #6FB3C0;  /* derivado, para texto teal legible */

  /* Texto */
  --color-lino:      #E8EDF3;  /* texto principal */
  --color-humo:      #8FA3BC;  /* texto secundario */
}
```

**Contrastes verificados** (WCAG, calculados — no estimados):

| Combinación | Ratio | Uso permitido |
|---|---|---|
| Lino sobre abismo | 15.19:1 | Todo |
| Oro sobre abismo | 9.23:1 | Todo |
| Abismo sobre oro (botón) | 9.23:1 | Todo |
| Humo sobre abismo | 6.93:1 | Todo |
| Teal claro sobre abismo | 7.57:1 | Todo |
| **Teal sobre abismo** | **4.06:1** | **Solo texto grande, líneas y gráficos — nunca cuerpo de texto** |

Regla de reparto: el **oro es acción** (CTAs, precios, el nodo activo). El **teal es conexión** (hilos, líneas, estados de datos). Nunca uses oro para algo que no se pueda tocar.

### 4.2 Tipografía

| Rol | Fuente | Uso |
|---|---|---|
| Display | **Bricolage Grotesque** (variable) | Titulares. Ancho y peso variables. |
| Cuerpo | **Instrument Sans** | Texto corrido. |
| Utilidad | **JetBrains Mono** | Precios, datos, etiquetas. Siempre con `font-variant-numeric: tabular-nums` para que los números no bailen al animarse. |

Auto-hospedadas con `@fontsource-variable/`, **no** desde el CDN de Google (ver §11.2).

### 4.3 Sistema de movimiento

Lo futurista no es "muchas animaciones". Es **precisión**: tiempos cortos, curvas decididas, todo se mueve como si fuera mecánico. Un telar real es una máquina exacta.

```css
:root {
  /* Curvas */
  --ease-salida:    cubic-bezier(0.16, 1, 0.30, 1);    /* entradas: rápido y frena */
  --ease-precision: cubic-bezier(0.65, 0, 0.35, 1);    /* movimientos mecánicos */
  --ease-nodo:      cubic-bezier(0.34, 1.56, 0.64, 1); /* nodos: rebote mínimo */

  /* Duraciones */
  --dur-instante: 120ms;   /* hover, foco */
  --dur-rapido:   240ms;   /* transiciones de estado */
  --dur-medio:    420ms;   /* revelados */
  --dur-lento:    800ms;   /* secuencias */
  --dur-trama:   1600ms;   /* el tejido del hero, una sola vez */

  /* Escalonado */
  --stagger: 70ms;
}
```

**Regla de una sola secuencia:** solo una animación orquestada por pantalla. Si tres cosas compiten por atención, ninguna se lee.

### 4.4 Especificación de animaciones

Cada animación del sitio está aquí. Si algo se mueve y no aparece en esta tabla, sobra.

| # | Nombre | Dónde | Disparador | Duración | Propiedades | Archivo |
|---|---|---|---|---|---|---|
| 1 | `tejer` | Hero de todas las páginas | Carga, una vez | 1600 ms | `stroke-dashoffset` | `TejidoHero.astro` |
| 2 | `encender` | Nodos del hero y del logo | Tras el tejido | 420 ms | `opacity`, `transform` | `TejidoHero.astro` |
| 3 | `escaneo` | Cards de servicio y precio | `:hover` / `:focus-within` | 800 ms | `transform` | `global.css` |
| 4 | `revelado` | Bloques de contenido | Scroll, una vez | 420 ms | `opacity`, `transform` | `global.css` + `revelar.js` |
| 5 | `cursor` | Toda la página, solo escritorio | `mousemove` | continuo (rAF) | `transform` | `cursor.js` |
| 6 | `nodo-logo` | Logo del header | `:hover` | 240 ms | `r` | `LogoTelar.astro` |
| 7 | `pulso-nfc` | Solo páginas de Telar Tag | Scroll, en bucle lento | 2400 ms | `transform`, `opacity` | `PulsoNFC.astro` |

**Reglas que aplican a las siete:**

- Solo se animan `transform` y `opacity`. Excepciones documentadas: `stroke-dashoffset` (compositado en GPU, seguro) y `r` en el logo (elementos diminutos, sin impacto).
- Una sola secuencia orquestada por pantalla.
- Todas respetan `prefers-reduced-motion`.
- Ninguna retrasa la lectura del texto.

### 4.5 El puntero: un nodo del telar

**Es el elemento firma.** El cursor deja de ser una flecha y se convierte en un nodo de la trama.

| Capa | Comportamiento |
|---|---|
| **Núcleo** | Punto de oro de 6px. Sigue el mouse sin retardo. |
| **Anillo** | Círculo de 34px con borde teal. Persigue al núcleo con interpolación (`lerp` a 0.16). Ese desfase da la sensación de máquina. |
| **Estado activo** | Sobre algo interactivo, el anillo crece a 52px, se pone dorado y se tiñe al 8%. |
| **Estado presionado** | Al hacer clic, colapsa a 24px. |

El componente vive en `components/islas/Cursor.tsx` y consume `useCursorTelar` (§3.3). Se monta una sola vez en el Layout base:

```astro
<Cursor client:media="(hover: hover) and (pointer: fine)" />
```

Esa directiva es lo que hace viable el efecto: el bundle del cursor nunca viaja a un celular.

```tsx
// components/islas/Cursor.tsx
import { useCursorTelar } from '../../hooks/useCursorTelar';

export default function Cursor() {
  const { nucleo, anillo, activo, presionado, visible } = useCursorTelar();

  const clases = [
    'cursor-anillo',
    activo && 'activo',
    presionado && 'presionado',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div ref={anillo} class={clases} style={{ opacity: visible ? 1 : 0 }} aria-hidden="true" />
      <div ref={nucleo} class="cursor-nucleo" style={{ opacity: visible ? 1 : 0 }} aria-hidden="true" />
    </>
  );
}
```

**Los estilos siguen en CSS global** (`global.css`), no en el componente: así el `cursor: none` aplica desde el primer pintado y no hay un parpadeo con la flecha del sistema mientras la isla se hidrata.

**CSS asociado:**

```astro
---
// Se monta una sola vez, en el Layout base. No recibe props.
---

<div class="cursor-anillo" aria-hidden="true"></div>
<div class="cursor-nucleo" aria-hidden="true"></div>

<style is:global>
  @media (hover: hover) and (pointer: fine) {
    body, a, button, [role='button'], summary, [data-interactivo] { cursor: none; }
    /* El cursor de texto SÍ se conserva: escribir sin barra es hostil */
    input, textarea, select, [contenteditable] { cursor: auto; }

    .cursor-nucleo, .cursor-anillo {
      position: fixed; top: 0; left: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      will-change: transform;
    }

    .cursor-nucleo {
      width: 6px; height: 6px; margin: -3px 0 0 -3px;
      background: var(--color-oro);
      border-radius: 50%;
      box-shadow: 0 0 10px color-mix(in srgb, var(--color-oro) 60%, transparent);
    }

    .cursor-anillo {
      width: 34px; height: 34px; margin: -17px 0 0 -17px;
      border: 1px solid color-mix(in srgb, var(--color-teal-luz) 65%, transparent);
      border-radius: 50%;
      transition:
        width var(--dur-rapido) var(--ease-nodo),
        height var(--dur-rapido) var(--ease-nodo),
        margin var(--dur-rapido) var(--ease-nodo),
        border-color var(--dur-rapido) var(--ease-precision),
        background-color var(--dur-rapido) var(--ease-precision);
    }

    .cursor-anillo.activo {
      width: 52px; height: 52px; margin: -26px 0 0 -26px;
      border-color: var(--color-oro);
      background: color-mix(in srgb, var(--color-oro) 8%, transparent);
    }

    .cursor-anillo.presionado {
      width: 24px; height: 24px; margin: -12px 0 0 -12px;
    }
  }

  /* Sin excepciones: se devuelve el cursor nativo, no se atenúa */
  @media (prefers-reduced-motion: reduce) {
    body, a, button, [role='button'], summary { cursor: auto; }
    .cursor-nucleo, .cursor-anillo { display: none; }
  }
</style>

<script>
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const menos = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (fino && !menos) {
    const nucleo = document.querySelector('.cursor-nucleo');
    const anillo = document.querySelector('.cursor-anillo');
    const SELECTOR = 'a, button, [role="button"], summary, [data-interactivo]';

    let mx = innerWidth / 2, my = innerHeight / 2;
    let ax = mx, ay = my;
    let visible = false;

    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) {
        ax = mx; ay = my;
        nucleo.style.opacity = anillo.style.opacity = '1';
        visible = true;
      }
    }, { passive: true });

    const bucle = () => {
      ax += (mx - ax) * 0.16;   // menor valor = más retardo
      ay += (my - ay) * 0.16;
      nucleo.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      anillo.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
      requestAnimationFrame(bucle);
    };
    requestAnimationFrame(bucle);

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(SELECTOR)) anillo.classList.add('activo');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(SELECTOR)) anillo.classList.remove('activo');
    });
    addEventListener('mousedown', () => anillo.classList.add('presionado'));
    addEventListener('mouseup', () => anillo.classList.remove('presionado'));

    // No dejar el cursor colgado al salir de la ventana
    document.addEventListener('mouseleave', () => {
      nucleo.style.opacity = anillo.style.opacity = '0';
      visible = false;
    });
  }
</script>
```

**Ocho reglas obligatorias:**

- [ ] Solo con `(hover: hover) and (pointer: fine)`. En táctil el script no corre.
- [ ] `prefers-reduced-motion` **devuelve** el cursor nativo, no lo atenúa.
- [ ] Los campos de texto conservan su cursor.
- [ ] Solo `transform`. Nunca `left`/`top`.
- [ ] Un solo `requestAnimationFrame` para las dos capas.
- [ ] `pointer-events: none` en ambas capas, o el cursor bloquea los clics.
- [ ] `:focus-visible` sigue intacto. Son dos usuarios distintos.
- [ ] Si el JS falla, queda el cursor del sistema y el sitio funciona.

### 4.6 El presupuesto de rendimiento

El tráfico llega desde Instagram, en gama media, con datos móviles. Lo futurista pesa.

**La resolución tiene dos partes.**

Primero, `client:media` en el cursor: en móvil ese JavaScript **no se descarga**, no es que se cargue y se desactive. El barrido de escaneo es `hover`, que en táctil no ocurre.

Segundo, la disciplina de `islas/` vs `estaticos/` (§3.2). Un componente en `islas/` cuesta JS en el celular de un cliente; uno en `estaticos/` no cuesta nada. Antes de crear una isla, la pregunta es si de verdad necesita estado o solo lo parece.

**Verifiquen el costo real** con `npx astro build && npx astro preview`, revisando el peso de los bundles en la pestaña Network con throttling de 4G.

| Métrica | Techo |
|---|---|
| JavaScript total en móvil | < 30 KB comprimido (Preact ~4 KB + islas) |
| Islas hidratadas por página | Máximo 3 |
| Secuencias orquestadas | 1 por pantalla |
| Propiedades animadas | `transform` y `opacity` |
| LCP en móvil (4G) | < 2.5 s |
| CLS | < 0.1 — reserva altura para todo lo que anime |
| Texto del hero | Legible en el primer fotograma |

Una animación que retrasa tu mensaje es un error de negocio, no de diseño.

### 4.7 Marca: geometría y archivos

El SVG generado por IA es un **autotrazado del PNG**: 6 paths negros fusionados, sin color y sin elementos separados. No sirve para animar ni para imprimir. El logo se redibujó como vector geométrico midiendo el PNG original.

**Geometría normalizada** (viewBox `0 0 260 260`, centro `130,130`, radio `104`):

| Elemento | Valor |
|---|---|
| Aro | `r=104`, `stroke-width=7` |
| Urdimbre | **3** barras verticales en `x=104, 130, 156`, de `y=44` a `216` |
| Trama | 1 barra horizontal en `y=130`, de `x=46` a `214` |
| Nodos | 5 sobre el aro, `r=13` |
| Ángulos de los nodos | **−147° · −45° · 0° · 43° · 139°** |
| Hilos | 6 entre nodos: 4 teal, 2 oro, `stroke-width=2.2` |

**Los cinco ángulos son la firma de la marca.** Cualquier composición nueva —el hero, un patrón de fondo, la animación de una card— se deriva de ellos. No inventes posiciones nuevas.

**La estructura usa `currentColor`.** El navy `#1B2F47` desaparece sobre el fondo oscuro del sitio:

| Contexto | `color` |
|---|---|
| Fondo oscuro (el sitio) | `var(--color-lino)` |
| Fondo claro (facturas, documentos) | `var(--color-navy)` |
| Monotinta (grabado PVC, sellos, favicon) | `currentColor` |

Los nodos y los hilos **siempre** conservan oro y teal, salvo en monotinta.

#### `public/logo-telar.svg`

Para favicon, redes y cualquier uso fuera de Astro.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" role="img" aria-labelledby="t">
  <title id="t">Telar</title>
  <g fill="none" stroke-linecap="round" color="#1B2F47">
    <g stroke-width="2.2" opacity="0.9">
      <line x1="42.8" y1="73.4" x2="203.5" y2="56.5" stroke="#42818F"/>
      <line x1="42.8" y1="73.4" x2="206.1" y2="200.9" stroke="#42818F"/>
      <line x1="51.5" y1="198.2" x2="234" y2="130" stroke="#42818F"/>
      <line x1="234" y1="130" x2="206.1" y2="200.9" stroke="#42818F"/>
      <line x1="51.5" y1="198.2" x2="203.5" y2="56.5" stroke="#E1B366"/>
      <line x1="203.5" y1="56.5" x2="206.1" y2="200.9" stroke="#E1B366"/>
    </g>
    <g stroke="currentColor" stroke-width="7">
      <line x1="104" y1="44" x2="104" y2="216"/>
      <line x1="130" y1="44" x2="130" y2="216"/>
      <line x1="156" y1="44" x2="156" y2="216"/>
      <line x1="46" y1="130" x2="214" y2="130"/>
    </g>
    <circle cx="130" cy="130" r="104" stroke="currentColor" stroke-width="7"/>
    <g stroke="currentColor" stroke-width="4">
      <circle cx="42.8" cy="73.4" r="13" fill="#42818F"/>
      <circle cx="203.5" cy="56.5" r="13" fill="#E1B366"/>
      <circle cx="234" cy="130" r="13" fill="#42818F"/>
      <circle cx="206.1" cy="200.9" r="13" fill="#42818F"/>
      <circle cx="51.5" cy="198.2" r="13" fill="#E1B366"/>
    </g>
  </g>
</svg>
```

**Para el favicon a 32px, no uses este archivo.** Las tres barras y los cinco nodos se convierten en manchas. Necesitas una versión simplificada: el aro, una sola barra vertical y tres nodos.

#### `src/components/marca/LogoTelar.astro`

```astro
---
interface Props {
  tamano?: number;
  variante?: 'oscuro' | 'claro' | 'mono';
  wordmark?: boolean;
  decorativo?: boolean;
  class?: string;
}

const {
  tamano = 40,
  variante = 'oscuro',
  wordmark = true,
  decorativo = false,
  class: clase = '',
} = Astro.props;

const estructura = {
  oscuro: 'var(--color-lino)',
  claro: 'var(--color-navy)',
  mono: 'currentColor',
}[variante];

const mono = variante === 'mono';
const oro = mono ? 'currentColor' : 'var(--color-oro)';
const teal = mono ? 'currentColor' : 'var(--color-teal)';
---

<a
  href="/"
  class={`logo ${clase}`}
  aria-label={decorativo ? undefined : 'Telar — inicio'}
  style={`--logo-alto:${tamano}px; --logo-color:${estructura};`}
>
  <svg
    viewBox="0 0 260 260"
    class="logo-emblema"
    role={decorativo ? 'presentation' : 'img'}
    aria-hidden={decorativo ? 'true' : undefined}
    focusable="false"
  >
    <g fill="none" stroke-linecap="round">
      <g class="hilos" stroke-width="2.2" opacity="0.9">
        <line x1="42.8" y1="73.4" x2="203.5" y2="56.5" stroke={teal} />
        <line x1="42.8" y1="73.4" x2="206.1" y2="200.9" stroke={teal} />
        <line x1="51.5" y1="198.2" x2="234" y2="130" stroke={teal} />
        <line x1="234" y1="130" x2="206.1" y2="200.9" stroke={teal} />
        <line x1="51.5" y1="198.2" x2="203.5" y2="56.5" stroke={oro} />
        <line x1="203.5" y1="56.5" x2="206.1" y2="200.9" stroke={oro} />
      </g>

      <g class="urdimbre" stroke="currentColor" stroke-width="7">
        <line x1="104" y1="44" x2="104" y2="216" />
        <line x1="130" y1="44" x2="130" y2="216" />
        <line x1="156" y1="44" x2="156" y2="216" />
        <line x1="46" y1="130" x2="214" y2="130" />
      </g>

      <circle cx="130" cy="130" r="104" stroke="currentColor" stroke-width="7" />

      <g class="nodos" stroke="currentColor" stroke-width="4">
        <circle cx="42.8" cy="73.4" r="13" fill={teal} />
        <circle cx="203.5" cy="56.5" r="13" fill={oro} />
        <circle cx="234" cy="130" r="13" fill={teal} />
        <circle cx="206.1" cy="200.9" r="13" fill={teal} />
        <circle cx="51.5" cy="198.2" r="13" fill={oro} />
      </g>
    </g>
  </svg>

  {wordmark && <span class="logo-texto">Telar</span>}
</a>

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--logo-alto) * 0.28);
    color: var(--logo-color);
    text-decoration: none;
  }

  .logo-emblema {
    width: var(--logo-alto);
    height: var(--logo-alto);
    display: block;
    flex-shrink: 0;
    overflow: visible;
  }

  .logo-texto {
    font-family: var(--fuente-display);
    font-size: calc(var(--logo-alto) * 0.62);
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    line-height: 1;
  }

  .logo .nodos circle { transition: r var(--dur-rapido) var(--ease-nodo); }
  .logo:hover .nodos circle { r: 15; }

  .logo:focus-visible {
    outline: 2px solid var(--color-oro);
    outline-offset: 6px;
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    .logo .nodos circle { transition: none; }
    .logo:hover .nodos circle { r: 13; }
  }
</style>
```

**Uso:**

```astro
<LogoTelar tamano={36} />                          <!-- header -->
<LogoTelar tamano={28} variante="mono" wordmark={false} />  <!-- footer -->
<LogoTelar tamano={64} variante="claro" />         <!-- documentos -->
```

#### `src/components/trama/TejidoHero.astro`

Los nodos conservan los cinco ángulos del logo, reescalados al lienzo del hero. **Cada hilo lleva su longitud exacta en `--largo`**: si el valor es mayor que la línea, la animación arranca tarde; si es menor, el trazo se ve cortado. El componente la calcula con `Math.hypot` en tiempo de build.

```astro
---
interface Props {
  titulo: string;
  subtitulo?: string;
  class?: string;
}
const { titulo, subtitulo, class: clase = '' } = Astro.props;

const N = {
  L:  { x: 246,  y: 148 },
  TR: { x: 954,  y: 114 },
  R:  { x: 1088, y: 260 },
  BR: { x: 966,  y: 400 },
  BL: { x: 264,  y: 396 },
};

const hilos = [
  { a: 'L',  b: 'TR', color: 'teal' },
  { a: 'L',  b: 'BR', color: 'teal' },
  { a: 'BL', b: 'R',  color: 'teal' },
  { a: 'R',  b: 'BR', color: 'teal' },
  { a: 'BL', b: 'TR', color: 'oro'  },
  { a: 'TR', b: 'BR', color: 'oro'  },
].map((h, i) => {
  const p = N[h.a as keyof typeof N];
  const q = N[h.b as keyof typeof N];
  return {
    ...h, x1: p.x, y1: p.y, x2: q.x, y2: q.y,
    largo: Math.round(Math.hypot(q.x - p.x, q.y - p.y)),
    i,
  };
});

const nodos = [
  { ...N.L,  color: 'teal', i: 0 },
  { ...N.TR, color: 'oro',  i: 1 },
  { ...N.R,  color: 'teal', i: 2 },
  { ...N.BR, color: 'teal', i: 3 },
  { ...N.BL, color: 'oro',  i: 4 },
];

const barras = [430, 600, 770];
---

<section class={`hero ${clase}`}>
  <svg class="trama" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <g fill="none" stroke-linecap="round">
      <g class="urdimbre" stroke="var(--color-borde)" stroke-width="2">
        {barras.map((x, i) => (
          <line class="hebra" x1={x} y1={70} x2={x} y2={450} style={`--largo:380; --i:${i}`} />
        ))}
        <line class="hebra" x1={120} y1={260} x2={1080} y2={260} style="--largo:960; --i:3" />
      </g>

      <g class="hilos">
        {hilos.map((h) => (
          <line
            class="hebra"
            x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2}
            stroke={h.color === 'oro' ? 'var(--color-oro)' : 'var(--color-teal)'}
            stroke-width="1.6"
            style={`--largo:${h.largo}; --i:${h.i + 4}`}
          />
        ))}
      </g>

      <g class="nodos">
        {nodos.map((n) => (
          <circle
            class="nodo" cx={n.x} cy={n.y} r="7"
            fill={n.color === 'oro' ? 'var(--color-oro)' : 'var(--color-teal)'}
            style={`--i:${n.i}`}
          />
        ))}
      </g>
    </g>
  </svg>

  <div class="contenido">
    <p class="eyebrow">Bogotá · Desarrollo, NFC y domótica</p>
    <h1>{titulo}</h1>
    {subtitulo && <p class="sub">{subtitulo}</p>}
    <slot />
  </div>
</section>

<style>
  .hero {
    position: relative;
    isolation: isolate;
    display: grid;
    align-items: center;
    min-height: clamp(440px, 62vh, 620px);
    padding: clamp(3rem, 8vw, 6rem) clamp(1.25rem, 5vw, 4rem);
    overflow: hidden;
  }

  .trama {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    z-index: -1;
    opacity: 0.55;
  }

  .contenido { max-width: 46rem; }

  .eyebrow {
    font-family: var(--fuente-mono);
    font-size: 0.75rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-teal-luz);
    margin: 0 0 1rem;
  }

  h1 {
    font-family: var(--fuente-display);
    font-size: clamp(2.1rem, 6vw, 4rem);
    font-weight: 500;
    line-height: 1.06;
    letter-spacing: -0.02em;
    color: var(--color-lino);
    margin: 0;
    text-wrap: balance;
  }

  .sub {
    font-size: clamp(1rem, 2vw, 1.2rem);
    line-height: 1.6;
    color: var(--color-humo);
    margin: 1.25rem 0 0;
    max-width: 34rem;
    text-wrap: pretty;
  }

  .hebra {
    stroke-dasharray: var(--largo);
    stroke-dashoffset: var(--largo);
    animation: tejer var(--dur-trama) var(--ease-precision) forwards;
    animation-delay: calc(var(--i) * var(--stagger));
  }

  .nodo {
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation: encender var(--dur-medio) var(--ease-nodo) forwards;
    animation-delay: calc(var(--dur-trama) * 0.62 + var(--i) * var(--stagger));
  }

  @keyframes tejer { to { stroke-dashoffset: 0; } }

  @keyframes encender {
    0%   { opacity: 0; transform: scale(0); }
    62%  { opacity: 1; transform: scale(1.45); }
    100% { opacity: 1; transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .hebra { animation: none; stroke-dashoffset: 0; }
    .nodo  { animation: none; opacity: 1; transform: none; }
  }

  @media (max-width: 640px) {
    .trama { opacity: 0.38; }
    .urdimbre { display: none; }
  }
</style>
```

**Uso:**

```astro
<TejidoHero
  titulo="Cruzamos los hilos de tu negocio"
  subtitulo="Páginas web, tarjetas NFC y automatización con Home Assistant. Un solo equipo responsable de todo."
>
  <a href={linkWhatsApp(MENSAJES.general)} class="btn-oro">Hablemos por WhatsApp</a>
</TejidoHero>
```

#### `src/styles/global.css`

Los tokens que consumen todos los componentes. Va importado en el Layout base.

```css
@import 'tailwindcss';

@theme {
  --color-abismo:    #0C1826;
  --color-fondo:     #152538;
  --color-navy:      #1B2F47;
  --color-borde:     #24405E;
  --color-oro:       #E1B366;
  --color-oro-hondo: #CA9D5A;
  --color-teal:      #42818F;
  --color-teal-luz:  #6FB3C0;
  --color-lino:      #E8EDF3;
  --color-humo:      #8FA3BC;

  --fuente-display: 'Bricolage Grotesque Variable', system-ui, sans-serif;
  --fuente-cuerpo:  'Instrument Sans Variable', system-ui, sans-serif;
  --fuente-mono:    'JetBrains Mono Variable', ui-monospace, monospace;
}

:root {
  --ease-salida:    cubic-bezier(0.16, 1, 0.30, 1);
  --ease-precision: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-nodo:      cubic-bezier(0.34, 1.56, 0.64, 1);

  --dur-instante: 120ms;
  --dur-rapido:   240ms;
  --dur-medio:    420ms;
  --dur-lento:    800ms;
  --dur-trama:   1600ms;

  --stagger: 70ms;
}

body {
  background: var(--color-abismo);
  color: var(--color-lino);
  font-family: var(--fuente-cuerpo);
  line-height: 1.7;
}

/* Números que no bailan al animarse */
.mono, .precio {
  font-family: var(--fuente-mono);
  font-variant-numeric: tabular-nums;
}

/* Animación 3 — escaneo */
.card { position: relative; overflow: hidden; }

.card::after {
  content: '';
  position: absolute; inset: 0;
  pointer-events: none;
  background: linear-gradient(105deg,
    transparent 40%,
    color-mix(in srgb, var(--color-teal-luz) 22%, transparent) 50%,
    transparent 60%);
  transform: translateX(-110%);
  transition: transform var(--dur-lento) var(--ease-precision);
}

.card:hover::after,
.card:focus-within::after { transform: translateX(110%); }

/* Animación 4 — revelado al scroll */
[data-revelar] {
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity var(--dur-medio) var(--ease-salida),
    transform var(--dur-medio) var(--ease-salida);
  transition-delay: calc(var(--i, 0) * var(--stagger));
}
[data-revelar].visible { opacity: 1; transform: none; }

/* Foco visible siempre, en todo */
:focus-visible {
  outline: 2px solid var(--color-oro);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  [data-revelar] { opacity: 1; transform: none; }
  .card::after { display: none; }
}
```

#### `src/scripts/revelar.js`

```js
const objetivos = document.querySelectorAll('[data-revelar]');

if (objetivos.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('visible');
      io.unobserve(e.target);   // una sola vez, nunca al volver a subir
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  objetivos.forEach((el) => io.observe(el));
}
```

### 4.8 Responsive

El sitio se diseña y se construye **primero para móvil**. No es una preferencia: el tráfico llega desde Instagram, en gama media, con datos móviles. El escritorio es el caso secundario.

#### Puntos de quiebre

```css
/* Mobile-first: el CSS base es el de móvil. Solo se sube desde ahí. */
--bp-sm:  40rem;   /* 640px  — móvil grande / vertical */
--bp-md:  48rem;   /* 768px  — tablet */
--bp-lg:  64rem;   /* 1024px — escritorio */
--bp-xl:  80rem;   /* 1280px — pantallas grandes */
```

Cuatro puntos, ni uno más. Cada punto de quiebre extra es una combinación más que probar en cada página.

#### Los siete problemas concretos de este sitio

**1. Las tablas de precios.** Es el problema responsive más grave que tiene el proyecto: hay más de quince tablas de precios y una tabla no cabe en 360px. En móvil cada fila se convierte en una tarjeta.

```astro
<!-- Cada celda declara su etiqueta -->
<td data-label="Precio">$45.000</td>
```

```css
@media (max-width: 40rem) {
  .tabla-precios thead { display: none; }

  .tabla-precios tr {
    display: block;
    border: 1px solid var(--color-borde);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 0.75rem;
  }

  .tabla-precios td {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.35rem 0;
    text-align: right;
  }

  .tabla-precios td::before {
    content: attr(data-label);
    color: var(--color-humo);
    font-size: 0.85rem;
    text-align: left;
    flex-shrink: 0;
  }
}
```

Encapsúlenlo en `components/ui/TablaPrecios.astro` para no repetirlo quince veces.

**2. `100vh` está roto en móvil.** La barra de direcciones de Safari y Chrome entra y sale, y `100vh` no la considera: el hero queda cortado o salta al hacer scroll.

```css
.hero {
  min-height: 100vh;   /* respaldo para navegadores viejos */
  min-height: 100dvh;  /* la unidad correcta */
}
```

**3. Las cuatro cards de segmento.** En escritorio van en fila; en móvil, **2×2, no una columna de cuatro**. Cuatro cards apiladas obligan a hacer scroll para ver la última, y esas cards son la navegación principal del home.

```css
.segmentos {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
@media (min-width: 64rem) {
  .segmentos { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
}
```

**4. El botón flotante de WhatsApp.** En iPhone, el indicador de inicio se lo come si no se respeta el área segura.

```css
.wa-flotante {
  position: fixed;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  width: 56px;   /* nunca menos de 44px */
  height: 56px;
  z-index: 90;   /* por debajo del cursor (9999), por encima del contenido */
}
```

**5. Blancos táctiles de 44×44 px mínimo.** Aplica a todo lo tocable: enlaces del menú, botones, ítems del acordeón de FAQ, enlaces del footer. Un enlace de texto de 16px tiene ~19px de alto: necesita padding, no basta con el texto.

**6. La trama del hero.** Usa `preserveAspectRatio="xMidYMid slice"`, así que en pantallas angostas recorta por los lados. Los nodos de los extremos se pierden — es aceptable porque es decorativa, pero verifiquen que **ningún nodo quede pisando el titular**. En móvil ya está reducida a `opacity: 0.38` y sin barras de urdimbre (§4.7).

**7. Desbordamiento horizontal.** Es el bug responsive número uno y casi siempre lo causa un elemento con ancho fijo. Para cazarlo:

```js
// Pegar en la consola del navegador
document.querySelectorAll('*').forEach(el => {
  if (el.getBoundingClientRect().right > document.documentElement.clientWidth)
    console.log(el);
});
```

#### Tipografía e imágenes

La tipografía ya escala con `clamp()` en los componentes de §4.7 — sin media queries para el tamaño de texto. La regla: `clamp(mínimo-móvil, valor-fluido, máximo-escritorio)`.

Para imágenes, siempre `astro:assets`, que genera `srcset` y formatos modernos:

```astro
<Image src={foto} alt="Tarjeta NFC en PVC negro mate"
       widths={[400, 800, 1200]}
       sizes="(max-width: 40rem) 100vw, 50vw"
       format="avif" />
```

`width` y `height` siempre presentes. Sin ellos, la imagen empuja el contenido al cargar y el CLS se dispara.

#### Matriz de pruebas

El emulador de Chrome no basta: no reproduce el comportamiento de la barra de direcciones ni el rendimiento real.

| Dispositivo | Por qué |
|---|---|
| Android gama media, Chrome | Es el visitante típico desde Instagram |
| iPhone, Safari | Comportamiento distinto en `100dvh`, `env()` y fuentes |
| Android pequeño (360px) | El ancho mínimo real que van a recibir |
| Escritorio 1440px | Donde vive el cursor personalizado |
| **Móvil en horizontal** | El caso que todos olvidan y donde el hero se rompe |

**Checklist responsive por página:**

- [ ] Sin scroll horizontal a 360px
- [ ] Tablas de precios convertidas en tarjetas bajo 640px
- [ ] Todo lo tocable mide 44×44 px o más
- [ ] El botón de WhatsApp no tapa contenido ni queda bajo el área segura
- [ ] El hero se ve completo en horizontal
- [ ] Las 4 cards de segmento en 2×2, no en columna
- [ ] Imágenes con `width`, `height` y `sizes`
- [ ] Probado en un Android real, no solo en el emulador

### 4.9 Regla de contención

Toda la audacia va en el puntero y en el tejido del hero. El resto: tipografía disciplinada, mucho aire, cero gradientes decorativos, cero sombras difusas, cero brillos de neón. El logo es sobrio; la interfaz también.

Antes de dar por terminada una pantalla, quita un efecto. Si nadie lo nota, sobraba.

---

## 5. Mapa del sitio

| Ruta | Línea | Propósito |
|---|---|---|
| `/` | — | Home |
| `/servicios/tarjetas-nfc` | Tag | Tarjetas de presentación |
| `/servicios/menus-restaurantes` | Tag | Hostelería |
| `/servicios/merchandising` | Tag | Llaveros, pulseras, pines |
| `/servicios/tags-rutinas` | Tag | Stickers para rutinas del celular |
| `/servicios/packaging` | Tag | Etiquetas para productos |
| `/servicios/desarrollo-web` | Web | Páginas web a la medida |
| **`/servicios/domotica`** | **Casa** | **Home Assistant remoto** |
| **`/para/profesionales`** | **—** | **Segmento: profesionales independientes** |
| **`/para/empresas`** | **—** | **Segmento: pymes y negocios** |
| **`/para/creadores`** | **—** | **Segmento: artistas y creadores** |
| **`/para/tu-casa`** | **—** | **Segmento: hogar y Airbnb** |
| **`/nosotros`** | **—** | **Quiénes somos, el equipo, cómo trabajamos** |
| `/como-funciona` | — | Educativo. Máximo tráfico orgánico. |
| `/precios` | — | Rangos públicos |
| `/portafolio` | — | Casos reales |
| `/contacto` | — | Selector + WhatsApp |
| `/blog/[slug]` | — | SEO de largo plazo |
| `/legal/*` | — | 4 páginas legales |
| `/404` | — | Con salida a home y WhatsApp |

Cada servicio es una **página propia**, no una sección del home. Son búsquedas distintas y públicos distintos, y necesitas poder mandar el link exacto por WhatsApp.

**Ojo con la confusión de nombres.** Antes tenías `/servicios/automatizacion` para los stickers NFC. Ahora hay dos cosas que suenan igual y son distintas:

- **`/servicios/tags-rutinas`** — un sticker de $15.000 que dispara una rutina *del celular* (modo no molestar, abrir una app). No controla nada de la casa.
- **`/servicios/domotica`** — Home Assistant sobre Raspberry Pi, desde $830.000, que controla *dispositivos reales*.

Si un cliente llega buscando lo segundo y aterriza en lo primero, pierdes la venta grande. En la página de tags-rutinas pon un enlace explícito: "¿Buscas controlar luces, cerraduras o cámaras de verdad? Eso es Telar Casa →".

La **página de domótica es la más importante del sitio** en términos de ingresos: ticket alto y mensualidad recurrente. Merece el mejor contenido y la mayor inversión de tiempo.

---

## 6. Quiénes somos — página `/nosotros`

### 6.1 El problema que hay que resolver primero

Un equipo pequeño y nuevo tiene dos formas de escribir esta página. Una funciona y la otra hunde el negocio.

**La que hunde:** inflar. "Somos un equipo de expertos con años de experiencia y más de 100 proyectos entregados." Esto tiene dos costos. El primero es legal: bajo el Estatuto del Consumidor, afirmar cifras o credenciales falsas en publicidad es **publicidad engañosa**, y es sancionable. El segundo es peor y es comercial: fijas una expectativa de agencia consolidada, cobras precios de equipo junior, y cada retraso normal se lee como incompetencia.

**La que funciona:** convertir el hecho de ser un equipo pequeño y nuevo en la ventaja que realmente es. Un cliente que contrata a Telar recibe frontend, backend y domótica de un mismo grupo, sin coordinar tres proveedores que se echan la culpa entre sí. Está hablando directamente con quien escribe el código, no con un ejecutivo de cuenta. Y el proyecto le importa a Telar de una forma que no le importa a una agencia con cuarenta clientes.

Eso es cierto, es verificable, y es exactamente lo que un dueño de negocio pequeño quiere oír.

**Regla:** cada afirmación de la página debe poder respaldarse. Si aún no tienes clientes, no digas que los tienes. Di lo que sí es cierto: qué sabes hacer, cómo trabajas, y quiénes son las personas.

### 6.2 Estructura de la página

| Bloque | Contenido | Por qué está |
|---|---|---|
| **1. Tesis** | Una frase que explique el nombre y lo que hace la empresa | El visitante entiende la marca en 5 segundos |
| **2. El equipo** | Card por persona: foto real, nombre, rol, especialidad, una línea personal | Justifica la palabra "equipo" y pone caras |
| **3. Cómo trabajamos** | El proceso en 4–5 pasos concretos | Reduce el riesgo percibido más que cualquier credencial |
| **4. Qué no hacemos** | Lista honesta de límites | El bloque más persuasivo de la página |
| **5. Dónde estamos** | Bogotá, trabajo remoto, cobertura | Confianza local y SEO |
| **6. CTA** | WhatsApp | Toda página termina en conversación |

### 6.3 Redacción sugerida

**Tesis (hero de la página)**

> **Telar**
>
> Un telar cruza hilos sueltos hasta que se vuelven tela. Nosotros hacemos lo mismo con la tecnología de tu negocio: la página web, los tags NFC, la casa o la oficina automatizada. Piezas que por separado no son gran cosa, y juntas cambian cómo funciona todo.
>
> Somos un equipo de desarrolladores en Bogotá. Trabajamos directo contigo, sin intermediarios.

**El equipo** — dos cards. Como ambos son full-stack, el reparto **no** es por capa técnica (uno frontend, otro backend). Eso obligaría a hacer entregas a mitad de proyecto y desperdiciaría que los dos pueden hacer todo.

El reparto es **por proyecto**: quien toma un cliente lo lleva de principio a fin. Encima de esa base común, cada uno profundiza en un dominio distinto.

> **Mariana**
> Desarrollo full-stack
>
> Toma proyectos de principio a fin: diseño, frontend, backend y base de datos. Se ha metido más a fondo en interfaz, accesibilidad y posicionamiento en Google.
>
> `Astro · React · Node · PostgreSQL · SEO`

> **Andrés**
> Desarrollo full-stack
>
> Toma proyectos de principio a fin: diseño, frontend, backend y base de datos. Se ha metido más a fondo en infraestructura, redes y automatización con Home Assistant.
>
> `Astro · React · Node · PostgreSQL · Home Assistant`

**Y debajo de las dos cards, la frase que en realidad vende:**

> Los dos hacemos el trabajo completo. Eso significa que tu proyecto lo lleva una sola persona de principio a fin —sin entregas a medias ni explicar dos veces lo mismo— y que si esa persona no está disponible, la otra puede entrar sin que tú lo notes.

**Por qué esto vale más que una especialización.** Ser dos full-stack resuelve el problema que hunde a los freelancers solos: si el único que conoce el sistema se enferma, se va de viaje o simplemente no contesta, el cliente queda varado. Con dos personas que pueden hacer lo mismo, eso no pasa. Para clientes de Telar Casa —que les están confiando el acceso a su casa— esa redundancia no es un detalle, es la razón para contratarlos a ustedes en vez de a alguien que trabaja solo.

Es cierto, es verificable, y ninguna agencia de tres personas lo puede decir con la misma honestidad.

**Ajusten los dominios si no calzan.** Puse SEO/interfaz para Mariana y redes/domótica para Andrés como propuesta. Si es al revés, o si prefieren no diferenciarse en nada, cambien esas dos líneas: la estructura funciona igual.

**Cómo trabajamos** — el proceso real, numerado (aquí la numeración sí encoda una secuencia):

> **01 · Hablamos.** Una llamada o un chat de WhatsApp. Entendemos qué necesitas y te decimos de una si podemos hacerlo. Sin costo.
>
> **02 · Cotizamos por escrito.** Alcance detallado, precio cerrado y fecha de entrega. Lo que no está en la cotización, no está en el proyecto.
>
> **03 · Arrancamos con el 50%.** El anticipo confirma el cupo en la agenda.
>
> **04 · Construimos y te mostramos.** Ves avances reales durante el proceso, no un mes de silencio y una sorpresa al final.
>
> **05 · Entregamos y acompañamos.** Todo queda a tu nombre: dominio, cuentas, código. 30 días de garantía y planes de mantenimiento si los quieres.

**Qué no hacemos** — el bloque que más confianza genera:

> - **No hacemos instalaciones eléctricas.** La programación y la integración son nuestras; el cableado lo hace un electricista certificado.
> - **No vendemos lo que no necesitas.** Si un sitio de una página te sirve, te cotizamos un sitio de una página.
> - **No prometemos primer lugar en Google.** Nadie puede. Sí dejamos tu sitio técnicamente preparado para posicionar.
> - **No desaparecemos después de entregar.** Y si prefieres irte con otro proveedor, te entregamos todo sin trabas: es tuyo.
> - **No cobramos por cotizar.** La primera conversación siempre es gratis.

**Dónde estamos**

> Bogotá, Colombia. La domótica la configuramos de forma remota, así que trabajamos con clientes en cualquier ciudad del país. Para entregas físicas de tarjetas NFC y hardware, coordinamos envío.

### 6.4 Ser un equipo cambia cosas fuera del sitio web

Estos puntos no son de diseño, pero conviene resolverlos antes de publicar la página que dice "somos un equipo".

**Quién firma los contratos.** Si el sitio dice "Telar" pero la cotización la firma una persona natural, esa persona responde con su patrimonio personal por todo. Con varios socios eso es especialmente delicado, sobre todo en domótica, donde manejan acceso a casas ajenas. **La SAS (Sociedad por Acciones Simplificada)** es el vehículo estándar en Colombia para este caso: se constituye ante la Cámara de Comercio, admite uno o varios accionistas y limita la responsabilidad al capital aportado. Consúltenlo con un abogado o contador antes de firmar el primer contrato grande.

**Ojo con esto:** la nota de §11.2 sobre el Registro Nacional de Bases de Datos decía que como persona natural probablemente no aplica. **Si constituyen una sociedad, esa conclusión cambia** y hay que verificarla de nuevo.

**El acuerdo entre ustedes.** Escríbanlo ahora, mientras se llevan bien: cómo se reparten los ingresos, quién es dueño del código y de la marca, qué pasa si alguien se va o deja de responder, cómo se decide aceptar o rechazar un proyecto. Los equipos de amigos que no escriben esto se rompen justo cuando empiezan a ganar dinero.

**Confidencialidad individual.** Las cláusulas de §12.8 obligan a "Telar". Pero quien accede a las cámaras de un cliente es una **persona concreta**. Cada integrante con acceso a sistemas de clientes debe firmar un acuerdo de confidencialidad propio. Sin eso, la obligación de la empresa no alcanza a quien efectivamente tiene la contraseña.

**Un responsable por proyecto.** Definan internamente quién lleva cada cliente. Un cliente que recibe respuestas distintas de dos personas por WhatsApp pierde la confianza rápido — ser dos full-stack no significa que ambos contesten.

**La redundancia hay que sostenerla.** Prometer en `/nosotros` que "si uno no está, entra el otro" crea una obligación real. Para que sea cierto:

- **Ambos tienen acceso administrativo** a todos los proyectos, siempre. Con cuentas nominales separadas (§10.4), nunca compartidas.
- **Un documento por cliente** con lo que no está en el código: qué dispositivos tiene, qué se decidió y por qué, qué quedó pendiente. Media página basta; lo que no sirve es que viva solo en la cabeza de uno.
- **Revisión cruzada mensual** de los proyectos del otro. Veinte minutos. Sin esto, en seis meses la promesa es falsa y no se van a dar cuenta hasta que falle.

**Las cuentas de acceso son nominales.** Ya está en §10.4: cada integrante con acceso a Home Assistant o UniFi de un cliente usa su propia cuenta de administrador, nunca una compartida. Con equipo esto deja de ser buena práctica y pasa a ser indispensable: sin cuentas nominales no hay forma de saber quién hizo qué.

### 6.5 La cuenta que hay que hacer

Los precios de §8 están calculados como precios de arranque para **una persona**. Con un equipo la aritmética cambia: una instalación de domótica Básico de $830.000 repartida entre tres personas no sostiene a nadie.

**Siendo dos full-stack, la salida es el volumen, no la división del trabajo.** Como cada uno puede llevar un proyecto completo, corran **dos proyectos en paralelo** en vez de dos personas sobre el mismo. Eso duplica la capacidad sin duplicar el precio.

Lo que hay que evitar activamente: que los dos trabajen sobre el mismo proyecto de $830.000. Se siente productivo y no lo es — es la mitad del ingreso por persona.

| Modo | Proyectos/mes | Ingreso aprox. |
|---|---|---|
| Los dos sobre un proyecto | 2 | $1.700.000 |
| Uno cada quien, en paralelo | 4 | $3.400.000 |

Trabajen juntos solo en dos casos: un proyecto de nivel Premium ($2.500.000+), o cuando uno esté aprendiendo algo que el otro ya sabe. Fuera de eso, en paralelo.

Y suban precios cuando tengan tres casos con testimonios. Los de §8 son de arranque, no de siempre.

---

## 7. El home: cuatro puertas de entrada

El sitio se organiza por **quién es el cliente**, no por cómo se llaman los productos internamente. Nadie busca "soluciones NFC"; una persona busca *dejar de repartir tarjetas de papel*. Los segmentos son el lenguaje del cliente; Tag/Web/Casa es el nuestro.

### 7.1 Los cuatro segmentos

| Segmento | Quién es | Qué le vendes | Rango |
|---|---|---|---|
| **Para profesionales** | Abogados, médicos, arquitectos, contadores, agentes inmobiliarios, asesores | Tarjeta NFC + perfil digital, portafolio web | $45.000 – $1.900.000 |
| **Para empresas** | Restaurantes, tiendas, oficinas, pymes | Sitio corporativo, tienda en línea, panel de administración, menús NFC, domótica de oficina | $550.000 – $12.000.000 |
| **Para creadores** | Artistas, músicos, fotógrafos, tatuadores, influencers | Merchandising NFC, portafolio web, tarjeta que abre redes | $30.000 – $1.900.000 |
| **Para tu casa** | Dueños de casa o apartamento, anfitriones de Airbnb | Domótica con Home Assistant, tags de rutinas | $70.000 – $2.500.000 |

**Sobre el nombre del cuarto: usen "Para tu casa", no "Para Home".** Mezclar inglés en un sitio en español rompe la voz de la marca, y en un sitio web la palabra *Home* ya significa "página de inicio" — es ambiguo justo donde no puede serlo. "Para tu casa" también es más cálido, que es lo que ese segmento necesita: le están pidiendo a alguien que le instale cámaras en su casa.

### 7.2 Cómo se ve en el home

Cuatro cards, una fila en escritorio y dos en móvil. Cada una con:

- Un verbo, no un sustantivo: *"Deja de repartir papel"* en vez de *"Tarjetas NFC"*
- Un rango de precio visible — filtra desde el primer segundo y evita conversaciones muertas
- Un enlace a la página de servicio correspondiente

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ PROFESIONALES│   EMPRESAS   │   CREADORES  │   TU CASA    │
│              │              │              │              │
│ Deja de      │ Pon tu       │ Que te       │ Que tu casa  │
│ repartir     │ negocio a    │ encuentren   │ haga cosas   │
│ papel        │ funcionar    │ de un toque  │ sola         │
│              │              │              │              │
│ desde 45.000 │ desde 550.000│ desde 30.000 │ desde 70.000 │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

Cada card lleva `data-revelar` con su `--i` para que entren escalonadas, y el barrido de escaneo en hover (§4.4).

### 7.3 Páginas de segmento

Además de las cards, cada segmento merece su propia página en `/para/[segmento]`. Sirven para tres cosas: mandar el link exacto por WhatsApp a un prospecto, tener destino para pauta en Instagram, y capturar búsquedas del tipo "página web para abogados Bogotá".

**La advertencia:** cada página necesita contenido genuinamente distinto — casos, objeciones y ejemplos de ese público. Si son el mismo texto con las palabras cambiadas, Google las trata como contenido duplicado y no posiciona ninguna. Si no tienen material real para las cuatro, publiquen dos bien hechas y dejen las otras para después.

Las páginas de servicio (`/servicios/*`) siguen existiendo y son las que posicionan por producto. Las de segmento posicionan por público. Se enlazan entre sí, no se reemplazan.

---

## 8. Catálogo de servicios y precios

> **Precios de arranque (nivel junior).** Están deliberadamente bajos para construir portafolio y testimonios. Revísalos cada 3–4 proyectos entregados. Si nunca te dicen "está caro", estás cobrando poco.
>
> **Todos los precios van sin IVA.** Telar está por debajo del tope de 3.500 UVT ($183.309.000 anuales), así que no es responsable de IVA. Cada página de precios y cada cotización lleva la leyenda: *"Precios en pesos colombianos. No somos responsables de IVA."* Ver §11.3.

### 8.1 Tarjetas de presentación NFC

Reemplazan la tarjeta de papel. El contacto acerca su celular a la tarjeta PVC y se abre de inmediato tu perfil profesional: datos, redes, portafolio, enlace de pago, ubicación.

| Producto | Precio |
|---|---|
| Tarjeta NFC — grabado a un enlace existente | $45.000 |
| Tarjeta NFC + diseño de perfil digital | $85.000 |
| Tarjeta premium (PVC negro mate / metalizado, diseño exclusivo, QR de respaldo) | $130.000 |
| Pack 5 tarjetas (equipo comercial) | $190.000 |
| Pack 10 tarjetas | $340.000 |
| Reprogramación de tarjeta existente | $15.000 |

Incluye: diseño gráfico de la tarjeta, grabado del chip, pruebas en Android e iOS, entrega en Bogotá.

### 8.2 Menús digitales y promociones para restaurantes

Table tents, posavasos o stickers en mesa. Un toque y el cliente ve la carta, se conecta al WiFi sin escribir contraseña, o califica en Google.

| Producto | Precio |
|---|---|
| Table tent NFC (unidad) | $30.000 |
| Sticker NFC para mesa o vitrina | $15.000 |
| Tag de WiFi (conexión sin contraseña) | $25.000 |
| Tag de reseñas en Google | $25.000 |
| **Paquete Restaurante** — 10 table tents + carta digital + WiFi + Google Reviews | **$550.000** |
| Actualización mensual de la carta | $60.000/mes |

### 8.3 Merchandising personalizado

Llaveros, pulseras y pines que abren Instagram, TikTok, un catálogo o una web. Para creadores de contenido, marcas y eventos.

| Producto | Precio |
|---|---|
| Llavero NFC personalizado | $35.000 |
| Pulsera NFC (eventos, gimnasios) | $30.000 |
| Pin / botón NFC | $28.000 |
| Lote 20+ unidades | Desde $22.000 c/u |

### 8.4 Tags de rutinas para el celular

Stickers programados para disparar rutinas **del celular**. Un tag en la mesa de noche activa "No molestar" y apaga el WiFi. Uno en el escritorio silencia el teléfono y abre el calendario.

| Producto | Precio |
|---|---|
| Sticker individual programado | $15.000 |
| **Kit 5 stickers + configuración de rutinas** | **$70.000** |
| Kit 10 stickers + configuración | $120.000 |
| Configuración a domicilio (Bogotá) | +$40.000 |

Lo que se vende aquí no es el sticker: es la configuración. Deja eso claro en la página.

> **En la página web, aclara el límite:** estos tags actúan sobre el celular, no sobre la casa. No encienden luces ni abren puertas. Para eso está **Telar Casa** (§8.7) — e incluye un enlace directo. Es la ruta natural de venta ascendente: quien compra un kit de $70.000 y queda satisfecho es candidato a un proyecto de $1.430.000.

### 8.5 Etiquetas inteligentes para packaging

Para marcas que quieren que su empaque haga algo. Video de instrucciones, trazabilidad del producto, enlace directo de recompra.

| Producto | Precio |
|---|---|
| Etiqueta NFC (mínimo 20 unidades) | $12.000 c/u |
| Lote 100+ unidades | $8.500 c/u |
| Configuración de destino + página de aterrizaje simple | $250.000 |

### 8.6 Desarrollo web a la medida

Proceso completo: diseño, frontend, backend, base de datos, Google Search Console, pasarela de pagos y panel de administración. Una sola persona responsable de todo el proyecto.

| Nivel | Alcance | Precio |
|---|---|---|
| **Landing page** | 1 página, diseño responsive, formulario a WhatsApp, SEO básico, dominio y despliegue | $700.000 – $1.100.000 |
| **Portafolio profesional** | 4–5 páginas, galería, blog, Google Search Console, Analytics | $1.200.000 – $1.900.000 |
| **Sitio corporativo** | 6–10 páginas, blog con gestor de contenido, SEO técnico, schema, multi-formulario | $1.900.000 – $3.200.000 |
| **Sitio + panel de administración** | Todo lo anterior + base de datos, autenticación, roles y CRUD completo para administrar el negocio | $3.500.000 – $6.500.000 |
| **Tienda en línea con pagos** | Todo lo anterior + carrito, pasarela (Wompi / Mercado Pago), inventario, notificaciones | $6.500.000 – $12.000.000 |

**Complementos**

| Servicio | Precio |
|---|---|
| Configuración de Google Search Console + SEO técnico | $350.000 |
| Migración de contenido desde sitio existente | $300.000 – $700.000 |
| Integración con WhatsApp Business API | $600.000 |
| Diseño desde cero (vs. adaptación de plantilla) | +30% |
| Multi-idioma | +25% |
| Hora adicional fuera de alcance | $60.000/hora |

### 8.7 Telar Casa — Automatización con Home Assistant

**Programación e integración remota.** Todo el trabajo se hace de forma remota. El único hardware que se entrega es la **Raspberry Pi ya configurada y lista para enchufar**. Los demás dispositivos (enchufes, sensores, cerraduras, cámaras, equipos UniFi) los compra el cliente con base en una lista de compras que se entrega por separado.

#### Nivel Básico — Apartamento, casa pequeña, Airbnb

Para 5–10 dispositivos y automatizaciones simples.

| Concepto | Precio |
|---|---|
| Raspberry Pi 4 (4GB) configurada y lista para enchufar | $280.000 |
| Instalación de Home Assistant + configuración inicial | $250.000 |
| Integración de dispositivos (hasta 8–10) | Incluido |
| Automatizaciones básicas (horarios, presencia, alertas WhatsApp/Telegram) | $200.000 |
| Dashboard simple | $100.000 |
| **Total instalación** | **$830.000** |
| **Mantenimiento mensual** | **$60.000/mes** |

#### Nivel Intermedio — Casa familiar, apartamento grande

Para 10–20 dispositivos, control por voz y automatizaciones con múltiples condiciones.

| Concepto | Precio |
|---|---|
| Raspberry Pi 4 (4GB u 8GB) configurada y lista para enchufar | $300.000 |
| Instalación de Home Assistant + configuración inicial | $300.000 |
| Integración de dispositivos (hasta 15–20) | Incluido |
| Automatizaciones avanzadas (condiciones múltiples, rutinas, clima, horarios cruzados) | $400.000 |
| Integración con Alexa (control por voz) | $150.000 |
| Nabu Casa (acceso remoto seguro) — configuración | $80.000 |
| Dashboard personalizado | $200.000 |
| **Total instalación** | **$1.430.000** |
| **Mantenimiento mensual** (incluye el costo de Nabu Casa) | **$110.000/mes** |

#### Nivel Premium — Pyme, oficina, casa grande con seguridad

Para 20+ dispositivos, cámaras, control de acceso e integración UniFi.

| Concepto | Precio |
|---|---|
| Raspberry Pi 4 (8GB, recomendado por carga de procesos) configurada | $320.000 |
| Instalación de Home Assistant + configuración inicial | $350.000 |
| Integración de dispositivos (20+) | Incluido |
| Automatizaciones avanzadas (cámaras, notificaciones con foto/video, control de acceso) | $700.000 |
| Integración completa con UniFi (Network + Protect + Access) | $600.000 |
| Integración con Alexa | $150.000 |
| Nabu Casa — configuración | $80.000 |
| Dashboard ejecutivo con reportes | $300.000 |
| **Total instalación** | **$2.500.000** |
| **Mantenimiento mensual** | **$200.000 – $300.000/mes** |

#### Qué incluye y qué no

| Incluido en el precio | No incluido (lo compra el cliente) |
|---|---|
| Raspberry Pi configurada y lista para enchufar | Enchufes inteligentes, sensores, bombillas |
| Programación e integración de Home Assistant | Cerraduras inteligentes |
| Automatizaciones a la medida | Cámaras de seguridad |
| Dashboard personalizado | Equipos UniFi (routers, access points, cámaras Protect) |
| Soporte y ajustes remotos (según plan de mantenimiento) | Instalación física: cables, atornillar, montar |
| Lista de compras de dispositivos compatibles | Obra eléctrica de cualquier tipo |

**Texto para incluir en cada cotización:**

> "El precio anterior incluye la Raspberry Pi configurada y todo mi trabajo de programación e integración. No incluye enchufes, sensores, cerraduras, cámaras ni equipos UniFi — esos los compras tú directamente con la lista de compras que te entrego, o los adquiere tu técnico de confianza."

#### Notas operativas

**La tarjeta SD es el punto débil.** Las microSD en una Raspberry que escribe logs 24/7 fallan; es cuestión de cuándo. Usa una SD de grado industrial o, mejor, arranque desde SSD por USB. Define en el contrato que el respaldo de configuración es parte del plan de mantenimiento — si no lo defines, cada SD quemada será una discusión.

**Margen del hardware.** A la tasa actual del dólar, una Pi 4 con fuente, caja y almacenamiento te cuesta muy cerca de lo que la vendes. **El hardware no es tu negocio**: es el vehículo. Tu margen está en la configuración y, sobre todo, en la mensualidad. No pelees por bajar el precio de la Pi.

**Considera la Raspberry Pi 5.** La 4 sigue funcionando bien, pero la 5 maneja mucho mejor la carga de UniFi Protect y el procesamiento de video del nivel Premium. Si tu proveedor la tiene a precio razonable, vale la diferencia en ese nivel.

**Nunca prometas "seguridad".** Ver §11.6. Esto es crítico y afecta la redacción de toda la página.

### 8.8 Mantenimiento

**Sitios web**

| Plan | Incluye | Mensual | Anual (10% dcto) |
|---|---|---|---|
| **Esencial** | Hosting, dominio, SSL, backups semanales, actualizaciones de seguridad, monitoreo | $90.000 | $970.000 |
| **Activo** | Lo anterior + 2h/mes de cambios, reporte mensual de analítica | $190.000 | $2.050.000 |
| **Gestionado** | Lo anterior + 5h/mes, soporte prioritario 24h, ajustes de SEO | $380.000 | $4.100.000 |

**Domótica (Telar Casa)**

| Plan | Incluye | Mensual |
|---|---|---|
| **Básico** | Actualizaciones de Home Assistant, respaldo mensual de configuración, soporte remoto por WhatsApp en horario hábil, hasta 1 ajuste de automatización al mes | $60.000 |
| **Intermedio** | Lo anterior + suscripción Nabu Casa incluida, respaldo quincenal, hasta 3 ajustes al mes, monitoreo de disponibilidad | $110.000 |
| **Premium** | Lo anterior + respaldo semanal, ajustes ilimitados razonables, revisión trimestral del sistema, prioridad de respuesta | $200.000 – $300.000 |

Referencia del mercado para web: el mantenimiento anual vale entre 15% y 20% del valor del proyecto.

**La mensualidad de domótica es tu ingreso más valioso.** Es recurrente, predecible y el cliente rara vez la cancela porque el sistema deja de funcionar bien sin ella. Diez clientes en plan Intermedio son $1.100.000 mensuales sin vender nada nuevo. Prioriza cerrar mantenimientos por encima de cerrar instalaciones sueltas.

### 8.9 Paquetes combinados

| Paquete | Contenido | Precio |
|---|---|---|
| **Profesional Independiente** | Landing personal + 3 tarjetas NFC + 1 año plan Esencial | $1.600.000 |
| **Negocio Local** | Sitio corporativo + 10 tags NFC + Google Search Console + 1 año Esencial | $3.400.000 |
| **Restaurante Completo** | Carta digital + 15 table tents + WiFi + Google Reviews + 1 año de actualizaciones | $2.100.000 |
| **Casa Conectada** | Domótica Intermedio + 5 tags NFC que disparan escenas de Home Assistant | $1.550.000 |
| **Oficina Telar** | Domótica Premium + sitio corporativo + 10 tags NFC + 1 año de ambos mantenimientos | $6.900.000 |

El paquete **Casa Conectada** es donde las líneas se cruzan de verdad: un tag NFC pegado junto a la puerta que activa la escena "salgo de casa" — apaga luces, baja persianas, arma sensores. Es barato de agregar, se demuestra en diez segundos y es exactamente el tipo de detalle que genera referidos.

---

## 9. Integración con WhatsApp

Número: **+57 301 183 6458** → formato internacional sin signos: `573011836458`

### `src/lib/constantes.ts`

```ts
export const NEGOCIO = {
  nombre: 'Telar',
  eslogan: 'Cruzamos los hilos de tu negocio',
  telefono: '573011836458',
  telefonoVisible: '+57 301 183 6458',
  email: 'contacto@telar.co',
  ciudad: 'Bogotá D.C.',
  pais: 'Colombia',
  url: 'https://telar.co',
} as const;

export const LINEAS = {
  tag: 'Telar Tag',
  web: 'Telar Web',
  casa: 'Telar Casa',
} as const;
```

### `src/lib/whatsapp.ts`

```ts
import { NEGOCIO } from './constantes';

/** Genera un enlace de WhatsApp con mensaje prellenado. */
export function linkWhatsApp(mensaje: string): string {
  return `https://wa.me/${NEGOCIO.telefono}?text=${encodeURIComponent(mensaje)}`;
}

/** Mensajes por contexto: sabes desde qué página escribió. */
export const MENSAJES = {
  general:
    'Hola Telar, vi su página y quiero más información sobre sus servicios.',

  // Telar Tag
  tarjetas:
    'Hola Telar, me interesan las tarjetas de presentación NFC. ¿Me cuentan cómo funciona el proceso?',
  restaurantes:
    'Hola Telar, tengo un restaurante y me interesa el paquete de menú digital con NFC.',
  merchandising:
    'Hola Telar, quiero cotizar llaveros / pulseras NFC personalizados.',
  tagsRutinas:
    'Hola Telar, me interesa el kit de stickers NFC para rutinas del celular.',
  packaging:
    'Hola Telar, quiero cotizar etiquetas NFC para el empaque de mis productos.',

  // Telar Web
  web: 'Hola Telar, necesito una página web. ¿Podemos hablar del proyecto?',

  // Telar Casa — un mensaje por nivel: sabes el presupuesto antes de responder
  domoticaGeneral:
    'Hola Telar, me interesa automatizar mi casa con Home Assistant. ¿Me orientan?',
  domoticaBasico:
    'Hola Telar, me interesa el nivel Básico de domótica (apartamento, 5-10 dispositivos).',
  domoticaIntermedio:
    'Hola Telar, me interesa el nivel Intermedio de domótica (casa familiar, control por voz).',
  domoticaPremium:
    'Hola Telar, me interesa el nivel Premium de domótica (cámaras, UniFi, control de acceso).',
} as const;
```

### Uso en un componente

```astro
---
import { linkWhatsApp, MENSAJES } from '../lib/whatsapp';
---
<a
  href={linkWhatsApp(MENSAJES.tarjetas)}
  target="_blank"
  rel="noopener noreferrer"
  class="..."
>
  Cotizar por WhatsApp
</a>
```

**`rel="noopener noreferrer"` no es opcional.** Sin `noopener`, la pestaña que abres obtiene una referencia a tu ventana vía `window.opener` y puede redirigirla. Es una vulnerabilidad conocida (*tabnabbing*).

### Botón flotante

Fijo abajo a la derecha, aparece después de 400px de scroll. Con `aria-label` descriptivo. No lo pongas encima del contenido en móvil: respeta `env(safe-area-inset-bottom)`.

---

## 10. Seguridad

Un sitio Astro estático ya elimina la mayoría de vectores de ataque: no hay servidor de aplicación, ni base de datos, ni sesiones. No existe inyección SQL porque no hay SQL. Pero quedan riesgos reales.

### 10.1 Encabezados HTTP

Crea `public/_headers` (Cloudflare Pages / Netlify):

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://analytics.umami.is; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), interest-cohort=()
```

En Vercel el equivalente va en `vercel.json` bajo `headers`.

Verifica el resultado en **securityheaders.com** y **observatory.mozilla.org**. Meta: calificación A.

### 10.2 Checklist

- [ ] **HTTPS forzado** con redirección 301 desde HTTP. Automático en Cloudflare/Vercel.
- [ ] **HSTS activo** (el header de arriba). Ojo: es difícil de revertir, actívalo cuando el dominio esté estable.
- [ ] **`.env` en `.gitignore`.** Nunca subas claves al repositorio. Si subes una por error, rótala — el historial de Git es permanente.
- [ ] **2FA obligatorio** en GitHub, Cloudflare/Vercel y el registrador del dominio. El secuestro de dominio es el riesgo más grave y el más ignorado.
- [ ] **Dependabot activado** en GitHub para alertas de vulnerabilidades.
- [ ] **`npm audit`** antes de cada despliegue. `npm audit fix` para lo automático.
- [ ] **Dependencias mínimas.** Cada paquete es superficie de ataque. Si puedes resolverlo con 20 líneas de CSS, no instales una librería.
- [ ] **SRI en scripts externos.** Si cargas algo desde un CDN, usa `integrity` y `crossorigin`.
- [ ] **Sin datos personales en el sitio.** Al usar WhatsApp en vez de formulario propio, no almacenas nada. Menos riesgo técnico y menos obligación legal.
- [ ] **Si más adelante agregas formulario:** honeypot oculto + validación en servidor + rate limiting + sanitización de entradas. Nunca confíes en la validación del cliente.
- [ ] **Backups del repositorio** en un segundo lugar, no solo GitHub.
- [ ] **`robots.txt` y `sitemap.xml`** correctos, sin exponer rutas administrativas.
- [ ] **Página 404 propia** que no revele información del stack.
- [ ] **Deshabilita el listado de directorios** en el hosting.

### 10.3 Lo que le prometes al cliente

Cuando vendas desarrollo, sé preciso en lo que garantizas. En Colombia, el acceso abusivo a sistemas informáticos y la violación de datos personales están tipificados como delitos (**Ley 1273 de 2009**). Si administras infraestructura de un cliente, defínelo por contrato: qué aseguras, qué monitoreas, y qué queda fuera de tu responsabilidad.

### 10.4 Seguridad en Telar Casa — la parte más delicada del negocio

El sitio web es estático y casi no tiene riesgo. **La domótica sí lo tiene, y es de otra categoría.** Estás configurando de forma remota sistemas que ven el interior de la casa de alguien y, en el nivel Premium, que abren sus puertas. Trátalo con la seriedad que merece.

**Reglas no negociables:**

- [ ] **Todas las cuentas van a nombre del cliente.** Nabu Casa, UniFi, Alexa, correo del sistema. Tú recibes acceso, no propiedad. Si las cuentas están a tu nombre, tienes en tus manos la casa de un tercero y el cliente queda secuestrado — ambas cosas son inaceptables.
- [ ] **Contraseñas generadas por el cliente**, guardadas en su gestor. Tú nunca las almacenas en texto plano ni en notas ni en WhatsApp.
- [ ] **Cuenta de administrador propia y nominal** dentro de Home Assistant, separada de la del cliente. Así queda trazabilidad de quién hizo qué.
- [ ] **Define por escrito qué acceso conservas después de la entrega** y por cuánto tiempo. Si el cliente no contrata mantenimiento, tu acceso se revoca al cierre del proyecto y se lo confirmas por escrito.
- [ ] **Nunca expongas Home Assistant directamente a internet.** Nada de abrir puertos en el router. Solo Nabu Casa o VPN. Un Home Assistant con puerto abierto es un objetivo automatizado.
- [ ] **Autenticación de dos factores obligatoria** en Home Assistant, Nabu Casa y UniFi.
- [ ] **Red separada para IoT** cuando el equipo lo permita (VLAN en UniFi). Una cámara barata comprometida no debe tener acceso al computador de trabajo del cliente.
- [ ] **Actualizaciones al día.** Home Assistant publica versiones mensuales con parches. Eso es literalmente parte de lo que cobras en el mantenimiento.
- [ ] **Respaldo cifrado** de la configuración, guardado fuera de la Raspberry.
- [ ] **Nunca uses la red del cliente para nada más.** Ni pruebas, ni descargas, ni tráfico propio.

**Protocolo si algo se compromete:** informa al cliente el mismo día, por escrito. Documenta qué pasó, qué datos pudieron estar expuestos y qué hiciste. Si hay datos personales involucrados (video, registros de acceso), la Ley 1581 exige informar al titular, y en ciertos casos también a la SIC. No lo ocultes: ocultarlo convierte un incidente en un problema legal grave.

---

## 11. Cumplimiento legal (Colombia)

> **No soy abogado y esto no es asesoría jurídica.** Es un mapa de lo que aplica y de las páginas que el sitio necesita. Antes de publicar, valida el contenido definitivo con un abogado o un contador — especialmente lo tributario.

### 11.1 Normas que te aplican

| Norma | Qué exige |
|---|---|
| **Ley 1581 de 2012** + **Decreto 1377 de 2013** (Habeas Data) | Autorización previa, expresa e informada para tratar datos personales. Política de tratamiento publicada. Canal para ejercer derechos. |
| **Ley 1480 de 2011** (Estatuto del Consumidor) | Identificarte plenamente en el sitio: nombre o razón social, NIT o cédula, dirección y contacto. Información veraz de precios y condiciones. |
| **Ley 527 de 1999** | Validez del comercio electrónico y de los mensajes de datos. Base legal de tus cotizaciones por correo o WhatsApp. |
| **Ley 1273 de 2009** | Delitos informáticos. Relevante en lo que garantizas al administrar sistemas ajenos. |
| **Ley 23 de 1982** y **Decisión Andina 351** | Derechos de autor. Aplica a fuentes, imágenes, íconos y código que uses. |
| **RGPD (UE)** | Solo si recibes visitantes europeos de forma habitual. Si vendes local, no es prioridad. |

### 11.2 Puntos prácticos

**Autorización de datos.** Si algún día pones un formulario, la casilla de aceptación **no puede venir marcada por defecto**. El consentimiento debe ser un acto positivo del usuario, y debes poder demostrar que lo dio.

**Registro Nacional de Bases de Datos (RNBD).** La obligación de registrar bases ante la SIC depende del tipo de responsable y del volumen de activos. Como persona natural probablemente no aplique, pero **verifícalo con un abogado** antes de asumirlo.

**Cookies.** Si usas Umami o Plausible, no instalas cookies ni rastreas individuos: te ahorras el banner. Si usas Google Analytics 4, sí necesitas banner de consentimiento con opción real de rechazar.

**Precios publicados.** Bajo el Estatuto del Consumidor, el precio anunciado debe ser el precio total. Ver §11.3 para el cálculo del IVA de Telar.

**Testimonios y portafolio.** No publiques el logo, el nombre ni capturas del proyecto de un cliente sin autorización escrita. Inclúyela como cláusula en tu contrato desde el primer proyecto.

**Propiedad intelectual de terceros.** Verifica la licencia de cada fuente, ícono, imagen y plantilla. "Lo encontré en Google" no es una licencia.

**Facturación electrónica.** La DIAN tiene reglas sobre quién debe facturar electrónicamente y desde cuándo. Resuélvelo antes de la primera venta, no después.

### 11.3 IVA: el cálculo para Telar

> Las cifras son públicas y verificables. La aplicación al caso concreto de Telar la confirma un contador.

#### Situación actual: no responsables de IVA

La UVT para 2026 quedó en **$52.374** (Resolución DIAN 000238 del 15 de diciembre de 2025). El tope para no ser responsable de IVA es de 3.500 UVT:

**3.500 × $52.374 = $183.309.000 al año** (unos **$15.275.000 mensuales** en ingresos brutos)

Además del tope de ingresos hay que cumplir las demás condiciones del Art. 437 ET: máximo un establecimiento de comercio, sin franquicia ni concesión, contratos individuales por debajo del mismo tope, y consignaciones bancarias del año por debajo del tope.

Con dos personas y precios de arranque, Telar está muy por debajo. **Publiquen los precios tal cual, sin IVA**, y usen esta leyenda en el sitio y en cada cotización:

> "Precios en pesos colombianos. No somos responsables de IVA."

Esa leyenda no es opcional: quien no es responsable de IVA debe indicarlo en sus documentos.

#### El hallazgo que cambia la estructura de precios

**El desarrollo web está excluido de IVA. Las tarjetas NFC y el hardware, no.**

El numeral 21 del artículo 476 del Estatuto Tributario excluye del IVA el *suministro de páginas web, servidores (hosting) y computación en la nube*. La DIAN y el MinTIC detallaron el alcance en el Concepto Unificado 017056 de 2017.

| Concepto | Trato | Base |
|---|---|---|
| Desarrollo de páginas y sitios web | **Excluido** | Art. 476 num. 21 ET |
| Hosting | **Excluido** | Art. 476 num. 21 ET |
| Servicios en la nube | **Excluido** | Art. 476 num. 21 ET |
| Tarjetas NFC, stickers, llaveros, table tents | **19%** | Tarifa general (bienes) |
| Raspberry Pi | **19%** | Tarifa general (bienes) |
| Diseño gráfico del material físico | **19%** | Tarifa general |
| Configuración de Home Assistant | **Verificar** | No es página web ni nube; probablemente gravado |
| Mantenimiento remoto de domótica | **Verificar** | Zona gris — consúltenlo |

Las dos filas de "verificar" son ambiguas de verdad y no se las voy a resolver: la exclusión de *mantenimiento a distancia de programas y equipos* existía en el numeral 25 antes de la Ley 2010 de 2019, y su vigencia actual necesita revisión profesional. **Llévenle esta tabla al contador con esas dos filas señaladas.**

#### Qué pasa cuando crucen el tope

Los precios no suben parejo. Esto hay que planearlo desde ahora:

| Concepto | Hoy | Como responsables de IVA |
|---|---|---|
| Landing page | $700.000 | **$700.000** (sin cambio) |
| Sitio corporativo | $1.900.000 | **$1.900.000** (sin cambio) |
| Tarjeta NFC básica | $45.000 | **$53.550** |
| Raspberry Pi 4 (4GB) | $280.000 | **$333.200** |
| Domótica Básico (total) | $830.000 | **$987.700** |

**Tres consecuencias prácticas:**

1. **Telar Web tiene ventaja estructural.** Sus precios nunca suben por IVA. Es una razón adicional para empujar esa línea.
2. **Los paquetes combinados hay que desglosarlos.** Un paquete que mezcla sitio web (excluido) con tarjetas NFC (gravadas) en un solo precio es un problema contable. Factúrenlos siempre en líneas separadas — lo mismo que ya recomendamos en §11.4 para separar hardware de servicio.
3. **Excluido no es exento.** Al estar excluidos, no pueden descontar el IVA que pagan en sus compras relacionadas: ese costo queda dentro de sus gastos. Considérenlo al fijar márgenes.

#### Qué hacer ahora

- [ ] Publicar precios sin IVA + la leyenda "No somos responsables de IVA"
- [ ] Llevar la tabla de arriba al contador, con las dos filas de "verificar" señaladas
- [ ] Resolver la facturación electrónica ante la DIAN antes de la primera venta
- [ ] Poner una alerta cuando los ingresos anuales lleguen a **$140.000.000** — a esa altura hay que empezar a preparar el cambio de régimen, no cuando ya crucen el tope

### 11.4 Ahora vendes un producto físico, no solo servicios

Esto cambia tus obligaciones y es fácil pasarlo por alto. Al vender la Raspberry Pi configurada, dejas de ser solo prestador de servicios y te conviertes en **vendedor de un bien**, con todo lo que el Estatuto del Consumidor (Ley 1480 de 2011) le exige a un vendedor:

**Garantía legal.** Todo producto nuevo vendido en Colombia tiene garantía legal obligatoria, que existe aunque no la menciones y **no puedes reducirla por contrato**. Cubre el funcionamiento del bien y obliga a repararlo, cambiarlo o devolver el dinero. Necesitas saber exactamente qué plazo aplica a tu caso: **consúltalo con un abogado antes de publicar precios de hardware.**

**Derecho de retracto.** Las ventas a distancia (por WhatsApp, por el sitio, sin que el cliente esté físicamente presente) generalmente dan al comprador un plazo para retractarse y devolver el producto. Toda tu operación es a distancia, así que esto te aplica de lleno. Verifica el plazo y las excepciones vigentes con un abogado.

**Cómo protegerte sin incumplir:**

- **Separa las dos cosas en la cotización.** Una línea para el hardware (Raspberry Pi, con garantía de producto) y otra para el servicio de configuración. Son regímenes distintos y mezclarlos te perjudica.
- **Deja constancia de que el servicio ya se prestó.** Si el cliente se retracta del hardware pero tú ya invertiste 8 horas configurando, la separación anterior es lo que te permite cobrar el trabajo hecho.
- **Guarda la factura de compra de la Pi.** Es tu respaldo frente al proveedor si el equipo sale defectuoso.
- **Documenta la entrega.** Foto del equipo, número de serie, fecha, confirmación de recibido por escrito.

### 11.5 Cámaras y control de acceso = datos personales sensibles

En el nivel Premium integras UniFi Protect y Access. Las **imágenes de video de personas identificables son datos personales**, y los registros de quién entró y a qué hora, también.

Al tener acceso remoto a esos sistemas, tú te conviertes en **encargado del tratamiento** de datos de los que el cliente es responsable. Eso exige:

- Un **acuerdo escrito de tratamiento de datos** entre tú y el cliente, definiendo qué puedes hacer con esa información y qué no.
- **Compromiso expreso de no acceder a grabaciones** salvo por solicitud del cliente o necesidad técnica documentada.
- Que sea **el cliente** quien informe a empleados, visitantes y residentes sobre la existencia de las cámaras. Es su obligación, no la tuya, pero adviértele por escrito que la tiene.
- **Confidencialidad indefinida**, que sobrevive al fin del contrato.

Sin este acuerdo, un incidente en la casa del cliente puede convertirse en un problema tuyo.

### 11.6 Nunca vendas "seguridad" — vende "notificaciones"

Este es el riesgo comercial más grande de Telar Casa, y es puramente de redacción.

Si tu página dice **"protege tu casa"**, **"sistema de seguridad"** o **"mantén tu familia segura"**, estás asumiendo una obligación de resultado. El día que entren a robar y la cámara no notificó, o la cerradura falló, tú prometiste seguridad y no la entregaste. Ahí la discusión ya no es técnica.

Si tu página dice **"recibe una notificación con foto cuando se detecte movimiento"**, describes lo que el sistema hace. Es verificable, honesto y no promete un resultado que no controlas.

| ❌ No escribas | ✅ Escribe |
|---|---|
| Sistema de seguridad para tu hogar | Automatización y monitoreo para tu hogar |
| Protege tu casa | Entérate de lo que pasa en tu casa |
| Mantén tu familia segura | Recibe alertas en tiempo real |
| Vigilancia 24/7 | Notificaciones con foto y video ante detección de movimiento |
| Nunca más te roben | Registro de eventos y acceso al historial de video |

**Cláusula obligatoria en toda cotización de domótica:**

> "Este sistema de automatización no sustituye un sistema de alarma monitoreada, ni un servicio de vigilancia privada, ni una póliza de seguros. Su funcionamiento depende de energía eléctrica, conexión a internet y de servicios de terceros (Home Assistant, Nabu Casa, UniFi, Alexa). Telar no se hace responsable por pérdidas, daños o incidentes derivados de fallas en cualquiera de estos elementos."

Repítela en la página de domótica, en pie de página, con letra legible. Que sea visible no reduce las ventas: da confianza.

### 11.7 Servicios de terceros de los que dependes

Home Assistant, Nabu Casa, Alexa y UniFi son de terceros. Cambian precios, cambian APIs y a veces descontinúan funciones. Nada de eso está bajo tu control.

Déjalo por escrito: si un tercero cambia sus condiciones, la adaptación del sistema se cotiza como alcance nuevo. Sin esa cláusula, cada actualización rota de Alexa se convierte en trabajo gratis.

### 11.8 Páginas legales obligatorias

Las cuatro van en el footer, visibles en todas las páginas.

| Página | Contenido mínimo |
|---|---|
| `/legal/privacidad` | Qué datos recolectas, para qué, cuánto tiempo los conservas, con quién los compartes, cómo se ejercen los derechos, datos de contacto del responsable. |
| `/legal/datos-personales` | Política de Tratamiento de Datos según Ley 1581: finalidades, derechos del titular (conocer, actualizar, rectificar, suprimir, revocar), procedimiento y plazos de respuesta, canal de atención. |
| `/legal/terminos` | Condiciones de uso, alcance de los servicios, condiciones de pago, garantías, limitación de responsabilidad, propiedad intelectual, ley aplicable y jurisdicción (Colombia). |
| `/legal/cookies` | Solo si usas cookies. Qué son, cuáles usas, para qué, cómo desactivarlas. |

**Bloque de identificación en el footer** (exigido por el Estatuto del Consumidor):

```
Telar — [Nombre completo o razón social]
NIT / C.C. [número]
Bogotá D.C., Colombia
WhatsApp: +57 301 183 6458
Correo: contacto@telar.co
```

### 11.9 Accesibilidad

No hay obligación legal para sitios privados en Colombia, pero es criterio de calidad y punto de venta frente a clientes institucionales. Mínimos:

- Contraste de texto 4.5:1 — la tabla de §4.1 ya los tiene calculados. El teal `#42818F` no se usa en cuerpo de texto.
- Foco de teclado visible en todos los elementos interactivos.
- `alt` descriptivo en cada imagen con contenido.
- Jerarquía de encabezados correcta: un solo `<h1>` por página.
- `prefers-reduced-motion` respetado.
- Navegación completa con teclado.

---

## 12. Condiciones comerciales

Este bloque va **público en `/precios`** y **completo en cada cotización**. La mayoría de proyectos que se vuelven un problema es porque esto no estaba escrito.

### 12.1 Forma de pago

- **50% de anticipo** para iniciar. Sin anticipo no se agenda ni se empieza.
- **50% restante** contra entrega y aprobación, **antes de publicar en producción**.
- Proyectos superiores a $5.000.000: 40% / 30% / 30% por hitos.
- Productos NFC: pago del 100% por anticipado en pedidos menores a $200.000.
- **Telar Casa:** el **hardware se paga al 100% por anticipado** (es una compra que sale de tu bolsillo). El servicio de configuración se rige por el 50/50 general. Factúralos en líneas separadas — ver §11.4.
- **Mantenimiento:** se cobra por anticipado, mensual o anual. La suspensión por mora aplica tras 15 días.
- Medios: transferencia bancaria, Nequi o Bancolombia. Comprobante como soporte.

### 12.2 Alcance

- El alcance se define por escrito antes de iniciar y queda anexo a la cotización.
- **Se incluyen 2 rondas de revisión** por entregable. Cada ronda adicional se cotiza aparte.
- Toda funcionalidad, página o integración no listada en la cotización constituye **alcance nuevo**.
- El alcance nuevo se cotiza por separado y **requiere aprobación escrita antes de ejecutarse**. Puede afectar el cronograma.
- Ajustes menores fuera de alcance: **$60.000/hora**, con mínimo facturable de 1 hora.

**Alcance específico de Telar Casa.** Aquí el desborde de alcance es más probable que en web, porque el cliente sigue comprando dispositivos después de la entrega. Define desde la cotización:

- **Número exacto de dispositivos** incluidos en la integración. Dispositivo adicional: **$40.000** cada uno.
- **Número exacto de automatizaciones** incluidas. Automatización adicional: **$60.000** cada una.
- Los dispositivos deben ser **compatibles con Home Assistant** y estar en la lista de compras entregada. Integrar un equipo fuera de esa lista se cotiza aparte, y si no existe integración disponible, **no se puede hacer** — eso no es un incumplimiento tuyo.
- **Un dashboard** por proyecto. Vistas adicionales se cotizan.
- Rediseño completo del dashboard después de aprobado: alcance nuevo.

### 12.3 No incluido salvo mención expresa

**En todos los servicios**
- Redacción de textos y contenido
- Fotografía y video de producto
- Licencias de imágenes, fuentes o plugins de pago
- Traducciones
- Registro y renovación de dominio (se cotiza aparte)
- Publicidad pagada y gestión de redes sociales
- Capacitación presencial más allá de una sesión de entrega

**Específicamente en Telar Casa**
- Enchufes, sensores, bombillas, cerraduras, cámaras y equipos UniFi
- **Instalación física de cualquier tipo**: cablear, atornillar, montar, perforar
- **Obra eléctrica.** No se hace, no se supervisa, no se recomienda personal. En Colombia las instalaciones eléctricas están reguladas (RETIE) y requieren personal certificado. Este límite es absoluto: si el cliente insiste, se contrata un electricista por su cuenta.
- Suscripciones de terceros (Nabu Casa, Alexa, servicios en la nube de UniFi) salvo mención expresa en el plan de mantenimiento
- Reparación o reemplazo de dispositivos del cliente
- Configuración del router o de la red del cliente, salvo que se haya cotizado la integración UniFi
- Soporte por fallas de internet, energía eléctrica o servicios de terceros

### 12.4 Plazos

- El cronograma corre desde la recepción del anticipo **y** del contenido inicial completo.
- Si el cliente demora la entrega de contenido o de aprobaciones, **el cronograma se pausa** y se reanuda al recibirlos.
- Demoras del cliente superiores a 30 días permiten reagendar el proyecto según disponibilidad.

### 12.5 Entrega, garantía y propiedad

- **Garantía de 30 días** desde la entrega para corrección de errores atribuibles al desarrollo, sin costo.
- La garantía no cubre: cambios de contenido, funcionalidad nueva, fallas del hosting o de servicios de terceros, ni modificaciones hechas por el cliente o por terceros.
- **La propiedad del código se transfiere al cliente con el pago final.** Antes de eso, el trabajo permanece bajo licencia del desarrollador.
- El dominio y el hosting se registran **a nombre del cliente**. Es su activo, no el tuyo.
- Entrega incluye: repositorio, credenciales, una sesión de capacitación de 1 hora y documentación básica.

### 12.6 Cancelación y mora

- Cancelación por parte del cliente: el anticipo no es reembolsable. El trabajo ejecutado hasta la fecha se factura proporcionalmente.
- Pagos con mora superior a 15 días facultan la suspensión del servicio previo aviso.
- Cancelación por parte del desarrollador: se reembolsa la porción no ejecutada.

### 12.7 Mantenimiento

- Los planes se contratan por mínimo 6 meses.
- Las horas incluidas no son acumulables entre meses.
- Fuera del plan de mantenimiento, no hay soporte gratuito después de los 30 días de garantía.
- **Telar Casa sin mantenimiento:** al terminar el proyecto se revoca todo acceso remoto y se confirma por escrito. Home Assistant requiere actualizaciones periódicas; sin plan, el sistema queda bajo responsabilidad del cliente. Adviértelo por escrito al cierre.
- Reactivar el soporte después de una suspensión tiene costo de reconexión: **$150.000**.

### 12.8 Cláusulas específicas de Telar Casa

- **Cuentas a nombre del cliente.** Nabu Casa, UniFi, Alexa y correo del sistema se crean con datos del cliente. Telar recibe acceso administrativo, nunca propiedad.
- **Acceso remoto.** Se define por escrito qué acceso conserva Telar tras la entrega y por cuánto tiempo. Sin plan de mantenimiento, el acceso se revoca al cierre.
- **Confidencialidad indefinida** sobre todo lo que Telar observe en el sistema del cliente. Sobrevive al fin del contrato.
- **No acceso a grabaciones** salvo solicitud del cliente o necesidad técnica documentada.
- **Dependencia de terceros.** Cambios de precio, API o funciones en Home Assistant, Nabu Casa, Alexa o UniFi no son responsabilidad de Telar. La adaptación se cotiza como alcance nuevo.
- **Requisitos mínimos del sitio del cliente:** internet estable y energía eléctrica. Se recomienda UPS para la Raspberry. Sin estas condiciones el sistema no funciona y no constituye falla del servicio.
- **Limitación de responsabilidad.** El sistema no sustituye alarma monitoreada, vigilancia privada ni póliza de seguros (§11.6).
- **Acuerdo de tratamiento de datos** firmado cuando el proyecto incluya cámaras o control de acceso (§11.5).

---

## 13. Checklist previo al lanzamiento

**Técnico**
- [ ] Lighthouse ≥ 90 en las cuatro categorías, medido en móvil
- [ ] Probado en Chrome Android y Safari iOS reales, no solo en el emulador
- [ ] **Checklist responsive de §4.8 aprobado en cada página**
- [ ] **Sin desbordamiento horizontal a 360px** (script de §4.8)
- [ ] **Revisión cruzada de arquitectura** hecha por la otra persona (§3.3)
- [ ] **Puntero personalizado desactivado en táctil** (`pointer: coarse` no carga el script)
- [ ] **`prefers-reduced-motion` devuelve el cursor nativo** y desactiva todas las secuencias
- [ ] **Los inputs conservan su cursor de texto**
- [ ] **El texto del hero es legible en el primer fotograma**, antes de que termine el tejido
- [ ] **JS de móvil bajo 30 KB comprimido**
- [ ] Animaciones solo sobre `transform` y `opacity` — verificado en el panel Performance
- [ ] `:focus-visible` intacto en todos los elementos interactivos
- [ ] Meta tags únicos por página (title, description, canonical)
- [ ] Open Graph e imagen de previsualización verificados **enviando el link por WhatsApp**
- [ ] `sitemap.xml` y `robots.txt` generados
- [ ] Schema.org `LocalBusiness` en el home y `Organization` en `/nosotros`
- [ ] Sin enlaces rotos
- [ ] 404 personalizado
- [ ] Favicon **simplificado** de §18.6 (no el logo completo: a 32px se vuelve mancha)
- [ ] `apple-touch-icon.png` 180×180 sobre fondo sólido `#0C1826` — iOS no admite transparencia
- [ ] Imagen Open Graph 1200×630 creada y verificada mandando el link por WhatsApp

**Seguridad**
- [ ] securityheaders.com con calificación A
- [ ] HTTPS forzado
- [ ] 2FA en GitHub, hosting y registrador de dominio
- [ ] `npm audit` sin vulnerabilidades altas o críticas
- [ ] Sin claves en el repositorio

**Legal**
- [ ] Las 4 páginas legales publicadas, **revisadas por abogado** y enlazadas en el footer
- [ ] **Leyenda "No somos responsables de IVA"** en `/precios`, en el footer y en el formato de cotización
- [ ] Bloque de identificación (nombre, NIT/CC, ciudad, contacto)
- [ ] Precios con la condición de IVA correcta
- [ ] Licencias de fuentes e imágenes verificadas
- [ ] Autorización escrita para cada caso del portafolio
- [ ] **`/nosotros` sin afirmaciones no verificables** — cero cifras de proyectos o años de experiencia inventados
- [ ] **Autorización de cada integrante** para publicar su foto, nombre y rol
- [ ] **Acuerdo de confidencialidad firmado** por cada integrante con acceso a sistemas de clientes
- [ ] **Página de domótica revisada palabra por palabra contra §11.6** — ninguna promesa de "seguridad"
- [ ] **Descargo de responsabilidad de domótica visible** en `/servicios/domotica`
- [ ] **Garantía y retracto del hardware verificados con un abogado** antes de publicar precios de la Raspberry Pi
- [ ] Distinción clara entre `/servicios/tags-rutinas` y `/servicios/domotica`, con enlaces cruzados

**Comercial**
- [ ] Todos los enlaces de WhatsApp probados desde un celular
- [ ] Mensajes prellenados distintos por página y por nivel de domótica
- [ ] Botón flotante visible sin tapar contenido
- [ ] Analítica instalada y registrando eventos de clic en WhatsApp, **segmentados por línea**
- [ ] Lista de compras de dispositivos compatibles lista para enviar (documento aparte)

**Plantillas que necesitas antes de la primera venta de domótica**
- [ ] Cotización con líneas separadas de hardware y servicio
- [ ] Acuerdo de tratamiento de datos (para proyectos con cámaras o control de acceso)
- [ ] Acta de entrega con número de serie de la Raspberry y confirmación de recibido
- [ ] Lista de compras de dispositivos por nivel
- [ ] Contrato de mantenimiento

---

## 14. Plan de desarrollo

| Fase | Entregable |
|---|---|
| **1** | Setup Astro + Tailwind + **Preact**, **capas de §3.2**, hooks base (`useMediaQuery`, `usePrefiereMenosMovimiento`), tokens, tipografías, **Cursor**, `TablaPrecios`, Layout base, Header, Footer, services de WhatsApp |
| **2** | Home completo: tejido del hero, revelados al scroll, **las 4 cards de segmento** con barrido |
| **3** | **`/servicios/domotica`** (la página de mayor valor) + `/servicios/desarrollo-web` |
| **4** | Las 5 páginas de Telar Tag + `/como-funciona` |
| **5** | `/nosotros`, las 4 páginas de segmento, `/precios`, `/contacto`, `/portafolio` |
| **6** | Las 4 páginas legales, headers de seguridad, SEO técnico, schema |
| **7** | Analítica, auditoría Lighthouse, pruebas en dispositivos reales, despliegue |

Los textos de todas las páginas están en §18: no hay que redactar nada durante el desarrollo, solo maquetar.

**Por qué domótica va antes que NFC:** es el ticket más alto y el único con ingreso recurrente. Si el sitio se demora, prefieres tener viva la página que trae proyectos de $1.430.000 con mensualidad, no la que trae pedidos de $45.000.

**Nota sobre el portafolio:** constrúyelo desde la fase 5 aunque solo tengas dos ejemplos propios — tu propia casa automatizada es un caso perfectamente válido, con fotos del dashboard. Rellenar una grilla existente toma minutos; inventarla con afán a los tres meses nunca sale bien.

---

## 15. Recursos

**Desarrollo**
- Documentación de Astro — docs.astro.build
- Tailwind CSS v4 — tailwindcss.com/docs
- Verificador de headers — securityheaders.com
- Contraste de color — webaim.org/resources/contrastchecker
- Previsualización de Open Graph — opengraph.xyz
- Fuentes — fontsource.org
- Optimizar SVG — jakearchibald.github.io/svgomg
- Curvas de easing — easings.net y cubic-bezier.com
- Depuración de animaciones — panel Animations de Chrome DevTools

**Domótica**
- Documentación de Home Assistant — home-assistant.io/docs
- Catálogo de integraciones (verifica compatibilidad antes de recomendar un dispositivo) — home-assistant.io/integrations
- Foro de la comunidad — community.home-assistant.io
- Documentación de UniFi — help.ui.com

---

## 16. Qué hacer ahora

Pasos en orden. Cada uno se apoya en el anterior.

### Paso 1 — Crear el proyecto

**macOS / Linux / Git Bash**
```bash
bash setup-telar.sh
```

**Windows (PowerShell)**
```powershell
npm create astro@latest telar -- --template minimal --typescript strict --install --git
cd telar
.\setup-telar.ps1
```

> **Nota para Windows.** La barra invertida `\` al final de línea es continuación de bash y **no funciona en PowerShell** — allá el carácter es la comilla invertida `` ` ``. Si copian un comando de varias líneas del documento, péguenlo en una sola línea o usen el script `.ps1`. Si Windows bloquea el script: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.

Crea el proyecto, instala las dependencias, arma la estructura de carpetas de §3.2 y deja configurados `astro.config.mjs` y Prettier.

**Después, obligatorio:** abrir `astro.config.mjs` y cambiar `site` por el dominio real. Si queda `telar.co` sin ser suyo, el sitemap y las URL canónicas apuntan a otro lado.

### Paso 2 — Crear los archivos base, en este orden

| # | Archivo | De dónde sale |
|---|---|---|
| 1 | `src/styles/global.css` | §4.7 — tokens de color y movimiento |
| 2 | `src/lib/constantes.ts` | §9 — datos de Telar |
| 3 | `src/lib/whatsapp.ts` | §9 — enlaces y mensajes |
| 4 | `public/logo-telar.svg` | §4.7 |
| 5 | `src/components/marca/LogoTelar.astro` | §4.7 |
| 6 | `src/hooks/useMediaQuery.ts` + `usePrefiereMenosMovimiento.ts` | §3.3 |
| 7 | `src/hooks/useCursorTelar.ts` + `src/components/islas/Cursor.tsx` | §3.3, §4.5 |
| 8 | `src/hooks/useRevelar.ts` | §3.3 |
| 9 | `src/hooks/useTejido.ts` + `TejidoHero` | §3.3, §4.7 |
| 10 | `src/layouts/Base.astro` | Importa `global.css`, las fuentes, monta `<Cursor client:media="..." />` |

El orden importa por dos razones: `TejidoHero` y `Cursor` dependen de los tokens de `global.css` —si los creas antes no se ve nada y vas a pensar que el componente está roto— y los hooks de animación dependen de `usePrefiereMenosMovimiento`, que va primero.

### Paso 3 — Verificar antes de seguir

Levanta `npm run dev` y comprueba estas cinco cosas. Si alguna falla, párate y arréglala.

- [ ] El logo del header se ve, y al pasar el mouse los nodos crecen
- [ ] El puntero funciona, y **desaparece** al activar "reducir movimiento" en el sistema operativo
- [ ] En la pestaña Network de un móvil emulado, **el bundle del cursor no aparece**
- [ ] Los hilos del hero se dibujan completos, sin cortarse a media línea (si se cortan, revisa `--largo`)
- [ ] El titular del hero es legible **antes** de que termine el tejido
- [ ] En un celular real no hay cursor personalizado y el sitio se ve bien

### Paso 4 — Construir las páginas

Sigue el orden de §14. Domótica primero: es el ticket alto con mensualidad.

---

## 17. Índice rápido

| Busco… | Sección |
|---|---|
| Comandos de instalación | §16, paso 1 |
| Arquitectura por capas | §3 |
| Catálogo de hooks | §3.3 |
| Preact vs React (y por qué) | §3.1 |
| Responsive y puntos de quiebre | §4.8 |
| Tokens de color y movimiento | §4.1, §4.3 |
| Código del logo y componentes | §4.7 |
| Cómo funciona el puntero | §4.5 |
| Especificación de cada animación | §4.4 |
| Roles del equipo | §6.3 |
| Precios de todo | §8 |
| Enlaces de WhatsApp | §9 |
| Reglas de seguridad de domótica | §10.4 |
| Cálculo del IVA | §11.3 |
| Qué nunca escribir en la página de domótica | §11.6 |
| Condiciones de pago y alcance | §12 |
| Textos de cada página | §18 |
| Qué falta por resolver | §19 |

---

## 18. Textos listos para publicar

Copia y pega. Ajusta lo que suene ajeno a su voz, pero **no cambies las cláusulas marcadas como obligatorias**: están ahí por §11.6.

### 18.1 Home

**Hero**

> Cruzamos los hilos de tu negocio
>
> Páginas web, tarjetas NFC y automatización para casa y oficina. Somos dos desarrolladores en Bogotá y hacemos el proceso completo: diseño, código, base de datos, pagos y mantenimiento.
>
> `[Hablemos por WhatsApp]`  `[Ver qué hacemos]`

**Las cuatro puertas**

> **Para profesionales**
> Deja de repartir papel
> Tarjeta NFC con tu perfil, o el portafolio web que llevas dos años posponiendo.
> *desde $45.000* →
>
> **Para empresas**
> Pon tu negocio a funcionar
> Sitio web, tienda en línea, panel para administrar todo, carta digital para tus mesas.
> *desde $550.000* →
>
> **Para creadores**
> Que te encuentren de un toque
> Llaveros y pulseras NFC que abren tus redes. Portafolio web para mostrar tu trabajo.
> *desde $30.000* →
>
> **Para tu casa**
> Que tu casa haga cosas sola
> Automatización con Home Assistant. Luces, sensores, cámaras y rutinas, configurado a distancia.
> *desde $70.000* →

**Cómo funciona**

> **01 · Hablamos.** Nos cuentas qué necesitas. Te decimos de una si podemos hacerlo. Sin costo.
> **02 · Cotizamos.** Alcance detallado, precio cerrado, fecha de entrega. Por escrito.
> **03 · Construimos.** Ves avances reales, no un mes de silencio.
> **04 · Entregamos.** Todo queda a tu nombre. Y seguimos ahí si nos necesitas.

**Objeciones (acordeón)**

> **¿Mi celular sirve para NFC?**
> Casi todos los celulares desde 2015 lo tienen. En iPhone funciona desde el 7 en adelante, sin instalar nada. En Android está en Ajustes › Conexiones. Si el tuyo no lo tiene, todas nuestras tarjetas traen un código QR de respaldo.
>
> **¿Puedo cambiar el enlace después?**
> Sí. El chip guarda una dirección, no el contenido. Cambias a dónde apunta las veces que quieras.
>
> **¿Se daña la tarjeta?**
> El PVC aguanta agua, sol y el bolsillo. El chip no tiene batería: se alimenta del celular cuando lo acercas, así que no se descarga.
>
> **¿Tengo que estar en Bogotá?**
> Para desarrollo web y automatización, no: trabajamos con todo el país de forma remota. Para tarjetas y hardware coordinamos envío.
>
> **¿Cuánto se demoran?**
> Una landing, una semana. Un sitio corporativo, tres o cuatro. Una instalación de domótica, entre dos y cinco días desde que llega tu equipo.

**Cierre**

> ¿Hablamos?
> Cuéntanos qué necesitas. La primera conversación no cuesta nada y te decimos con franqueza si podemos ayudarte.
> `[Escribir por WhatsApp]`

---

### 18.2 `/nosotros`

**Hero**

> Somos Telar
>
> Un telar cruza hilos sueltos hasta que se vuelven tela. Hacemos lo mismo con la tecnología de tu negocio: la página web, los tags NFC, la casa o la oficina automatizada. Piezas que solas no son gran cosa, y juntas cambian cómo funciona todo.
>
> Dos desarrolladores en Bogotá. Trabajas con nosotros, no con un ejecutivo de cuenta.

**El equipo** — usar las dos cards de §6.3, seguidas de:

> Los dos hacemos el trabajo completo. Tu proyecto lo lleva una sola persona de principio a fin —sin entregas a medias ni explicar dos veces lo mismo— y si esa persona no está disponible, la otra entra sin que tú lo notes.

**Cómo trabajamos** — los 5 pasos de §6.3.

**Qué no hacemos**

> - **No hacemos instalaciones eléctricas.** La programación y la integración son nuestras; el cableado lo hace un electricista certificado.
> - **No vendemos lo que no necesitas.** Si un sitio de una página te sirve, te cotizamos un sitio de una página.
> - **No prometemos primer lugar en Google.** Nadie puede. Sí dejamos tu sitio técnicamente preparado para posicionar.
> - **No desaparecemos después de entregar.** Y si prefieres irte con otro proveedor, te entregamos todo sin trabas: es tuyo.
> - **No cobramos por cotizar.** La primera conversación siempre es gratis.

**Dónde estamos**

> Bogotá, Colombia. La automatización la configuramos de forma remota, así que trabajamos con clientes en cualquier ciudad. Para tarjetas NFC y hardware coordinamos envío.

---

### 18.3 `/servicios/domotica` — la página más importante del sitio

> **Regla de redacción:** ninguna promesa de seguridad. Revisar contra la tabla de §11.6 antes de publicar.

**Hero**

> Que tu casa haga cosas sola
>
> Automatización con Home Assistant. Luces que se apagan cuando sales, alertas cuando alguien llega, la oficina que se enciende antes que tú. Lo configuramos a distancia y te llega listo para enchufar.
>
> `[Cotizar por WhatsApp]`   *Desde $830.000 · Instalación remota*

**El problema**

> Compraste un bombillo inteligente, un enchufe de otra marca y un sensor de otra. Cada uno con su app. Ninguno se habla con el otro.
>
> Home Assistant los junta a todos en un solo lugar y te deja crear reglas entre ellos: *si el sensor de la puerta se abre después de las 10 p.m., enciende la luz del pasillo y mándame una foto.*
>
> Corre en un equipo tuyo, en tu casa. No depende de que una empresa mantenga su servicio en línea.

**Cómo funciona (todo remoto)**

> **01 · Hablamos** de qué quieres automatizar. Sin costo.
> **02 · Te mandamos la lista de compras**: exactamente qué dispositivos comprar, dónde y cuánto cuestan. Los compras tú, a tu nombre.
> **03 · Preparamos tu equipo.** Te llega una Raspberry Pi configurada. La enchufas al router y ya.
> **04 · Configuramos a distancia.** Conectamos tus dispositivos y programamos las automatizaciones. Entre dos y cinco días.
> **05 · Te entregamos** el sistema andando, con una sesión para enseñarte a usarlo. Todas las cuentas a tu nombre.

**Los tres niveles** — usar las tablas de §8.7 completas.

**Qué incluye y qué no** — usar la tabla de §8.7. Va completa y visible, no escondida en letra pequeña.

**Preguntas frecuentes**

> **¿Tienen que venir a mi casa?**
> No. Todo el trabajo es remoto. Lo único físico que recibes es la Raspberry Pi, ya configurada.
>
> **¿Quién compra los dispositivos?**
> Tú, con la lista que te damos. Así pagas el precio de tienda sin sobrecosto nuestro, y las garantías quedan a tu nombre.
>
> **¿Y si se va la luz o el internet?**
> Los dispositivos locales siguen respondiendo, pero las automatizaciones que dependen de internet se pausan hasta que vuelva. Recomendamos una UPS pequeña para la Raspberry.
>
> **¿Puedo controlar todo por voz?**
> Sí, desde el nivel Intermedio, integrando con Alexa.
>
> **¿Puedo ver mi casa desde el trabajo?**
> Sí, con Nabu Casa, que es el acceso remoto oficial de Home Assistant. Nunca abrimos puertos en tu router: es la práctica que deja los sistemas expuestos.
>
> **¿Qué pasa si dejo de pagar el mantenimiento?**
> El sistema sigue funcionando. Lo que pierdes son las actualizaciones, los respaldos y el soporte. Te avisamos por escrito y revocamos nuestro acceso.
>
> **¿Ustedes pueden ver mis cámaras?**
> No entramos a tus grabaciones salvo que tú lo pidas o haya una necesidad técnica que te documentamos. Todas las cuentas quedan a tu nombre y firmamos un acuerdo de confidencialidad.

**Descargo — OBLIGATORIO, visible, no en letra diminuta**

> Este sistema de automatización no sustituye un sistema de alarma monitoreada, un servicio de vigilancia privada ni una póliza de seguros. Su funcionamiento depende de energía eléctrica, conexión a internet y de servicios de terceros (Home Assistant, Nabu Casa, UniFi, Alexa). Telar no se hace responsable por pérdidas, daños o incidentes derivados de fallas en cualquiera de estos elementos.

**Cierre**

> Cuéntanos qué te gustaría que hiciera tu casa
> Te decimos si se puede, cuánto cuesta y qué necesitas comprar. Sin compromiso.
> `[Escribir por WhatsApp]`

---

### 18.4 Las cuatro páginas de segmento

Cada una necesita contenido propio o Google las trata como duplicadas (§7.3). Estructura común: hero → el problema en su lenguaje → qué le ofrecemos → precio de entrada → FAQ propia → CTA.

**`/para/profesionales`**

> **Tu tarjeta de papel termina en la basura**
> El 88% de las tarjetas impresas se botan en una semana. Una tarjeta NFC no: la persona acerca el celular, guarda tus datos y te tiene para siempre.
> *Tarjeta NFC con perfil digital desde $85.000 · Portafolio web desde $1.200.000*

Enfoque: abogados, médicos, arquitectos, contadores, agentes inmobiliarios. Objeción principal: *"¿se ve serio?"* — resuélvanla con fotos del PVC negro mate.

**`/para/empresas`**

> **Tu negocio funcionando, no solo tu página**
> Sitio web, tienda en línea y un panel donde administras productos, pedidos y clientes sin depender de nadie. Y si quieres, la carta digital de tus mesas y la oficina automatizada.
> *Sitio corporativo desde $1.900.000 · Panel de administración desde $3.500.000*

Enfoque: pymes, restaurantes, tiendas. Objeción principal: *"¿voy a poder manejarlo yo?"* — resuélvanla mostrando el panel y la sesión de capacitación.

**`/para/creadores`**

> **Un toque y están en tu perfil**
> Llaveros, pulseras y pines que abren tu Instagram, tu TikTok o tu tienda. Para vender en ferias, conciertos y mercados sin dictar tu usuario en voz alta.
> *Merchandising NFC desde $30.000 · Portafolio web desde $1.200.000*

Enfoque: artistas, músicos, fotógrafos, tatuadores. Objeción principal: *"¿lo puedo vender a mis seguidores?"* — sí, y ahí hay negocio para ustedes por volumen.

**`/para/tu-casa`**

> **Que tu casa haga cosas sola**
> Ver §18.3 y reutilizar el hero. Esta página es la puerta corta a `/servicios/domotica`, no un duplicado: aquí van escenas concretas de vida diaria, allá la especificación técnica.

---

### 18.5 `src/layouts/Base.astro`

```astro
---
import '../styles/global.css';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import Cursor from '../components/ui/Cursor.astro';
import { NEGOCIO } from '../lib/constantes';

interface Props {
  titulo: string;
  descripcion: string;
  imagen?: string;
  noindex?: boolean;
}

const { titulo, descripcion, imagen = '/og-default.png', noindex = false } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
const og = new URL(imagen, Astro.site);

const schema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: NEGOCIO.nombre,
  description: 'Desarrollo web, productos NFC y automatización con Home Assistant en Bogotá.',
  url: NEGOCIO.url,
  telephone: `+${NEGOCIO.telefono}`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bogotá',
    addressRegion: 'Bogotá D.C.',
    addressCountry: 'CO',
  },
  areaServed: { '@type': 'Country', name: 'Colombia' },
  priceRange: '$$',
};
---

<!doctype html>
<html lang="es-CO">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <title>{titulo} · {NEGOCIO.nombre}</title>
    <meta name="description" content={descripcion} />
    <link rel="canonical" href={canonical} />
    {noindex && <meta name="robots" content="noindex, nofollow" />}

    <!-- Sin esto, cada link que mandes por WhatsApp muestra la portada genérica -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={NEGOCIO.nombre} />
    <meta property="og:title" content={titulo} />
    <meta property="og:description" content={descripcion} />
    <meta property="og:image" content={og} />
    <meta property="og:url" content={canonical} />
    <meta property="og:locale" content="es_CO" />
    <meta name="twitter:card" content="summary_large_image" />

    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="theme-color" content="#0C1826" />

    <script type="application/ld+json" set:html={JSON.stringify(schema)} />
  </head>

  <body>
    <a href="#contenido" class="salto">Saltar al contenido</a>
    <Cursor />
    <slot name="header" />
    <main id="contenido"><slot /></main>
    <slot name="footer" />
    <script>
      import '../scripts/revelar.js';
    </script>
  </body>
</html>

<style>
  .salto {
    position: absolute;
    left: -9999px;
    background: var(--color-oro);
    color: var(--color-abismo);
    padding: 0.75rem 1.25rem;
    z-index: 10000;
  }
  .salto:focus {
    left: 1rem;
    top: 1rem;
  }
</style>
```

**La imagen Open Graph es lo que más se descuida y lo que más cuesta.** 1200×630 px, con el logo y el titular de la página. Sin ella, cada link que manden por WhatsApp aparece sin previsualización.

### 18.6 `public/favicon.svg`

A 32px el logo completo se vuelve una mancha. Esta versión conserva solo el aro, una barra y tres nodos, con trazos más gruesos y nodos más grandes. Se adapta a modo claro y oscuro sola:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260">
  <style>
    .estructura { stroke: #1B2F47; }
    @media (prefers-color-scheme: dark) { .estructura { stroke: #E8EDF3; } }
  </style>
  <g fill="none" stroke-linecap="round">
    <circle class="estructura" cx="130" cy="130" r="100" stroke-width="16"/>
    <line class="estructura" x1="130" y1="52" x2="130" y2="208" stroke-width="16"/>
    <circle cx="203" cy="57" r="26" fill="#E1B366"/>
    <circle cx="52" cy="198" r="26" fill="#E1B366"/>
    <circle cx="230" cy="130" r="22" fill="#42818F"/>
  </g>
</svg>
```

Para `apple-touch-icon.png` (180×180) exporten esta misma versión sobre fondo `#0C1826` sólido — iOS no admite transparencia y le pone fondo blanco.

### 18.7 Páginas legales: esqueleto

> **Esto son borradores para que un abogado los revise, no para publicar tal cual.** Cada bloque marca qué información deben completar.

**`/legal/datos-personales`** — Política de Tratamiento (Ley 1581 de 2012)

1. Identificación del responsable: razón social, NIT, dirección, correo, teléfono
2. Finalidades del tratamiento: responder cotizaciones, prestar el servicio contratado, facturar, enviar información sobre el proyecto
3. Derechos del titular: conocer, actualizar, rectificar, suprimir y revocar la autorización
4. Procedimiento para ejercerlos: canal de contacto y plazos de respuesta
5. Vigencia de la política y de las bases de datos
6. **Bloque específico de Telar Casa:** tratamiento de video e imágenes cuando el proyecto incluye cámaras, y el papel de Telar como encargado (§11.5)

**`/legal/privacidad`** — Aviso de privacidad
Versión corta y legible de lo anterior, más: qué recolectan en el sitio (si usan Umami o Plausible, prácticamente nada), qué terceros intervienen (hosting, analítica) y cómo contactarlos.

**`/legal/terminos`** — Términos y condiciones
Condiciones de uso · alcance de los servicios · condiciones de pago (§12.1) · alcance nuevo (§12.2) · exclusiones (§12.3) · garantía de 30 días (§12.5) · propiedad del código · **limitación de responsabilidad de domótica (§11.6)** · ley aplicable y jurisdicción: Colombia.

**`/legal/cookies`**
Solo si terminan usando Google Analytics. Con Umami o Plausible pueden omitir esta página y explicarlo en el aviso de privacidad — es más honesto y una página menos que mantener.

**Footer de identificación** — obligatorio en todas las páginas (Estatuto del Consumidor):

```
Telar — [Razón social]
NIT / C.C. [número]
Bogotá D.C., Colombia
WhatsApp: +57 301 183 6458 · contacto@telar.co
Precios en pesos colombianos. No somos responsables de IVA.
```

---

## 19. 

Imagen de Whattsapp: planeacion\images\whattsapp.png
Logo:planeacion\images\logo.png
