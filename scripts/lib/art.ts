/** Shared helpers for the art pipeline: ART.md brief → ChatGPT → art/ → process → publish. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

export const ROOT = process.cwd();
export const INBOX = join(ROOT, 'art');
export const OUT = join(ROOT, '.cache', 'out', 'paintings');
export const LOCAL_PUBLIC = join(ROOT, 'public', 'paintings');
export const MANIFEST = join(ROOT, 'content', 'paintings.json');
export const LOCAL_MANIFEST = join(ROOT, 'content', 'paintings.local.json');

export interface Layer {
  id: string;
  depth: number;
  contains: string;
  transparent: boolean;
}

export interface SceneItem {
  /** Manifest key and folder name: project slug, craft-<id>, hero, finale. */
  key: string;
  title: string;
  prompt: string;
  revision: number;
  alt: string;
  focus: 'left' | 'center' | 'right';
  format: 'landscape' | 'square';
  layers: Layer[];
}

export interface ManifestEntry {
  revision: number;
  width: number;
  height: number;
  widths: number[];
  layers: string[];
  og: boolean;
  updated: string;
}
export type Manifest = Record<string, ManifestEntry>;

export const SIZE = {
  landscape: { w: 1536, h: 1024, label: '1536×1024 (3:2 landscape)', api: '1536x1024' },
  square: { w: 1024, h: 1024, label: '1024×1024 (square)', api: '1024x1024' },
} as const;
export const WIDTHS = { landscape: [768, 1152, 1536], square: [480, 768, 1024] } as const;

type RawScene = {
  prompt: string;
  revision?: number;
  alt: string;
  focus?: SceneItem['focus'];
  format?: SceneItem['format'];
  layers?: (Omit<Layer, 'transparent'> & { transparent?: boolean })[];
};

const toItem = (key: string, title: string, s: RawScene): SceneItem => ({
  key,
  title,
  prompt: s.prompt,
  revision: s.revision ?? 1,
  alt: s.alt,
  focus: s.focus ?? 'center',
  format: s.format ?? 'landscape',
  layers: (s.layers ?? []).map((l) => ({ ...l, transparent: l.transparent ?? true })),
});

/** Every scene on the site, in the order it appears. */
export const loadScenes = (): SceneItem[] => {
  const edition = JSON.parse(readFileSync(join(ROOT, 'content', 'edition.json'), 'utf8')) as { hero: RawScene; finale: RawScene };
  const dir = join(ROOT, 'content', 'projects');
  const projects = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const fm = parse(readFileSync(join(dir, f), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '') as {
        title: string;
        order: number;
        draft?: boolean;
        scene: RawScene;
      };
      const item = toItem(f.replace(/\.md$/, ''), fm.draft ? `${fm.title} (draft)` : fm.title, fm.scene);
      return { order: fm.order, item };
    })
    .sort((a, b) => a.order - b.order)
    .map((p) => p.item);
  const crafts = (JSON.parse(readFileSync(join(ROOT, 'content', 'skills.json'), 'utf8')) as { id: string; title: string; scene: RawScene }[]).map(
    (c) => toItem(`craft-${c.id}`, `Craft · ${c.title}`, c.scene),
  );
  return [toItem('hero', 'Frontispiece (hero)', edition.hero), ...projects, ...crafts, toItem('finale', 'Finale (contact)', edition.finale)];
};

export const readManifest = (path: string): Manifest => {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Manifest;
  } catch {
    return {};
  }
};

export const writeManifest = (path: string, m: Manifest) => {
  const sorted = Object.fromEntries(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`);
};

/* ---------- Prompts ---------- */

export const HOUSE_STYLE =
  'An original painting in the manner of the Italian High Renaissance — fresco and oil on canvas: chiaroscuro lighting, soft sfumato, rich mineral pigments (lapis-lazuli blue, vermilion, yellow ochre, terre verte, lead white), fine craquelure and the warm patina of age. No text, letters, numerals, signatures, logos or watermarks. No real or recognisable people. Do not recreate or imitate any specific existing artwork. Do not paint a frame, border or wall — only the painting itself, filling the canvas edge to edge.';

export const masterPrompt = (s: SceneItem) =>
  [
    HOUSE_STYLE,
    s.format === 'square'
      ? 'Composition: a circular tondo centred in a square canvas, the subject filling the circle, the corners a plain dark ground.'
      : `Composition: a wide landscape scene with clear depth — a distinct far background, a middle ground, and a few nearby foreground objects along the bottom and side edges. Keep the main subject inside the central third so it survives a tall crop${s.focus !== 'center' ? `, leaning slightly to the ${s.focus}` : ''}.`,
    `Subject: ${s.prompt}.`,
    `Size: ${SIZE[s.format].label}.`,
  ].join('\n\n');

export const layerPrompt = (s: SceneItem, l: Layer) =>
  l.transparent
    ? `Using the attached painting, isolate ${l.contains}, exactly as they appear — same size, same position in the frame, same lighting and brushwork — on a fully transparent background. Remove everything else. Output a PNG with transparency at ${SIZE[s.format].label}.`
    : `Using the attached painting, produce the same painting at the same size and framing showing ${l.contains}. Repaint what would be behind the removed parts so the scene is complete. Keep the style, light and colours identical. Output at ${SIZE[s.format].label}.`;

export const args = () => {
  const argv = process.argv.slice(2);
  return { keys: argv.filter((a) => !a.startsWith('--')), has: (flag: string) => argv.includes(`--${flag}`) };
};
