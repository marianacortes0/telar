import { useState, useEffect } from 'preact/hooks';

export function useMediaQuery(consulta: string): boolean {
  const [coincide, setCoincide] = useState(false);

  useEffect(() => {
    const mq = matchMedia(consulta);
    setCoincide(mq.matches);
    const alCambiar = (e: MediaQueryListEvent) => setCoincide(e.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, [consulta]);

  return coincide;
}
