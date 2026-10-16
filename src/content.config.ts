import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content conventions
 * - Anything unknown is written as a string starting with "TODO" (frontmatter)
 *   or an HTML comment `<!-- TODO: … -->` (markdown body). TODO values are
 *   never rendered on the public site; `npm run todos` lists them in TODO.md.
 */

const todoOr = <T extends z.ZodType>(schema: T) => z.union([schema, z.string().startsWith('TODO')]);

// YAML turns an unquoted 2026-10-16 into a Date; normalise back to the ISO string.
const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Use YYYY-MM or YYYY-MM-DD'),
);

const architecture = z.object({
  /** Rows of the diagram, drawn top to bottom. */
  tiers: z
    .array(
      z.object({
        label: z.string(),
        nodes: z.array(z.object({ id: z.string(), label: z.string(), note: z.string().optional() })).min(1).max(4),
      }),
    )
    .min(1),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() })).default([]),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/projects' }),
  schema: z.object({
    title: z.string(),
    /** One sentence for the plaque, cards and meta description. */
    summary: z.string().max(200),
    year: todoOr(z.string().regex(/^\d{4}(–(\d{4}|present))?$/)),
    status: z.enum(['live', 'in-progress', 'paused', 'archived', 'todo']),
    /** Hanging order in the Hall of Works (1 = first). */
    order: z.number().int().positive(),
    draft: z.boolean().default(false),
    /** Employer-owned system: architecture and role only, no code or data. */
    confidential: z.boolean().default(true),
    organisation: z.string().optional(),
    clouds: z.array(z.enum(['aws', 'oci', 'gcp', 'linux'])).default([]),
    /** 2–3 sentences: who had what problem. The markdown body is "What I built". */
    problem: todoOr(z.string()),
    role: z.string(),
    stack: z.array(z.string()).default([]),
    links: z
      .object({
        github: todoOr(z.url()).optional(),
        live: todoOr(z.url()).optional(),
        caseStudy: todoOr(z.url()).optional(),
      })
      .default({}),
    painting: z.object({
      /** Subject of the painting; the house style prefix is added by the generator. */
      prompt: z.string().min(20),
      /** Bump to regenerate. Published files are named <slug>-r<revision>-<width>.<ext>. */
      revision: z.number().int().positive().default(1),
      alt: z.string().min(10),
    }),
    architecture: architecture.optional(),
    /** The Restoration log: append a line whenever the project is improved. */
    log: z.array(z.object({ date: isoDate, note: z.string() })).default([]),
  }),
});

const crafts = defineCollection({
  loader: file('./content/skills.json'),
  schema: z.object({
    title: z.string(),
    order: z.number().int(),
    blurb: z.string(),
    items: z
      .array(
        z.object({
          name: z.string(),
          /** "apprenticeship" = still learning; shown with a distinct mark. */
          level: z.enum(['practised', 'apprenticeship']),
          note: z.string().optional(),
        }),
      )
      .min(1),
    painting: z.object({
      prompt: z.string().min(20),
      revision: z.number().int().positive().default(1),
      alt: z.string().min(10),
    }),
  }),
});

const studying = defineCollection({
  loader: file('./content/studying.json'),
  schema: z.object({
    title: z.string(),
    provider: z.string(),
    url: z.url().optional(),
    status: z.enum(['studying', 'in-progress', 'paused', 'completed']),
    started: todoOr(isoDate),
    target: todoOr(isoDate).optional(),
    nextStep: todoOr(z.string()).optional(),
    order: z.number().int(),
  }),
});

export const collections = { projects, crafts, studying };
