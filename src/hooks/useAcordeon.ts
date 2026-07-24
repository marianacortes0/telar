import { useState, useCallback } from 'preact/hooks';

export function useAcordeon(permitirVarios = false) {
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  const alternar = useCallback(
    (id: string) => {
      setAbiertos((prev) => {
        const s = new Set(permitirVarios ? prev : []);
        if (prev.has(id)) s.delete(id);
        else s.add(id);
        return s;
      });
    },
    [permitirVarios]
  );

  return { abiertos, alternar, estaAbierto: (id: string) => abiertos.has(id) };
}
