import { useMediaQuery } from './useMediaQuery';

/** Todo hook de animación debe consultarlo antes de mover algo. */
export function usePrefiereMenosMovimiento(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
