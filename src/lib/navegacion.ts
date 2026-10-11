export interface EnlaceNav {
  href: string;
  label: string;
  /** Submenú desplegable (header) o grupo (menú móvil). */
  hijos?: EnlaceNav[];
  /** Ícono Lucide (solo las ramas). */
  icono?: string;
}

export type IdCapa = 'acceso' | 'atencion' | 'automatizacion' | 'datos';

export interface Capa {
  id: IdCapa;
  nombre: string;
  lema: string;
  ramas: EnlaceNav[];
}

/** Las 4 capas de la ciudad inteligente y sus ramas (§2). Cada rama aparece una vez. */
export const CAPAS: Capa[] = [
  {
    id: 'acceso',
    nombre: 'Acceso',
    lema: 'Espacios que lo reconocen',
    ramas: [
      { href: '/telar-tag', label: 'Telar Tag', icono: 'lucide:nfc' },
      { href: '/telar-casa', label: 'Telar Casa', icono: 'lucide:house' },
      { href: '/telar-office', label: 'Telar Office', icono: 'lucide:building-2' },
    ],
  },
  {
    id: 'atencion',
    nombre: 'Atención',
    lema: 'Su negocio responde, aunque usted esté dormido',
    ramas: [
      { href: '/telar-web', label: 'Telar Web', icono: 'lucide:globe' },
      { href: '/telar-ai', label: 'Telar AI', icono: 'lucide:bot' },
    ],
  },
  {
    id: 'automatizacion',
    nombre: 'Automatización',
    lema: 'Procesos que se tejen solos',
    ramas: [{ href: '/telar-flow', label: 'Telar Flow', icono: 'lucide:workflow' }],
  },
  {
    id: 'datos',
    nombre: 'Datos',
    lema: 'Decisiones con números, no con corazonadas',
    ramas: [
      { href: '/telar-monitor', label: 'Telar Monitor', icono: 'lucide:gauge' },
      { href: '/telar-teams', label: 'Telar Teams', icono: 'lucide:trophy' },
    ],
  },
];

/** Las 8 ramas en orden de capa (footer). */
export const NAV_RAMAS: EnlaceNav[] = CAPAS.flatMap((c) => c.ramas);

export const NAV_TELAR: EnlaceNav[] = [
  { href: '/telar-para-todos', label: 'Telar para todos' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/cotizar', label: 'Cotizar' },
];

/** Navegación principal (header y menú móvil): una entrada por capa + páginas de Telar. */
export const NAV_PRINCIPAL: EnlaceNav[] = [
  ...CAPAS.map((c) => ({ href: `/#${c.id}`, label: c.nombre, hijos: c.ramas })),
  { href: '/telar-para-todos', label: 'Para todos' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/cotizar', label: 'Cotizar' },
];

export const NAV_LEGAL: EnlaceNav[] = [
  { href: '/legal/privacidad', label: 'Privacidad' },
  { href: '/legal/datos-personales', label: 'Tratamiento de datos' },
  { href: '/legal/terminos', label: 'Términos y condiciones' },
  { href: '/legal/plan-social', label: 'Plan Social' },
  { href: '/legal/cookies', label: 'Cookies' },
];
