/**
 * Generates painting PNGs with the OpenAI Images API from each project's
 * `painting.prompt` frontmatter and each craft's prompt in skills.json.
 *
 *   npm run paintings:generate                 # everything not yet published at its revision
 *   npm run paintings:generate -- chatly       # specific keys
 *   npm run paintings:generate -- --force      # regenerate even if cached/published
 *   npm run paintings:generate -- --dry-run    # print the prompts, no API calls
 *
 * Reads OPENAI_API_KEY from the environment or .env. The key is never printed.
 * Output: .cache/paintings/<key>-r<revision>.png (+ .json provenance). Not committed.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';
import { CACHE, args, baseName, housePrompt, loadItems, readManifest } from './lib/paintings';

const MODEL = process.env.PAINTING_MODEL ?? 'gpt-image-1';
const { keys, has } = args();
const force = has('force');
const dryRun = has('dry-run');

if (existsSync('.env')) process.loadEnvFile('.env');

const manifest = readManifest();
const items = loadItems().filter((i) => keys.length === 0 || keys.includes(i.key));
const unknown = keys.filter((k) => !items.some((i) => i.key === k));
if (unknown.length) {
  console.error(`Unknown painting keys: ${unknown.join(', ')}`);
  process.exit(1);
}

const todo = items.filter((item) => {
  if (force) return true;
  if (manifest[item.key]?.revision === item.revision) return false;
  return !existsSync(join(CACHE, `${baseName(item)}.png`));
});

if (todo.length === 0) {
  console.log('Nothing to generate — every painting is cached or published at its current revision.');
  process.exit(0);
}

if (dryRun) {
  for (const item of todo) console.log(`\n# ${baseName(item)} (${item.size})\n${housePrompt(item)}`);
  process.exit(0);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set (environment or .env).');
  process.exit(1);
}

const client = new OpenAI();
mkdirSync(CACHE, { recursive: true });

let failed = 0;
for (const item of todo) {
  const prompt = housePrompt(item);
  process.stdout.write(`Painting ${baseName(item)} with ${MODEL}… `);
  try {
    const res = await client.images.generate({ model: MODEL, prompt, size: item.size, quality: 'high', n: 1, output_format: 'png' });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error('no image in response');
    writeFileSync(join(CACHE, `${baseName(item)}.png`), Buffer.from(b64, 'base64'));
    writeFileSync(
      join(CACHE, `${baseName(item)}.json`),
      `${JSON.stringify({ key: item.key, revision: item.revision, model: MODEL, size: item.size, prompt, generated: new Date().toISOString() }, null, 2)}\n`,
    );
    console.log('done');
  } catch (err) {
    failed += 1;
    console.log(`failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

process.exit(failed ? 1 : 0);
