/** Shared helpers for the painting pipeline (generate → process → upload). */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

export const ROOT = process.cwd();
export const CACHE = join(ROOT, '.cache', 'paintings');
export const OUT = join(ROOT, '.cache', 'out', 'paintings');
export const MANIFEST = join(ROOT, 'content', 'paintings.json');
export const WIDTHS = [480, 768, 1024];

export interface PaintingItem {
  /** Manifest key and file prefix: project slug, or `craft-<id>`. */
  key: string;
  kind: 'project' | 'craft';
  prompt: string;
  revision: number;
  /** Portrait for the hall, square for the tondi. */
  size: '1024x1536' | '1024x1024';
}

export interface ManifestEntry {
  revision: number;
  width: number;
  height: number;
  widths: number[];
  model: string;
  generated: string;
}

export type Manifest = Record<string, ManifestEntry>;

const frontmatter = (file: string) => {
  const match = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  if (!match?.[1]) throw new Error(`${file}: no frontmatter`);
  return parse(match[1]) as { painting?: { prompt?: string; revision?: number } };
};

export const loadItems = (): PaintingItem[] => {
  const dir = join(ROOT, 'content', 'projects');
  const projects = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const fm = frontmatter(join(dir, f));
      if (!fm.painting?.prompt) throw new Error(`${f}: painting.prompt is missing`);
      return {
        key: f.replace(/\.md$/, ''),
        kind: 'project' as const,
        prompt: fm.painting.prompt,
        revision: fm.painting.revision ?? 1,
        size: '1024x1536' as const,
      };
    });
  const crafts = (
    JSON.parse(readFileSync(join(ROOT, 'content', 'skills.json'), 'utf8')) as {
      id: string;
      painting: { prompt: string; revision?: number };
    }[]
  ).map((c) => ({
    key: `craft-${c.id}`,
    kind: 'craft' as const,
    prompt: c.painting.prompt,
    revision: c.painting.revision ?? 1,
    size: '1024x1024' as const,
  }));
  return [...projects, ...crafts];
};

export const readManifest = (): Manifest => JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest;

export const writeManifest = (m: Manifest) => {
  const sorted = Object.fromEntries(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
};

export const baseName = (item: Pick<PaintingItem, 'key' | 'revision'>) => `${item.key}-r${item.revision}`;

/** House style wrapped around every subject. */
export const housePrompt = (item: PaintingItem) =>
  [
    'An original painting in the manner of the Italian High Renaissance: fresco and oil on canvas,',
    'chiaroscuro lighting, soft sfumato, rich mineral pigments — lapis-lazuli blue, vermilion, yellow ochre, terre verte, lead white —',
    'with visible craquelure and the warm patina of age.',
    item.kind === 'craft'
      ? 'Composition: a circular tondo centred in a square canvas, the subject filling the circle, the corners a plain dark ground.'
      : 'Composition: a tall portrait-format scene that fills the canvas edge to edge.',
    `Subject: ${item.prompt}.`,
    'Rules: no text, letters, numerals, signatures, logos or watermarks; no real or recognisable people;',
    'do not recreate or imitate any specific existing artwork; do not paint a frame, border or wall — only the painting itself.',
  ].join(' ');

/** Parse `--flag` and positional args. */
export const args = () => {
  const argv = process.argv.slice(2);
  return {
    keys: argv.filter((a) => !a.startsWith('--')),
    has: (flag: string) => argv.includes(`--${flag}`),
  };
};
