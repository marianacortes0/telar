import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * El puntero. La interpolación va por ref, no por estado:
 * meter la posición en useState dispararía 60 renders por segundo.
 */
export function useCursorTelar(retardo = 0.16) {
  const nucleo = useRef<HTMLDivElement>(null);
  const anillo = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(false);
  const [presionado, setPresionado] = useState(false);
  const [visible, setVisible] = useState(false);

  const pos = useRef({ mx: 0, my: 0, ax: 0, ay: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const SELECTOR = 'a, button, [role="button"], summary, [data-interactivo]';

    const alMover = (e: MouseEvent) => {
      const p = pos.current;
      p.mx = e.clientX;
      p.my = e.clientY;
      if (!visible) {
        p.ax = p.mx;
        p.ay = p.my;
        setVisible(true);
      }
    };

    const alEntrarEn = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(SELECTOR)) setActivo(true);
    };
    const alSalirDe = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(SELECTOR)) setActivo(false);
    };

    const bucle = () => {
      const p = pos.current;
      p.ax += (p.mx - p.ax) * retardo;
      p.ay += (p.my - p.ay) * retardo;
      if (nucleo.current)
        nucleo.current.style.transform = `translate3d(${p.mx}px, ${p.my}px, 0)`;
      if (anillo.current)
        anillo.current.style.transform = `translate3d(${p.ax}px, ${p.ay}px, 0)`;
      raf.current = requestAnimationFrame(bucle);
    };
    raf.current = requestAnimationFrame(bucle);

    addEventListener('mousemove', alMover, { passive: true });
    document.addEventListener('mouseover', alEntrarEn);
    document.addEventListener('mouseout', alSalirDe);
    const abajo = () => setPresionado(true);
    const arriba = () => setPresionado(false);
    const fuera = () => setVisible(false);
    addEventListener('mousedown', abajo);
    addEventListener('mouseup', arriba);
    document.addEventListener('mouseleave', fuera);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      removeEventListener('mousemove', alMover);
      document.removeEventListener('mouseover', alEntrarEn);
      document.removeEventListener('mouseout', alSalirDe);
      removeEventListener('mousedown', abajo);
      removeEventListener('mouseup', arriba);
      document.removeEventListener('mouseleave', fuera);
    };
  }, [retardo, visible]);

  return { nucleo, anillo, activo, presionado, visible };
}
