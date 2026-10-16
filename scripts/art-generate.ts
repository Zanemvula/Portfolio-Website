/**
 * Optional: paint scenes with the OpenAI Images API instead of ChatGPT.
 * Writes the same files you would save by hand (art/<key>/full.png and each
 * layer), so `npm run art:process` works the same either way.
 *
 *   npm run art:generate -- chatly            # master painting + layers for one scene
 *   npm run art:generate -- --full-only       # skip the layer cut-outs
 *   npm run art:generate -- --dry-run         # print prompts, call nothing
 *   npm run art:generate -- --force           # repaint even if the files exist (otherwise a re-run resumes)
 *
 * OPENAI_API_KEY comes from the environment or .env and is never printed.
 * PAINTING_MODEL overrides the model (default gpt-image-1).
 */
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI, { toFile } from 'openai';
import { INBOX, SIZE, args, layerPrompt, loadScenes, masterPrompt } from './lib/art';

const MODEL = process.env.PAINTING_MODEL || 'gpt-image-1';
const { keys, has } = args();
if (existsSync('.env')) process.loadEnvFile('.env');

const scenes = loadScenes().filter((s) => keys.length === 0 || keys.includes(s.key));
const unknown = keys.filter((k) => !scenes.some((s) => s.key === k));
if (unknown.length) {
  console.error(`Unknown scene keys: ${unknown.join(', ')}. See ART.md for the list.`);
  process.exit(1);
}

/** Every image to make, skipping files that already exist (so an interrupted run resumes). */
const jobs = scenes.flatMap((s) => {
  const full = { s, id: 'full', layer: undefined as (typeof s.layers)[number] | undefined };
  const cuts = has('full-only') ? [] : s.layers.map((layer) => ({ s, id: layer.id, layer }));
  return [full, ...cuts].filter((j) => has('force') || !existsSync(join(INBOX, j.s.key, `${j.id}.png`)));
});

if (has('dry-run')) {
  for (const j of jobs) console.log(`\n# ${j.s.key}/${j.id}.png\n${j.layer ? layerPrompt(j.s, j.layer) : masterPrompt(j.s)}`);
  console.log(`\n${jobs.length} images would be created with ${MODEL}.`);
  process.exit(0);
}
if (jobs.length === 0) {
  console.log('Nothing to paint: every selected image already exists in art/ (use --force to repaint).');
  process.exit(0);
}
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set (environment or .env).');
  process.exit(1);
}

console.log(`Painting ${jobs.length} images with ${MODEL} (high quality)…`);
const client = new OpenAI({ maxRetries: 4, timeout: 10 * 60 * 1000 });
const failedScenes = new Set<string>();
let done = 0;

for (const j of jobs) {
  const dir = join(INBOX, j.s.key);
  mkdirSync(dir, { recursive: true });
  const size = SIZE[j.s.format].api;
  const label = `[${++done}/${jobs.length}] ${j.s.key}/${j.id}`;
  if (failedScenes.has(j.s.key)) {
    console.log(`${label} skipped (its master painting failed)`);
    continue;
  }
  const started = Date.now();
  try {
    let b64: string | undefined;
    if (!j.layer) {
      const res = await client.images.generate({ model: MODEL, prompt: masterPrompt(j.s), size, quality: 'high', n: 1, output_format: 'png' });
      b64 = res.data?.[0]?.b64_json;
    } else {
      const fullPath = join(dir, 'full.png');
      if (!existsSync(fullPath)) throw new Error('full.png is missing');
      const res = await client.images.edit({
        model: MODEL,
        image: await toFile(createReadStream(fullPath), 'full.png', { type: 'image/png' }),
        prompt: layerPrompt(j.s, j.layer),
        size,
        quality: 'high',
        background: j.layer.transparent ? 'transparent' : 'opaque',
        input_fidelity: 'high',
        output_format: 'png',
      });
      b64 = res.data?.[0]?.b64_json;
    }
    if (!b64) throw new Error('no image returned');
    writeFileSync(join(dir, `${j.id}.png`), Buffer.from(b64, 'base64'));
    console.log(`${label} done in ${Math.round((Date.now() - started) / 1000)}s`);
  } catch (err) {
    if (!j.layer) failedScenes.add(j.s.key);
    console.log(`${label} FAILED: ${err instanceof Error ? err.message : String(err)}`);
  }
}

const failed = jobs.length - [...jobs].filter((j) => existsSync(join(INBOX, j.s.key, `${j.id}.png`))).length;
console.log(failed ? `\n${failed} images failed — re-run the same command to retry just those.` : '\nAll images painted. Next: npm run art:process');
process.exit(failed ? 1 : 0);
