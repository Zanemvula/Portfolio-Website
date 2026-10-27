/**
 * One-off: renders public/og-default.jpg (1200×630) and public/apple-touch-icon.png
 * from SVG with sharp. Re-run after changing the brand marks:
 *   node scripts/make-static-assets.mjs
 */
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { join } from 'node:path';
import { tmpdir } from 'node:os';


// librsvg needs TrueType/OpenType files, so unwrap the Fontsource WOFF (v1) files
// into a temp dir and point fontconfig at it.
const woffToSfnt = (buf) => {
  const flavor = buf.readUInt32BE(4);
  const numTables = buf.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const [offset, compLength, origLength] = [buf.readUInt32BE(o + 4), buf.readUInt32BE(o + 8), buf.readUInt32BE(o + 12)];
    const raw = buf.subarray(offset, offset + compLength);
    tables.push({ tag: buf.readUInt32BE(o), checksum: buf.readUInt32BE(o + 16), data: compLength < origLength ? inflateSync(raw) : raw });
  }
  const pow = 2 ** Math.floor(Math.log2(numTables));
  const head = Buffer.alloc(12 + numTables * 16);
  head.writeUInt32BE(flavor, 0);
  head.writeUInt16BE(numTables, 4);
  head.writeUInt16BE(pow * 16, 6);
  head.writeUInt16BE(Math.log2(pow), 8);
  head.writeUInt16BE(numTables * 16 - pow * 16, 10);
  let offset = head.length;
  const chunks = [];
  tables.forEach((t, i) => {
    const r = 12 + i * 16;
    head.writeUInt32BE(t.tag, r);
    head.writeUInt32BE(t.checksum, r + 4);
    head.writeUInt32BE(offset, r + 8);
    head.writeUInt32BE(t.data.length, r + 12);
    const padded = Buffer.alloc((t.data.length + 3) & ~3);
    t.data.copy(padded);
    chunks.push(padded);
    offset += padded.length;
  });
  return Buffer.concat([head, ...chunks]);
};

const fontDir = mkdtempSync(join(tmpdir(), 'gallery-fonts-'));
for (const [pkg, files] of [
  ['@fontsource/cormorant-garamond', ['cormorant-garamond-latin-500-normal', 'cormorant-garamond-latin-500-italic']],
  ['@fontsource/cinzel', ['cinzel-latin-500-normal']],
]) {
  for (const f of files) {
    writeFileSync(join(fontDir, `${f}.ttf`), woffToSfnt(readFileSync(join('node_modules', pkg, 'files', `${f}.woff`))));
  }
}
const conf = join(fontDir, 'fonts.conf');
writeFileSync(
  conf,
  `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${fontDir}</dir><include ignore_missing="yes">/etc/fonts/fonts.conf</include><cachedir>${fontDir}</cachedir></fontconfig>`,
);
process.env.FONTCONFIG_FILE = conf;
const { default: sharp } = await import('sharp');

const damask = readFileSync('public/damask.svg', 'utf8').trim().replace(/^<svg[^>]*>|<\/svg>$/g, '');

const og = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="d" width="180" height="180" patternUnits="userSpaceOnUse">${damask}</pattern>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f1d98a"/><stop offset=".2" stop-color="#c9a24a"/><stop offset=".38" stop-color="#7a5a1e"/>
      <stop offset=".55" stop-color="#c9a24a"/><stop offset=".7" stop-color="#f1d98a"/><stop offset="1" stop-color="#7a5a1e"/>
    </linearGradient>
    <radialGradient id="v" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#3b100e"/>
  <rect width="1200" height="630" fill="url(#d)"/>
  <rect width="1200" height="630" fill="url(#v)"/>
  <rect x="150" y="70" width="900" height="490" fill="url(#g)"/>
  <rect x="164" y="84" width="872" height="462" fill="none" stroke="#fff3c4" stroke-opacity=".7" stroke-width="3" stroke-dasharray="2 6"/>
  <rect x="180" y="100" width="840" height="430" fill="#14110e"/>
  <rect x="180" y="100" width="840" height="430" fill="none" stroke="#5c4212" stroke-width="4"/>
  <text x="600" y="215" text-anchor="middle" font-family="Cinzel Medium" font-size="30" letter-spacing="9" fill="#c9a24a">THE GALLERY OF</text>
  <text x="600" y="330" text-anchor="middle" font-family="Cormorant Garamond Medium" font-size="112" fill="#f3e9d2">Ntsika Gqiba</text>
  <path d="M470 372h100M630 372h100" stroke="#c9a24a" stroke-width="1.5"/><path d="M600 364l8 8-8 8-8-8z" fill="#c9a24a"/>
  <text x="600" y="440" text-anchor="middle" font-family="Cinzel Medium" font-size="24" letter-spacing="5" fill="#cbbfa6">CLOUD &amp; SOFTWARE ENGINEER</text>
  <text x="600" y="478" text-anchor="middle" font-family="Cormorant Garamond Medium" font-style="italic" font-size="28" fill="#cbbfa6">AWS · Oracle Cloud · Google Cloud</text>
</svg>`;

mkdirSync('public', { recursive: true });
await sharp(Buffer.from(og)).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og-default.jpg');
await sharp(Buffer.from(readFileSync('public/favicon.svg'))).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('wrote public/og-default.jpg and public/apple-touch-icon.png');

/* ---- Brushstroke masks (alpha = paint) ---- */
let seed = 20261016;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

// Wipe: left third painted, right third bare, a dragged-bristle edge between.
{
  const strokes = [];
  for (let y = -10; y < 610; y += 5) {
    const len = 60 + rand() * 480; // tips stay inside the middle third (≤ x=1140 + displacement)
    const w = 3 + rand() * 12;
    strokes.push(`<line x1="560" y1="${y.toFixed(1)}" x2="${(600 + len).toFixed(1)}" y2="${(y + (rand() - 0.5) * 14).toFixed(1)}" stroke-width="${w.toFixed(1)}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="600" viewBox="0 0 1800 600">
    <defs><filter id="r" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.015 0.3" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="34"/></filter></defs>
    <g filter="url(#r)" fill="#fff" stroke="#fff" stroke-linecap="round"><rect x="-60" y="-60" width="680" height="720"/>${strokes.join('')}</g><rect x="0" y="0" width="560" height="600" fill="#fff"/></svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 70, alphaQuality: 60, effort: 6 }).toFile('public/brush-wipe.webp');
}

// Edge: a dry-brushed top edge for parchment sections laid over paintings.
{
  const strokes = [];
  for (let y = 14; y < 72; y += 2.5) {
    // Denser, longer strokes further down so the paint thickens into the solid band.
    const density = (y - 14) / 58;
    for (let x = -40; x < 1640; ) {
      const len = 20 + rand() * 220 * (0.4 + density);
      if (rand() < 0.35 + density * 0.6) {
        strokes.push(`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + len).toFixed(1)}" y2="${(y + (rand() - 0.5) * 3).toFixed(1)}" stroke-width="${(1.5 + rand() * 3.5).toFixed(1)}"/>`);
      }
      x += len * (0.6 + rand() * 0.9);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="96" viewBox="0 0 1600 96">
    <defs><filter id="r"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.5" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter></defs>
    <g filter="url(#r)" fill="#fff" stroke="#fff" stroke-linecap="round"><rect x="-20" y="60" width="1640" height="60"/>${strokes.join('')}</g>
    <rect x="0" y="72" width="1600" height="24" fill="#fff"/></svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 70, alphaQuality: 60, effort: 6 }).toFile('public/brush-edge.webp');
}
console.log('wrote public/brush-wipe.webp and public/brush-edge.webp');
