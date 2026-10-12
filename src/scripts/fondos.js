// Fondos ilustrados ([data-fondo]): la imagen y sus luces animadas aparecen
// juntas, con un fundido, solo cuando la imagen ya cargó. Así nunca se ven los
// brillos sueltos sobre un hueco vacío mientras la imagen llega.
// Sin JS no se agrega la clase .js y todo se muestra de una vez.
document.documentElement.classList.add('js');

for (const fondo of document.querySelectorAll('[data-fondo]')) {
  const img = fondo.querySelector('img');
  const listo = () => fondo.classList.add('cargado');
  if (!img || (img.complete && img.naturalWidth > 0)) {
    listo();
  } else {
    img.addEventListener('load', listo, { once: true });
    // Si la imagen falla, el fondo se queda oculto: mejor vacío que roto.
  }
}
