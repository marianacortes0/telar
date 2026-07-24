// Genera og-default.png (1200×630) y apple-touch-icon.png (180×180) desde el
// logo de Telar, sobre fondo sólido #0C1826 (iOS no admite transparencia).
// Uso: node scripts/generar-imagenes.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const publico = join(raiz, 'public');

const emblema = (stroke) => `
  <g fill="none" stroke-linecap="round">
    <g stroke-width="2.2" opacity="0.9">
      <line x1="42.8" y1="73.4" x2="203.5" y2="56.5" stroke="#42818F"/>
      <line x1="42.8" y1="73.4" x2="206.1" y2="200.9" stroke="#42818F"/>
      <line x1="51.5" y1="198.2" x2="234" y2="130" stroke="#42818F"/>
      <line x1="234" y1="130" x2="206.1" y2="200.9" stroke="#42818F"/>
      <line x1="51.5" y1="198.2" x2="203.5" y2="56.5" stroke="#E1B366"/>
      <line x1="203.5" y1="56.5" x2="206.1" y2="200.9" stroke="#E1B366"/>
    </g>
    <g stroke="${stroke}" stroke-width="7">
      <line x1="104" y1="44" x2="104" y2="216"/>
      <line x1="130" y1="44" x2="130" y2="216"/>
      <line x1="156" y1="44" x2="156" y2="216"/>
      <line x1="46" y1="130" x2="214" y2="130"/>
    </g>
    <circle cx="130" cy="130" r="104" stroke="${stroke}" stroke-width="7"/>
    <g stroke="${stroke}" stroke-width="4">
      <circle cx="42.8" cy="73.4" r="13" fill="#42818F"/>
      <circle cx="203.5" cy="56.5" r="13" fill="#E1B366"/>
      <circle cx="234" cy="130" r="13" fill="#42818F"/>
      <circle cx="206.1" cy="200.9" r="13" fill="#42818F"/>
      <circle cx="51.5" cy="198.2" r="13" fill="#E1B366"/>
    </g>
  </g>`;

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0C1826"/>
  <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="#24405E" stroke-width="2"/>
  <g transform="translate(110,185) scale(1.0)">${emblema('#E8EDF3')}</g>
  <text x="440" y="300" font-family="sans-serif" font-size="104" font-weight="700" fill="#E8EDF3">Telar</text>
  <text x="446" y="366" font-family="sans-serif" font-size="36" fill="#8FA3BC">Cruzamos los hilos de tu negocio</text>
  <text x="446" y="432" font-family="monospace" font-size="24" letter-spacing="4" fill="#6FB3C0">WEB · NFC · DOMÓTICA · BOGOTÁ</text>
</svg>`;

const icono = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260">
  <rect width="260" height="260" fill="#0C1826"/>
  <g fill="none" stroke-linecap="round" transform="translate(130,130) scale(0.8) translate(-130,-130)">
    <circle cx="130" cy="130" r="100" stroke="#E8EDF3" stroke-width="16"/>
    <line x1="130" y1="52" x2="130" y2="208" stroke="#E8EDF3" stroke-width="16"/>
    <circle cx="203" cy="57" r="26" fill="#E1B366"/>
    <circle cx="52" cy="198" r="26" fill="#E1B366"/>
    <circle cx="230" cy="130" r="22" fill="#42818F"/>
  </g>
</svg>`;

await sharp(Buffer.from(og)).png().toFile(join(publico, 'og-default.png'));
await sharp(Buffer.from(icono)).resize(180, 180).png().toFile(join(publico, 'apple-touch-icon.png'));
await sharp(Buffer.from(icono)).resize(32, 32).png().toFile(join(publico, 'favicon-32.png'));
await sharp(Buffer.from(icono)).resize(16, 16).png().toFile(join(publico, 'favicon-16.png'));

console.log('✓ og-default.png, apple-touch-icon.png y favicon-{32,16}.png generados en public/');
