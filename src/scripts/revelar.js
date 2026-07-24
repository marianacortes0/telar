const objetivos = document.querySelectorAll('[data-revelar]');

if (objetivos.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('visible');
        io.unobserve(e.target); // una sola vez, nunca al volver a subir
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  objetivos.forEach((el) => io.observe(el));
} else {
  objetivos.forEach((el) => el.classList.add('visible'));
}
