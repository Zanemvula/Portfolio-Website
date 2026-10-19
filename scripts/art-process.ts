/**
 * Turns the PNGs in art/<key>/ into web images and publishes them.
 *
 *   npm run art:process                     # preview: writes public/paintings/ + content/paintings.local.json (both gitignored)
 *   npm run art:process -- chatly hero      # only these scenes
 *   npm run art:process -- --upload         # publish to gs://ntsikagqiba-assets/paintings/ and update content/paintings.json
 *   npm run art:process -- --from-gcs --upload   # CI: fetch originals from gs://…/originals/ first
 *   npm run art:process -- --no-align       # skip re-seating cut-outs on the master painting
 *
 * Each layer becomes AVIF + WebP at three widths; each landscape scene also
 * gets a 1200×630 share card. Files are named <key>-r<revision>-<layer>-<width>.<ext>,
 * so they are safe to cache forever. The manifest is only updated after files
 * exist where it points.
 */
import { existsSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { MIN_CORRELATION, centralCoverage, cutFromMaster, findPlacement, overlapShare, patchBackdrop, placedAlpha } from './lib/align';
import { INBOX, OUT, LOCAL_PUBLIC, MANIFEST, LOCAL_MANIFEST, SIZE, WIDTHS, args, loadScenes, readManifest, writeManifest, type SceneItem } from './lib/art';

const BUCKET = process.env.ART_BUCKET ?? 'ntsikagqiba-assets';
const { keys, has } = args();
const upload = has('upload');
const align = !has('no-align');

const gcloud = (argv: string[]) => {
  const res = spawnSync('gcloud', argv, { stdio: 'inherit' });
  if (res.status !== 0) throw new Error(`gcloud ${argv.slice(0, 3).join(' ')} failed`);
};

if (has('from-gcs')) {
  mkdirSync(INBOX, { recursive: true });
  const list = spawnSync('gcloud', ['storage', 'ls', `gs://${BUCKET}/originals/`], { encoding: 'utf8' });
  if (list.status === 0 && list.stdout.trim()) gcloud(['storage', 'cp', '-r', `gs://${BUCKET}/originals/*`, INBOX]);
  else console.log(`No originals in gs://${BUCKET}/originals/.`);
}

const scenes = loadScenes().filter((s) => keys.length === 0 || keys.includes(s.key));
const unknown = keys.filter((k) => !scenes.some((s) => s.key === k));
if (unknown.length) {
  console.error(`Unknown scene keys: ${unknown.join(', ')}. See ART.md for the list.`);
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

/** Flatten the layers (or use full) into a 1200×630 card: the painting on the gallery wall. */
const shareCard = async (layers: Map<string, Buffer>, out: string) => {
  const ids = [...layers.keys()];
  const flat = layers.has('full')
    ? layers.get('full')!
    : await sharp(layers.get(ids[0]!)!)
        .composite(ids.slice(1).map((id) => ({ input: layers.get(id)! })))
        .png()
        .toBuffer();
  const painting = await sharp(flat)
    .resize({ height: 520 })
    .extend({ top: 12, bottom: 12, left: 12, right: 12, background: '#c9a24a' })
    .extend({ top: 3, bottom: 3, left: 3, right: 3, background: '#7a5a1e' })
    .toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#3b100e' } })
    .composite([{ input: painting, gravity: 'centre' }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out);
};

const processed: { s: SceneItem; layers: string[]; og: boolean; width: number; height: number }[] = [];

for (const s of scenes) {
  const dir = join(INBOX, s.key);
  if (!existsSync(dir)) continue;
  const wanted = ['full', ...s.layers.map((l) => l.id)];
  const present = wanted.filter((id) => existsSync(join(dir, `${id}.png`)));
  const extra = readdirSync(dir).filter((f) => f.endsWith('.png') && !wanted.includes(f.replace(/\.png$/, '')));
  if (extra.length) console.warn(`  ${s.key}: ignoring ${extra.join(', ')} (not a layer of this scene)`);
  if (present.length === 0) continue;

  const { w, h } = SIZE[s.format];
  // Normalise every layer to the scene's canvas first, so the stack lines up even if
  // ChatGPT returned a different size (sharp applies only one resize per pipeline).
  const normalised = new Map<string, Buffer>();
  for (const id of present) {
    normalised.set(id, await sharp(join(dir, `${id}.png`)).resize(w, h, { fit: 'cover' }).png().toBuffer());
  }

  // Image models redraw cut-outs rather than cutting them; re-seat each one on the master painting.
  const master = normalised.get('full');
  if (align && master) {
    const masks: Buffer[] = [];
    for (const layer of s.layers.filter((l) => l.transparent && normalised.has(l.id))) {
      const cut = normalised.get(layer.id)!;
      const p = await findPlacement(master, cut, w, h);
      if (p && p.correlation >= MIN_CORRELATION) {
        const alpha = await placedAlpha(cut, p, w, h);
        // Two layers holding the same pixels would shear apart in parallax; keep the first.
        let duplicate = 0;
        for (const m of masks) duplicate = Math.max(duplicate, await overlapShare(alpha, m, w, h));
        if (duplicate > 0.3) {
          normalised.delete(layer.id);
          console.log(`  ${s.key}/${layer.id}: ${Math.round(duplicate * 100)}% already in an earlier cut-out; dropped`);
          continue;
        }
        normalised.set(layer.id, await cutFromMaster(master, alpha, w, h));
        masks.push(alpha);
        console.log(`  ${s.key}/${layer.id}: re-seated on the master (scale ${p.scale.toFixed(3)}, match ${p.correlation.toFixed(2)})`);
      } else if ((await centralCoverage(cut, w, h)) < 0.05) {
        console.log(`  ${s.key}/${layer.id}: not in the master; kept as edge framing`);
      } else {
        normalised.delete(layer.id);
        console.log(`  ${s.key}/${layer.id}: not in the master and covers the subject; dropped`);
      }
    }
    for (const layer of s.layers.filter((l) => !l.transparent && normalised.has(l.id))) {
      normalised.set(layer.id, await patchBackdrop(master, normalised.get(layer.id)!, masks, w, h));
    }
  }
  const published = [...normalised.keys()];

  for (const [id, buf] of normalised) {
    for (const width of WIDTHS[s.format]) {
      const name = `${s.key}-r${s.revision}-${id}-${width}`;
      await sharp(buf).resize({ width }).avif({ quality: 52, effort: 6 }).toFile(join(OUT, `${name}.avif`));
      await sharp(buf).resize({ width }).webp({ quality: 78, effort: 6, alphaQuality: 90 }).toFile(join(OUT, `${name}.webp`));
    }
  }
  const og = s.format === 'landscape';
  if (og) await shareCard(normalised, join(OUT, `${s.key}-r${s.revision}-og.jpg`));
  processed.push({ s, layers: published, og, width: w, height: h });
  console.log(`✓ ${s.key} r${s.revision}: ${published.join(', ')}`);
}

if (processed.length === 0) {
  console.log('Nothing to process. Put PNGs in art/<scene>/ (see ART.md).');
  process.exit(0);
}

const files = readdirSync(OUT);
const today = new Date().toISOString().slice(0, 10);
const entryFor = (p: (typeof processed)[number]) => ({
  revision: p.s.revision,
  width: p.width,
  height: p.height,
  widths: [...WIDTHS[p.s.format]],
  layers: p.layers,
  og: p.og,
  updated: today,
});

if (upload) {
  const TYPES: Record<string, string> = { avif: 'image/avif', webp: 'image/webp', jpg: 'image/jpeg' };
  for (const [ext, type] of Object.entries(TYPES)) {
    const batch = files.filter((f) => f.endsWith(`.${ext}`)).map((f) => join(OUT, f));
    if (batch.length) gcloud(['storage', 'cp', ...batch, `gs://${BUCKET}/paintings/`, '--cache-control=public, max-age=31536000, immutable', `--content-type=${type}`]);
  }
  const manifest = readManifest(MANIFEST);
  const local = readManifest(LOCAL_MANIFEST);
  for (const p of processed) {
    manifest[p.s.key] = entryFor(p);
    delete local[p.s.key];
  }
  writeManifest(MANIFEST, manifest);
  if (existsSync(LOCAL_MANIFEST)) writeManifest(LOCAL_MANIFEST, local);
  console.log(`\nPublished ${files.length} files to gs://${BUCKET}/paintings/ and updated content/paintings.json — commit it.`);
} else {
  mkdirSync(LOCAL_PUBLIC, { recursive: true });
  for (const f of files) copyFileSync(join(OUT, f), join(LOCAL_PUBLIC, f));
  const local = readManifest(LOCAL_MANIFEST);
  for (const p of processed) local[p.s.key] = entryFor(p);
  writeManifest(LOCAL_MANIFEST, local);
  console.log(`\nPreview ready: ${files.length} files in public/paintings/. Run \`npm run dev\` (or build) to see them. Add --upload to publish.`);
}
