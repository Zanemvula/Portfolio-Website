import { z } from 'astro/zod';

/**
 * A scene is one painting made of up to four aligned layers, back to front.
 * You paint the whole picture first (layer "full"), then cut it into layers in
 * ChatGPT — see ART.md. A scene that only has "full" still works: it gets a
 * slow camera push instead of parallax depth.
 */
export const sceneLayer = z.object({
  /** File name without extension: art/<key>/<id>.png */
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** 0 = far backdrop, 1 = nearest to the viewer. Drives parallax speed and scale. */
  depth: z.number().min(0).max(1),
  /** What this layer contains, used for the ChatGPT extraction prompt. */
  contains: z.string().min(5),
  /** Foreground layers are cut out onto a transparent background. */
  transparent: z.boolean().default(true),
});

export const scene = z.object({
  /** The whole painting, described as a subject; the house style is added for you. */
  prompt: z.string().min(20),
  /** Bump after repainting. Published files are named <key>-r<revision>-<layer>-<width>.<ext>. */
  revision: z.number().int().positive().default(1),
  alt: z.string().min(10),
  /** Where the subject sits, so portrait screens crop to it. */
  focus: z.enum(['left', 'center', 'right']).default('center'),
  /** Landscape scenes fill the screen; tondi are square medallions. */
  format: z.enum(['landscape', 'square']).default('landscape'),
  layers: z.array(sceneLayer).max(4).default([]),
});

export type Scene = z.infer<typeof scene>;
