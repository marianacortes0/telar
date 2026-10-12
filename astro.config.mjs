// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

import tailwindcss from '@tailwindcss/vite';
import { writeFile } from 'node:fs/promises';

// Rutas v7 → v8 (plan v8, §4): cada ruta vieja llega a un solo lugar.
const REDIRECCIONES = {
  '/servicios/tarjetas-nfc': '/telar-tag#tarjetas',
  '/servicios/menus-restaurantes': '/telar-tag#restaurante',
  '/servicios/merchandising': '/telar-tag#merchandising',
  '/servicios/tags-rutinas': '/telar-tag#rutinas',
  '/servicios/packaging': '/telar-tag#empaques',
  '/servicios/domotica': '/telar-casa',
  '/servicios/desarrollo-web': '/telar-web',
  // En v7 estas ramas ya existían bajo /servicios/
  '/servicios/telar-ai': '/telar-ai',
  '/servicios/telar-flow': '/telar-flow',
  '/servicios/telar-monitor': '/telar-monitor',
  '/servicios/telar-teams': '/telar-teams',
  '/servicios/telar-office': '/telar-office',
  // Páginas retiradas
  '/para/profesionales': '/',
  '/para/empresas': '/',
  '/para/creadores': '/',
  '/para/tu-casa': '/',
  '/precios': '/',
  '/portafolio': '/',
  '/como-funciona': '/cotizar',
  '/contacto': '/cotizar',
};

// En build estático Astro genera una página con meta refresh por cada ruta;
// el archivo _redirects hace que el hosting (Cloudflare Pages / Netlify)
// responda con un 301 real.
/** @type {import('astro').AstroIntegration} */
const redireccionesHosting = {
  name: 'telar-redirects',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const lineas = Object.entries(REDIRECCIONES).map(([de, a]) => `${de} ${a} 301`);
      await writeFile(new URL('_redirects', dir), `${lineas.join('\n')}\n`);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  // TODO: confirmar que el dominio sea de Telar antes de publicar.
  // Necesario para URLs canónicas, Open Graph y el sitemap.
  site: 'https://telar.co',
  output: 'static',

  redirects: Object.fromEntries(
    Object.entries(REDIRECCIONES).map(([de, a]) => [de, { status: 301, destination: a }]),
  ),

  integrations: [
    preact({ compat: false }),
    mdx(),
    // Fuera del sitemap: las rutas viejas (redirigen) y los borradores legales (noindex).
    sitemap({
      filter: (pagina) => {
        const ruta = new URL(pagina).pathname.replace(/\/$/, '');
        return !(ruta in REDIRECCIONES) && !ruta.startsWith('/legal/');
      },
    }),
    redireccionesHosting,
    // Solo carga los sets de iconos que se usan (Lucide vía @iconify-json/lucide).
    icon({ include: { lucide: ['*'] } }),
  ],

  // Prefetch de enlaces al pasar el cursor: navegación casi instantánea
  // sin descargar todo el sitio de golpe.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  // Minifica el HTML de salida.
  compressHTML: true,

  // Content-Security-Policy con hashes generados en build para los scripts y
  // estilos inline de Astro (hidratación de islas + estilos scoped). Se inyecta
  // como <meta http-equiv>. `style-src-attr 'unsafe-inline'` permite los
  // atributos style="--i:…" que usamos para el escalonado; el riesgo de un
  // atributo de estilo es mínimo frente a un script inline (que sí queda bloqueado).
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://analytics.umami.is",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ],
      // 'self' aplica a style-src-elem; 'unsafe-inline' solo a los atributos
      // style="--i:…" del escalonado (style-src-attr), no a elementos <style>.
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
      scriptDirective: { resources: ["'self'"] },
    },
  },

  build: {
    // Inlinea CSS pequeño en el <head> para evitar peticiones extra y
    // deja el CSS grande como archivo cacheable.
    inlineStylesheets: 'auto',
  },

  image: {
    // sharp es el servicio por defecto para astro:assets; explícito para claridad.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },

  vite: {
    // Tailwind CSS v4 se integra como plugin de Vite (no como integración de Astro).
    plugins: [tailwindcss()],
  },
});
