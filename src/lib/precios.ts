/**
 * Catálogo de precios: única fuente de precios del sitio (v8, §5).
 *
 * Cada nivel guarda el valor del Excel (modo Plantilla: horas × tarifa + 10 %
 * de gestión + equipos, SIN IVA). El precio publicado se calcula aquí:
 *   1. se suma el IVA del 19 % (Telar Web no lo lleva: Art. 476 num. 21 ET);
 *   2. se redondea hacia arriba a los mil pesos.
 * Si cambia el Excel, se cambia solo el número `excel` de este archivo.
 */

export const IVA = 0.19;
export const DESCUENTO_COMBO = 0.05;

export type NombreNivel = 'Esencial' | 'Conectado' | 'Integral';

export interface NivelCatalogo {
  nivel: NombreNivel;
  incluye: string;
  /** Valor del Excel, sin IVA. */
  excel: number;
}

export interface LineaCatalogo {
  nombre: string;
  /** false solo para Telar Web (excluido de IVA). */
  conIva: boolean;
  niveles: NivelCatalogo[];
}

/** Excel + IVA (si aplica), redondeado hacia arriba a los mil pesos. */
export function precioPublicado(excel: number, conIva: boolean): number {
  const bruto = Math.round(conIva ? excel * (1 + IVA) : excel);
  return Math.ceil(bruto / 1000) * 1000;
}

