// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // TODO: confirmar que el dominio sea de Telar antes de publicar.
  // Necesario para URLs canónicas, Open Graph y el sitemap.
  site: 'https://telar.co',
  output: 'static',

  integrations: [
    preact({ compat: false }),
    mdx(),
    sitemap(),
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
