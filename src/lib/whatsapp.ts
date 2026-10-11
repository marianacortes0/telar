import { NEGOCIO } from './constantes';

/** Genera un enlace de WhatsApp con mensaje prellenado. */
export function linkWhatsApp(mensaje: string): string {
  return `https://wa.me/${NEGOCIO.telefono}?text=${encodeURIComponent(mensaje)}`;
}

/** Mensajes por contexto: sabes desde qué página escribió. */
export const MENSAJES = {
  general: 'Hola Telar, vi su página y quiero más información.',
  cotizar: 'Hola Telar, quiero cotizar. Les cuento qué necesito:',

  // ACCESO
  tag: 'Hola Telar, me interesa Telar Tag (productos NFC). ¿Me orientan?',
  casa: 'Hola Telar, me interesa automatizar mi casa con Telar Casa. ¿Me orientan?',
  office: 'Hola Telar, me interesa automatizar mi oficina con Telar Office.',

  // ATENCIÓN
  web: 'Hola Telar, necesito una página web (Telar Web). ¿Podemos hablar del proyecto?',
  ai: 'Hola Telar, me interesa un asistente de WhatsApp con IA (Telar AI) para mi negocio.',

  // AUTOMATIZACIÓN
  flow: 'Hola Telar, quiero automatizar procesos de mi negocio con Telar Flow.',

  // DATOS
  monitor: 'Hola Telar, me interesa ver mi consumo en tiempo real con Telar Monitor.',
  teams: 'Hola Telar, me interesa gamificar a mi equipo de trabajo con Telar Teams.',

  // Telar para todos
  planSocial: 'Hola Telar, quiero saber si puedo acceder al Plan Social (Telar para todos).',

  // Nosotros: mensaje exacto del plan v8
  trabajar:
    'Hola, quiero trabajar con Telar. Mi área es: ____ y este es mi portafolio o GitHub: ____',
} as const;
