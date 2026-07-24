import { useMenuMovil } from '../../hooks/useMenuMovil';
import { createPortal } from 'preact/compat';
import type { EnlaceNav } from '../../lib/navegacion';

interface Props {
  enlaces: EnlaceNav[];
  whatsapp: string;
}

export default function MenuMovil({ enlaces, whatsapp }: Props) {
  const { abierto, alternar, cerrar } = useMenuMovil();

  // El panel se renderiza en <body> (portal): así su `position: fixed` es
  // relativo al viewport y no queda atrapado por el `backdrop-filter` del header.
  const panel = (
    <div id="menu-panel" class="panel" role="dialog" aria-modal="true" aria-label="Menú">
      <nav class="panel-nav">
        {enlaces.map((e) =>
          e.hijos ? (
            <div class="panel-grupo" key={e.href}>
              <a class="panel-grupo-titulo" href={e.href} onClick={cerrar}>
                {e.label}
              </a>
              {e.hijos.map((h) => (
                <a class="panel-sub" key={h.href} href={h.href} onClick={cerrar}>
                  {h.label}
                </a>
              ))}
            </div>
          ) : (
            <a class="panel-leaf" key={e.href} href={e.href} onClick={cerrar}>
              {e.label}
            </a>
          )
        )}
      </nav>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        class="btn-oro"
        onClick={cerrar}
      >
        Hablemos por WhatsApp
      </a>
    </div>
  );

  return (
    <div class="menu-movil">
      <button
        type="button"
        class="menu-boton"
        aria-expanded={abierto}
        aria-controls="menu-panel"
        aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        onClick={alternar}
      >
        <span class={`hamburguesa ${abierto ? 'abierto' : ''}`} aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {abierto && typeof document !== 'undefined'
        ? createPortal(panel, document.body)
        : null}
    </div>
  );
}
