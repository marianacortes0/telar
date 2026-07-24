import { useCursorTelar } from '../../hooks/useCursorTelar';

export default function Cursor() {
  const { nucleo, anillo, activo, presionado, visible } = useCursorTelar();

  const clases = ['cursor-anillo', activo && 'activo', presionado && 'presionado']
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        ref={anillo}
        class={clases}
        style={{ opacity: visible ? 1 : 0 }}
        aria-hidden="true"
      />
      <div
        ref={nucleo}
        class="cursor-nucleo"
        style={{ opacity: visible ? 1 : 0 }}
        aria-hidden="true"
      />
    </>
  );
}
