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

  // Telar Empresas — automatización e IA (un mensaje por línea)
  ai:
    'Hola Telar, me interesa un agente de IA (Telar AI) para mi negocio. ¿Me orientan?',
  flow:
    'Hola Telar, quiero automatizar procesos de mi negocio con Telar Flow (n8n/Make).',
  monitor:
    'Hola Telar, me interesa monitorear consumo eléctrico o paneles solares con dashboards (Telar Monitor).',
  teams:
    'Hola Telar, me interesa gamificar a mi equipo de trabajo con Telar Teams.',
  office:
    'Hola Telar, me interesa automatizar mi oficina con Telar Office.',
} as const;
