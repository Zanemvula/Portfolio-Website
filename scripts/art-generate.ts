/**
 * Optional: paint scenes with the OpenAI Images API instead of ChatGPT.
 * Writes the same files you would save by hand (art/<key>/full.png and each
 * layer), so `npm run art:process` works the same either way.
 *
 *   npm run art:generate -- chatly            # master painting + layers for one scene
 *   npm run art:generate -- --full-only       # skip the layer cut-outs
 *   npm run art:generate -- --dry-run         # print prompts, call nothing
 *   npm run art:generate -- --force           # repaint even if art/<key>/full.png exists
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
const todo = scenes.filter((s) => has('force') || !existsSync(join(INBOX, s.key, 'full.png')));

if (has('dry-run')) {
  for (const s of todo) {
    console.log(`\n# ${s.key}/full.png\n${masterPrompt(s)}`);
    if (!has('full-only')) for (const l of s.layers) console.log(`\n# ${s.key}/${l.id}.png\n${layerPrompt(s, l)}`);
  }
  process.exit(0);
}
if (todo.length === 0) {
  console.log('Every selected scene already has art/<key>/full.png (use --force to repaint).');
  process.exit(0);
}
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set (environment or .env).');
  process.exit(1);
}

const client = new OpenAI();
let failed = 0;

for (const s of todo) {
  const dir = join(INBOX, s.key);
  mkdirSync(dir, { recursive: true });
  const size = SIZE[s.format].api;
  try {
    process.stdout.write(`${s.key}/full … `);
    const full = await client.images.generate({ model: MODEL, prompt: masterPrompt(s), size, quality: 'high', n: 1, output_format: 'png' });
    const b64 = full.data?.[0]?.b64_json;
    if (!b64) throw new Error('no image returned');
    writeFileSync(join(dir, 'full.png'), Buffer.from(b64, 'base64'));
    console.log('done');

    if (has('full-only')) continue;
    for (const l of s.layers) {
      process.stdout.write(`${s.key}/${l.id} … `);
      const edit = await client.images.edit({
        model: MODEL,
        image: await toFile(createReadStream(join(dir, 'full.png')), 'full.png', { type: 'image/png' }),
        prompt: layerPrompt(s, l),
        size,
        quality: 'high',
        background: l.transparent ? 'transparent' : 'opaque',
        input_fidelity: 'high',
        output_format: 'png',
      });
      const lb64 = edit.data?.[0]?.b64_json;
      if (!lb64) throw new Error('no image returned');
      writeFileSync(join(dir, `${l.id}.png`), Buffer.from(lb64, 'base64'));
      console.log('done');
    }
  } catch (err) {
    failed += 1;
    console.log(`failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
process.exit(failed ? 1 : 0);
