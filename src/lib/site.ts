import { z } from 'astro/zod';
import siteJson from '../../content/site.json';
import paintingsJson from '../../content/paintings.json';

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

/* ---------- Paintings (generated, hosted in GCS) ---------- */

const manifestSchema = z.record(
  z.string(),
  z.object({
    revision: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    widths: z.array(z.number().int().positive()).min(1),
  }),
);
const manifest = manifestSchema.parse(paintingsJson);

export interface PaintingSources {
  avif: string;
  webp: string;
  src: string;
  width: number;
  height: number;
  og: string;
}

/**
 * Responsive sources for a painting, or undefined while it has not been
 * generated yet (the frame then shows an unpainted canvas).
 * Key is "<slug>" for projects and "craft-<id>" for crafts.
 */
export const paintingSources = (key: string): PaintingSources | undefined => {
  const entry = manifest[key];
  if (!entry) return undefined;
  const base = `${site.assetsBase}/paintings/${key}-r${entry.revision}`;
  const set = (ext: string) => entry.widths.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');
  const largest = Math.max(...entry.widths);
  return {
    avif: set('avif'),
    webp: set('webp'),
    src: `${base}-${largest}.webp`,
    width: entry.width,
    height: entry.height,
    og: `${base}-og.jpg`,
  };
};