/** $1.452.000: separador de miles con punto, sin decimales. */
export function formatoCOP(valor: number): string {
  return `$${Math.round(valor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** Precio publicado de un nivel concreto de una línea. */
export function precioNivel(linea: LineaCatalogo, nivel: NombreNivel): number {
  const n = linea.niveles.find((x) => x.nivel === nivel);
  if (!n) throw new Error(`${linea.nombre} no tiene nivel ${nivel}`);
  return precioPublicado(n.excel, linea.conIva);
}

/** El "Desde" más bajo de una o varias líneas (hero de cada rama). */
export function desdeMinimo(...lineas: LineaCatalogo[]): number {
  return Math.min(
    ...lineas.flatMap((l) => l.niveles.map((n) => precioPublicado(n.excel, l.conIva))),
  );
}

export const LEYENDA = {
  conIva: 'Precios en pesos colombianos con IVA incluido. El valor final se define en la cotización.',
  sinIva:
    'Precios en pesos colombianos. Excluido de IVA (Art. 476 num. 21 ET). El valor final se define en la cotización.',
} as const;

// ─── Telar Tag: un catálogo por tipo ─────────────────────────────────────────

export const TAG = {
  tarjetas: {
    nombre: 'Tarjetas de presentación',
    conIva: true,
    niveles: [
      { nivel: 'Esencial', incluye: 'Tarjeta NFC grabada con su enlace', excel: 35_560 },
      { nivel: 'Conectado', incluye: 'Tarjeta NFC + perfil digital diseñado', excel: 134_560 },
      { nivel: 'Integral', incluye: 'Equipo: 5 tarjetas, cada una con su perfil digital', excel: 488_000 },
    ],
  },
  restaurante: {
    nombre: 'Restaurante (menú y Google Maps)',
    conIva: true,
    niveles: [
      { nivel: 'Esencial', incluye: 'Google Maps: placa de mesa que lleva a dejar la reseña', excel: 71_960 },
      { nivel: 'Conectado', incluye: 'Menú: carta digital + 5 placas de mesa', excel: 544_600 },
      {
        nivel: 'Integral',
        incluye: 'Completo: carta digital + 10 placas + WiFi sin contraseña + reseñas en Google Maps',
        excel: 825_200,
      },
    ],
  },
  merchandising: {
    nombre: 'Llaveros, pulseras y pines',
    conIva: true,
    niveles: [
      { nivel: 'Esencial', incluye: '1 pieza NFC: llavero, pulsera o pin', excel: 28_560 },
      { nivel: 'Conectado', incluye: 'Lote de 20 piezas con el mismo enlace', excel: 402_240 },
    ],
  },
  rutinas: {
    nombre: 'Stickers de rutinas del celular',
    conIva: true,
    niveles: [
      { nivel: 'Esencial', incluye: '1 sticker con su rutina configurada', excel: 34_400 },
      { nivel: 'Conectado', incluye: 'Kit de 5 stickers con rutinas', excel: 172_000 },
      { nivel: 'Integral', incluye: 'Kit de 10 stickers con rutinas', excel: 344_000 },
    ],
  },
  empaques: {
    nombre: 'Etiquetas para productos',
    conIva: true,
    niveles: [
      { nivel: 'Esencial', incluye: 'Lote de 20 etiquetas con su enlace', excel: 202_240 },
      {
        nivel: 'Conectado',
        incluye: 'Lote de 100 etiquetas + página de aterrizaje del producto',
        excel: 1_222_400,
      },
    ],
  },
} satisfies Record<string, LineaCatalogo>;

// ─── Ramas con una sola tabla de niveles ─────────────────────────────────────

export const CASA: LineaCatalogo = {
  nombre: 'Telar Casa',
  conIva: true,
  niveles: [
    {
      nivel: 'Esencial',
      incluye: 'Raspberry Pi 4 (4 GB) + luces, tablero y automatizaciones',
      excel: 2_024_618,
    },
    {
      nivel: 'Conectado',
      incluye:
        'Raspberry Pi 4 (8 GB) + luces, sensores, tablero, automatizaciones, voz y acceso remoto',
      excel: 2_598_195,
    },
    { nivel: 'Integral', incluye: '+ cámaras con alertas e integración UniFi', excel: 3_654_195 },
  ],
};

export const OFFICE: LineaCatalogo = {
  nombre: 'Telar Office',
  conIva: true,
  niveles: [
    {
      nivel: 'Esencial',
      incluye: 'Raspberry Pi 4 (8 GB) + control de acceso con tarjeta NFC',
      excel: 1_858_995,
    },
    {
      nivel: 'Conectado',
      incluye: '+ reserva de salas y tablero de ocupación y accesos',
      excel: 3_416_595,
    },
    {
      nivel: 'Integral',
      incluye: '+ acceso en más puertas o sedes y luces y clima automatizados',
      excel: 4_683_795,
    },
  ],
};

export const WEB: LineaCatalogo = {
  nombre: 'Telar Web',
  conIva: false,
  niveles: [
    {
      nivel: 'Esencial',
      incluye: 'Landing: 1 página, celular, botón a WhatsApp, SEO básico y publicación',
      excel: 1_452_000,
    },
    {
      nivel: 'Conectado',
      incluye: 'Sitio de 4 a 10 páginas con diseño propio, blog y SEO',
      excel: 2_877_600,
    },
    {
      nivel: 'Integral',
      incluye: 'Sitio con panel de administración: base de datos, usuarios y roles',
      excel: 3_722_400,
    },
  ],
};

export const AI: LineaCatalogo = {
  nombre: 'Telar AI',
  conIva: true,
  niveles: [
    {
      nivel: 'Esencial',
      incluye: 'Asistente de WhatsApp con IA, entrenado con la información del negocio',
      excel: 1_848_000,
    },
    { nivel: 'Conectado', incluye: '+ agenda de citas y paso a un asesor', excel: 3_168_000 },
    { nivel: 'Integral', incluye: '+ segundo canal (web o Instagram)', excel: 4_224_000 },
  ],
};

export const FLOW: LineaCatalogo = {
  nombre: 'Telar Flow',
  conIva: true,
  niveles: [
    { nivel: 'Esencial', incluye: '1 proceso automatizado de 3 a 5 pasos', excel: 475_200 },
    { nivel: 'Conectado', incluye: '3 procesos + conexión con CRM, ERP o Sheets', excel: 2_376_000 },
    {
      nivel: 'Integral',
      incluye: '2 procesos complejos con condiciones + CRM + avisos por WhatsApp',
      excel: 4_039_200,
    },
  ],
};

export const MONITOR: LineaCatalogo = {
  nombre: 'Telar Monitor',
  conIva: true,
  niveles: [
    { nivel: 'Esencial', incluye: 'Tablero de consumo en tiempo real (1 fuente)', excel: 1_188_000 },
    { nivel: 'Conectado', incluye: '+ tablero de ventas e indicadores', excel: 1_900_800 },
    { nivel: 'Integral', incluye: 'Varias fuentes o sedes en un solo tablero', excel: 3_088_800 },
  ],
};

export const TEAMS: LineaCatalogo = {
  nombre: 'Telar Teams',
  conIva: true,
  niveles: [
    { nivel: 'Esencial', incluye: 'Metas, puntos, rankings y panel de logros', excel: 2_006_400 },
    {
      nivel: 'Conectado',
      incluye: '+ app móvil y medición automática desde el CRM',
      excel: 4_408_800,
    },
    { nivel: 'Integral', incluye: '+ reportes por equipo o sede', excel: 5_121_600 },
  ],
};

// ─── Combos (§5.1): suma de lo publicado − 5 %, redondeado a los mil ─────────

export interface ParteCombo {
  nombre: string;
  /** Precio publicado de esta parte (ya con IVA si aplica). */
  precio: number;
}

export interface Combo {
  nombre: string;
  partes: ParteCombo[];
  /** Suma de las partes por separado. */
  separado: number;
  desde: number;
}

const combo = (nombre: string, ...partes: ParteCombo[]): Combo => {
  const separado = partes.reduce((suma, p) => suma + p.precio, 0);
  return {
    nombre,
    partes,
    separado,
    desde: Math.ceil(Math.round(separado * (1 - DESCUENTO_COMBO)) / 1000) * 1000,
  };
};

/** Cada combo vive en la página de su rama principal. */
export const COMBOS = {
  profesional: combo(
    'Profesional independiente',
    { nombre: 'Telar Web Esencial', precio: precioNivel(WEB, 'Esencial') },
    { nombre: '3 tarjetas con perfil digital', precio: 3 * precioNivel(TAG.tarjetas, 'Conectado') },
  ),
  negocioEnLinea: combo(
    'Negocio en línea',
    { nombre: 'Telar Web Esencial', precio: precioNivel(WEB, 'Esencial') },
    { nombre: 'Telar AI Esencial', precio: precioNivel(AI, 'Esencial') },
  ),
  oficina: combo(
    'Oficina Telar',
    { nombre: 'Telar Office Esencial', precio: precioNivel(OFFICE, 'Esencial') },
    { nombre: 'Telar Web Conectado', precio: precioNivel(WEB, 'Conectado') },
  ),
} as const;

// ─── Suscripción Telar (§5.2): una sola por cliente ──────────────────────────

const conIva = (v: number) => Math.round(v * (1 + IVA));

export const SUSCRIPCION = {
  negocios: conIva(250_000),
  /** Negocio que solo tiene Telar Web: excluido de IVA. */
  negociosSoloWeb: 250_000,
  hogares: conIva(80_000),
  /** Cuota del Plan Social, IVA incluido. */
  planSocial: 50_000,
} as const;

// ─── Plan Social · Telar para todos ──────────────────────────────────────────

export const PLAN_SOCIAL = {
  /** Parte de cada venta que financia los cupos. */
  porcentajeVentas: 0.05,
  implementacion: 0,
  mensualidad: SUSCRIPCION.planSocial,
} as const;
