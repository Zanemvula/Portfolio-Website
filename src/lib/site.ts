import { z } from 'astro/zod';
import siteJson from '../../content/site.json';
import paintingsJson from '../../content/paintings.json';
import editionJson from '../../content/edition.json';
import { scene } from './scene-schema';

/** A content value is a TODO when it is a string starting with "TODO". */
export const isTodo = (value: unknown): boolean => typeof value === 'string' && value.trim().startsWith('TODO');

/** Returns the value, or undefined if it is missing or still a TODO. */
export const known = <T>(value: T | undefined): T | undefined => (value === undefined || isTodo(value) ? undefined : value);

const todoOr = <T extends z.ZodType>(schema: T) => z.union([schema, z.string().startsWith('TODO')]);

const siteSchema = z.object({
  name: z.string(),
  role: z.string(),
  headline: z.string(),
  valueStatement: z.string(),
  location: z.string(),
  availability: z.string(),
  url: z.url(),
  description: z.string().max(170),
  contact: z.object({
    email: z.email(),
    whatsapp: z.string().regex(/^\d{8,15}$/, 'Digits only, with country code, e.g. 27815386865'),
    whatsappMessage: z.string(),
    booking: todoOr(z.url()),
    formspreeId: todoOr(z.string().regex(/^[A-Za-z0-9]+$/)),
  }),
  social: z.object({ linkedin: z.url(), github: z.url() }),
  cv: todoOr(z.url()),
  assetsBase: z.url(),
  media: z.object({
    videos: z.array(z.object({ id: z.string(), src: z.url(), poster: z.url().optional(), title: z.string() })),
  }),
  experience: z.array(
    z.object({
      title: z.string(),
      organisation: z.string(),
      place: z.string().optional(),
      start: todoOr(z.string().regex(/^\d{4}-\d{2}$/)),
      end: z.union([z.literal('present'), z.string().regex(/^\d{4}-\d{2}$/)]),
    }),
  ),
  education: z.array(z.object({ qualification: z.string(), institution: z.string(), year: todoOr(z.string()) })),
});

export const site = siteSchema.parse(siteJson);

export const edition = z
  .object({ name: z.string(), volume: z.string(), intro: z.string(), hero: scene, finale: scene })
  .parse(editionJson);

export const whatsappUrl = (message = site.contact.whatsappMessage) =>
  `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;

export const mailtoUrl = (subject = 'Hello from ntsikagqiba.com') =>
  `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09" → "Sep 2026"; "2026-09-14" → "14 Sep 2026". */
export const formatMonth = (iso: string) => {
  const [y, m, d] = iso.split('-');
  if (!y || !m) return iso;
  const month = MONTHS[Number(m) - 1] ?? m;
  return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
};

const ROMAN: [number, string][] = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];
/** Catalogue numbers on the plaques: 1 → "I", 7 → "VII". */
export const roman = (n: number) => {
  let out = '';
  for (const [v, s] of ROMAN) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
};

export const CLOUD_LABELS = { aws: 'AWS', oci: 'Oracle Cloud', gcp: 'Google Cloud', linux: 'Linux' } as const;

export const STATUS_LABELS = {
  live: 'In service',
  'in-progress': 'In progress',
  paused: 'Paused',
  archived: 'Archived',
  todo: '',
} as const;

/* ---------- Scenes (painted art, hosted in GCS) ---------- */

const manifestEntry = z.object({
  revision: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  widths: z.array(z.number().int().positive()).min(1),
  /** Layer ids that were published; "full" is the whole painting. */
  layers: z.array(z.string()).min(1),
  /** Whether a 1200×630 share card was published. */
  og: z.boolean().default(false),
});
const manifestSchema = z.record(z.string(), manifestEntry);

/**
 * content/paintings.json lists art published to Cloud Storage. When
 * `npm run art:process` has run locally, content/paintings.local.json lists art
 * written to public/paintings/ and served same-origin; it is gitignored and
 * wins, so local previews never touch the bucket.
 */
const localManifests = import.meta.glob<{ default: unknown }>('../../content/paintings.local.json', { eager: true });
const remote = manifestSchema.parse(paintingsJson);
const local = manifestSchema.parse(Object.values(localManifests)[0]?.default ?? {});

type Entry = z.infer<typeof manifestEntry> & { base: string };
const entries: Record<string, Entry> = {
  ...Object.fromEntries(Object.entries(remote).map(([k, v]) => [k, { ...v, base: `${site.assetsBase}/paintings` }])),
  ...Object.fromEntries(Object.entries(local).map(([k, v]) => [k, { ...v, base: '/paintings' }])),
};

/** True once any art is published to the bucket (drives the GCS preconnect). */
export const hasRemoteArt = Object.keys(remote).some((k) => !(k in local));

export interface LayerSources {
  id: string;
  avif: string;
  webp: string;
  src: string;
}

export interface SceneSources {
  width: number;
  height: number;
  /** Back to front. Either the cut layers, or just ["full"]. */
  layers: LayerSources[];
  og?: string;
}

/**
 * Responsive sources for a scene, or undefined while it has not been painted
 * (the scene then shows its sinopia under-drawing). Keys: project slug,
 * "craft-<id>", "hero", "finale".
 * `order` is the layer order from the content file; layers not yet published are skipped.
 */
export const sceneSources = (key: string, order: string[] = []): SceneSources | undefined => {
  const e = entries[key];
  if (!e) return undefined;
  const prefix = `${e.base}/${key}-r${e.revision}`;
  const cut = order.filter((id) => e.layers.includes(id));
  const ids = cut.length > 0 ? cut : e.layers.includes('full') ? ['full'] : e.layers.slice(0, 1);
  const largest = Math.max(...e.widths);
  const layers = ids.map((id) => {
    const set = (ext: string) => e.widths.map((w) => `${prefix}-${id}-${w}.${ext} ${w}w`).join(', ');
    return { id, avif: set('avif'), webp: set('webp'), src: `${prefix}-${id}-${largest}.webp` };
  });
  const ogPath = `${prefix}-og.jpg`;
  const og = e.og ? (ogPath.startsWith('http') ? ogPath : new URL(ogPath, site.url).href) : undefined;
  return { width: e.width, height: e.height, layers, og };
};
