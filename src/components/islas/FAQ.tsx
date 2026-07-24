import { useAcordeon } from '../../hooks/useAcordeon';

export interface ItemFAQ {
  id: string;
  pregunta: string;
  respuesta: string;
}

interface Props {
  items: ItemFAQ[];
}

export default function FAQ({ items }: Props) {
  const { alternar, estaAbierto } = useAcordeon(false);

  return (
    <div class="faq">
      {items.map((item) => {
        const abierto = estaAbierto(item.id);
        return (
          <div class={`faq-item ${abierto ? 'abierto' : ''}`} key={item.id}>
            <h3 class="faq-cabecera">
              <button
                type="button"
                class="faq-boton"
                aria-expanded={abierto}
                aria-controls={`faq-${item.id}`}
                onClick={() => alternar(item.id)}
              >
                <span>{item.pregunta}</span>
                <span class="faq-signo" aria-hidden="true">
                  {abierto ? '−' : '+'}
                </span>
              </button>
            </h3>
            {abierto && (
              <div id={`faq-${item.id}`} class="faq-respuesta" role="region">
                <p>{item.respuesta}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
