/**
 * Converts generated PNGs to AVIF + WebP at three widths (and a 1200×630 JPEG
 * share card for projects), uploads them to Cloud Storage with immutable
 * caching, then records them in content/paintings.json.
 *
 *   npm run paintings:process                  # convert only (inspect .cache/out/paintings)
 *   npm run paintings:process -- --upload      # convert, upload, update the manifest
 *
 * The manifest is only updated after a successful upload, so the site never
 * references an image that is not in the bucket.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { CACHE, OUT, WIDTHS, args, baseName, loadItems, readManifest, writeManifest } from './lib/paintings';

const BUCKET = process.env.PAINTINGS_BUCKET ?? 'ntsikagqiba-assets';
const { keys, has } = args();
const upload = has('upload');

const items = loadItems().filter((i) => (keys.length === 0 || keys.includes(i.key)) && existsSync(join(CACHE, `${baseName(i)}.png`)));
if (items.length === 0) {
  console.log('No generated PNGs to process. Run `npm run paintings:generate` first.');
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });

/** Share card: the painting hung on the oxblood wall inside a gold border. */
const shareCard = async (png: string, out: string) => {
  const painting = await sharp(png)
    .resize({ height: 540 })
    .extend({ top: 10, bottom: 10, left: 10, right: 10, background: '#c9a24a' })
    .extend({ top: 3, bottom: 3, left: 3, right: 3, background: '#7a5a1e' })
    .toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#3b100e' } })
    .composite([{ input: painting, gravity: 'centre' }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out);
};

const done: { key: string; revision: number; width: number; height: number; model: string; generated: string }[] = [];
const files: string[] = [];

for (const item of items) {
  const name = baseName(item);
  const png = join(CACHE, `${name}.png`);
  const meta = sharp(png);
  const { width = 0, height = 0 } = await meta.metadata();
  for (const w of WIDTHS) {
    const resized = sharp(png).resize({ width: Math.min(w, width) });
    const avif = join(OUT, `${name}-${w}.avif`);
    const webp = join(OUT, `${name}-${w}.webp`);
    await resized.clone().avif({ quality: 52, effort: 6 }).toFile(avif);
    await resized.clone().webp({ quality: 76, effort: 6 }).toFile(webp);
    files.push(avif, webp);
  }
  if (item.kind === 'project') {
    const og = join(OUT, `${name}-og.jpg`);
    await shareCard(png, og);
    files.push(og);
  }
  const provenance = existsSync(join(CACHE, `${name}.json`))
    ? (JSON.parse(readFileSync(join(CACHE, `${name}.json`), 'utf8')) as { model?: string; generated?: string })
    : {};
  done.push({
    key: item.key,
    revision: item.revision,
    width,
    height,
    model: provenance.model ?? 'unknown',
    generated: (provenance.generated ?? new Date().toISOString()).slice(0, 10),
  });
  console.log(`Processed ${name} (${width}×${height})`);
}

if (!upload) {
  console.log(`\nWrote ${files.length} files to ${OUT}. Re-run with --upload to publish them.`);
  process.exit(0);
}

const TYPES: Record<string, string> = { avif: 'image/avif', webp: 'image/webp', jpg: 'image/jpeg' };
for (const [ext, type] of Object.entries(TYPES)) {
  const batch = files.filter((f) => f.endsWith(`.${ext}`));
  if (!batch.length) continue;
  const res = spawnSync(
    'gcloud',
    ['storage', 'cp', ...batch, `gs://${BUCKET}/paintings/`, `--cache-control=public, max-age=31536000, immutable`, `--content-type=${type}`],
    { stdio: 'inherit' },
  );
  if (res.status !== 0) {
    console.error(`Upload of .${ext} files failed; manifest not updated.`);
    process.exit(1);
  }
}

const manifest = readManifest();
for (const d of done) {
  manifest[d.key] = { revision: d.revision, width: d.width, height: d.height, widths: WIDTHS, model: d.model, generated: d.generated };
}
writeManifest(manifest);
console.log(`\nUploaded ${files.length} files to gs://${BUCKET}/paintings/ and updated content/paintings.json.`);
