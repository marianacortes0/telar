import { useState, useEffect, useCallback } from 'preact/hooks';

export function useMenuMovil() {
  const [abierto, setAbierto] = useState(false);

  const cerrar = useCallback(() => setAbierto(false), []);
  const alternar = useCallback(() => setAbierto((v) => !v), []);

  // Bloquear el scroll del fondo y cerrar con Escape
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
    };
    addEventListener('keydown', alTeclear);

    return () => {
      document.body.style.overflow = previo;
      removeEventListener('keydown', alTeclear);
    };
  }, [abierto, cerrar]);

  return { abierto, alternar, cerrar };
}
