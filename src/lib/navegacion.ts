export interface EnlaceNav {
  href: string;
  label: string;
  /** Submenú desplegable (header) o grupo (menú móvil). */
  hijos?: EnlaceNav[];
}

/** Footer — Telar Tag, Web y Casa (personas y pymes). */
export const NAV_SERVICIOS: EnlaceNav[] = [
  { href: '/servicios/tarjetas-nfc', label: 'Tarjetas NFC' },
  { href: '/servicios/menus-restaurantes', label: 'Menús para restaurantes' },
  { href: '/servicios/merchandising', label: 'Merchandising NFC' },
  { href: '/servicios/tags-rutinas', label: 'Tags de rutinas' },
  { href: '/servicios/packaging', label: 'Packaging' },
  { href: '/servicios/desarrollo-web', label: 'Desarrollo web' },
  { href: '/servicios/domotica', label: 'Domótica (Telar Casa)' },
];

/** Telar Empresas · automatización e IA (header y footer). */
export const NAV_EMPRESAS: EnlaceNav[] = [
  { href: '/servicios/telar-ai', label: 'Telar AI · agentes de IA' },
  { href: '/servicios/telar-flow', label: 'Telar Flow · automatización' },
  { href: '/servicios/telar-monitor', label: 'Telar Monitor · dashboards' },
  { href: '/servicios/telar-teams', label: 'Telar Teams · gamificación' },
  { href: '/servicios/telar-office', label: 'Telar Office · oficinas' },
];

/** Navegación principal (header y menú móvil). Dos grupos desplegables + enlaces. */
export const NAV_PRINCIPAL: EnlaceNav[] = [
  { href: '/#servicios', label: 'Servicios', hijos: NAV_SERVICIOS },
  { href: '/#empresas', label: 'Empresas · IA', hijos: NAV_EMPRESAS },
  { href: '/precios', label: 'Precios' },
  { href: '/nosotros', label: 'Nosotros' },
];

export const NAV_EMPRESA: EnlaceNav[] = [
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/como-funciona', label: 'Cómo funciona' },
  { href: '/precios', label: 'Precios' },
  { href: '/portafolio', label: 'Portafolio' },
  { href: '/contacto', label: 'Contacto' },
];

export const NAV_LEGAL: EnlaceNav[] = [
  { href: '/legal/privacidad', label: 'Privacidad' },
  { href: '/legal/datos-personales', label: 'Tratamiento de datos' },
  { href: '/legal/terminos', label: 'Términos y condiciones' },
  { href: '/legal/cookies', label: 'Cookies' },
];
