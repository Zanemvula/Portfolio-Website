/**
 * Image models redraw cut-outs instead of cutting them: a figure comes back a
 * little bigger, smaller or shifted. This finds where each cut-out really sits
 * in the master painting (uniform scale + offset), then rebuilds the stack from
 * the master's own pixels so every layer lines up exactly:
 *
 *   cut-out  → master pixels, under the cut-out's (re-positioned) silhouette
 *   backdrop → master pixels everywhere except behind the cut-outs
 *
 * A cut-out that matches nothing in the master (an invented object) is left as is.
 */
import sharp from 'sharp';

interface Rgba {
  data: Uint8Array;
  width: number;
  height: number;
}

const raw = async (input: Buffer, width: number, height: number): Promise<Rgba> => {
  const { data, info } = await sharp(input).resize(width, height, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height };
};

const bbox = (img: Rgba, threshold = 128) => {
  let x0 = img.width,
    y0 = img.height,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++)
      if (img.data[(y * img.width + x) * 4 + 3]! > threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? undefined : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
};

/** Mean RGB difference between the patch (where opaque) placed at (ox, oy) and the master. */
const score = (master: Rgba, patch: Rgba, ox: number, oy: number) => {
  let sum = 0;
  let n = 0;
  for (let y = 0; y < patch.height; y += 1) {
    const my = oy + y;
    if (my < 0 || my >= master.height) continue;
    for (let x = 0; x < patch.width; x += 1) {
      const pi = (y * patch.width + x) * 4;
      if (patch.data[pi + 3]! < 160) continue;
      const mx = ox + x;
      if (mx < 0 || mx >= master.width) continue;
      const mi = (my * master.width + mx) * 4;
      sum +=
        Math.abs(patch.data[pi]! - master.data[mi]!) +
        Math.abs(patch.data[pi + 1]! - master.data[mi + 1]!) +
        Math.abs(patch.data[pi + 2]! - master.data[mi + 2]!);
      n += 3;
    }
  }
  return n > 50 ? sum / n : Infinity;
};

/** Normalised cross-correlation of luminance where the patch is opaque: ~1 = same picture, ~0 = unrelated. */
const ncc = (master: Rgba, patch: Rgba, ox: number, oy: number) => {
  const a: number[] = [];
  const b: number[] = [];
  for (let y = 0; y < patch.height; y++) {
    const my = oy + y;
    if (my < 0 || my >= master.height) continue;
    for (let x = 0; x < patch.width; x++) {
      const pi = (y * patch.width + x) * 4;
      if (patch.data[pi + 3]! < 160) continue;
      const mx = ox + x;
      if (mx < 0 || mx >= master.width) continue;
      const mi = (my * master.width + mx) * 4;
      a.push(0.299 * patch.data[pi]! + 0.587 * patch.data[pi + 1]! + 0.114 * patch.data[pi + 2]!);
      b.push(0.299 * master.data[mi]! + 0.587 * master.data[mi + 1]! + 0.114 * master.data[mi + 2]!);
    }
  }
  if (a.length < 50) return 0;
  const mean = (v: number[]) => v.reduce((x, y) => x + y, 0) / v.length;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i]! - ma) * (b[i]! - mb);
    da += (a[i]! - ma) ** 2;
    db += (b[i]! - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
};

export interface Placement {
  /** Scale applied to the cut-out's bounding box, and its new top-left, in full-resolution pixels. */
  scale: number;
  x: number;
  y: number;
  /** Mean RGB difference (0–255) at the best placement; lower is better. */
  error: number;
  /** Error of the cut-out left where it was, for comparison. */
  errorAsIs: number;
  /** Structural match at the placement (normalised cross-correlation of luminance). */
  correlation: number;
}

/** A placement is trusted only when the structure matches: an invented object correlates poorly. */
export const MIN_CORRELATION = 0.6;

/** Search scale and offset that best fit the cut-out onto the master (coarse to fine). */
export const findPlacement = async (masterPng: Buffer, cutoutPng: Buffer, W: number, H: number): Promise<Placement | undefined> => {
  const cutFull = await raw(cutoutPng, W, H);
  const box = bbox(cutFull);
  if (!box) return undefined;
  const crop = await sharp(cutoutPng).resize(W, H, { fit: 'fill' }).extract({ left: box.x, top: box.y, width: box.w, height: box.h }).png().toBuffer();

  const search = async (factor: number, scales: number[], xs: (s: number) => number[], ys: (s: number) => number[]) => {
    const master = await raw(masterPng, Math.round(W / factor), Math.round(H / factor));
    let best = { scale: 1, x: 0, y: 0, error: Infinity };
    for (const s of scales) {
      const pw = Math.max(4, Math.round((box.w * s) / factor));
      const ph = Math.max(4, Math.round((box.h * s) / factor));
      if (pw > master.width * 1.05 || ph > master.height * 1.05) continue;
      const patch = await raw(crop, pw, ph);
      for (const x of xs(s))
        for (const y of ys(s)) {
          const e = score(master, patch, Math.round(x / factor), Math.round(y / factor));
          if (e < best.error) best = { scale: s, x, y, error: e };
        }
    }
    return best;
  };

  const range = (a: number, b: number, step: number) => {
    const out: number[] = [];
    for (let v = a; v <= b + 1e-9; v += step) out.push(+v.toFixed(4));
    return out;
  };

  // Coarse: 1/16 resolution, scales 0.45–1.6, every 16 px.
  const coarse = await search(
    16,
    range(0.45, 1.6, 0.025),
    (s) => range(-box.w * s * 0.25, W - box.w * s * 0.75, 16),
    (s) => range(-box.h * s * 0.25, H - box.h * s * 0.75, 16),
  );
  // Fine: 1/4 resolution around the coarse answer.
  const fine = await search(
    4,
    range(coarse.scale - 0.03, coarse.scale + 0.03, 0.005),
    () => range(coarse.x - 24, coarse.x + 24, 4),
    () => range(coarse.y - 24, coarse.y + 24, 4),
  );
  const master4 = await raw(masterPng, Math.round(W / 4), Math.round(H / 4));
  const asIs = score(master4, await raw(crop, Math.round(box.w / 4), Math.round(box.h / 4)), Math.round(box.x / 4), Math.round(box.y / 4));
  const placed = await raw(crop, Math.max(4, Math.round((box.w * fine.scale) / 4)), Math.max(4, Math.round((box.h * fine.scale) / 4)));
  const correlation = ncc(master4, placed, Math.round(fine.x / 4), Math.round(fine.y / 4));
  return { scale: fine.scale, x: Math.round(fine.x), y: Math.round(fine.y), error: fine.error, errorAsIs: asIs, correlation };
};

/** The cut-out's alpha, scaled and moved to its placement on a W×H canvas (single-channel PNG buffer). */
export const placedAlpha = async (cutoutPng: Buffer, p: Placement, W: number, H: number) => {
  const cutFull = await sharp(cutoutPng).resize(W, H, { fit: 'fill' }).png().toBuffer();
  const box = bbox(await raw(cutFull, W, H))!;
  const w = Math.max(1, Math.round(box.w * p.scale));
  const h = Math.max(1, Math.round(box.h * p.scale));
  const alpha = await sharp(cutFull).extract({ left: box.x, top: box.y, width: box.w, height: box.h }).extractChannel('alpha').resize(w, h).png().toBuffer();
  // Clip the placed patch to the canvas.
  const left = Math.max(0, p.x);
  const top = Math.max(0, p.y);
  const cropL = left - p.x;
  const cropT = top - p.y;
  const cw = Math.min(w - cropL, W - left);
  const ch = Math.min(h - cropT, H - top);
  const clipped = await sharp(alpha).extract({ left: cropL, top: cropT, width: cw, height: ch }).png().toBuffer();
  // sharp can only create 3- or 4-channel canvases; draw on black RGB and keep one channel.
  const canvas = await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
    .composite([{ input: clipped, left, top }])
    .png()
    .toBuffer();
  return sharp(canvas).extractChannel(0).png().toBuffer();
};

/** Master pixels under a mask: an exactly aligned cut-out. */
export const cutFromMaster = async (masterPng: Buffer, alphaPng: Buffer, W: number, H: number) => {
  const rgb = await sharp(masterPng).resize(W, H, { fit: 'fill' }).removeAlpha().png().toBuffer();
  return sharp(rgb).joinChannel(await sharp(alphaPng).extractChannel(0).blur(0.8).png().toBuffer()).png().toBuffer();
};

/** Backdrop = master, except inside the (grown, feathered) union of cut-out masks, where the generated backdrop shows. */
export const patchBackdrop = async (masterPng: Buffer, backdropPng: Buffer, masks: Buffer[], W: number, H: number) => {
  if (masks.length === 0) return backdropPng;
  let union = await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } }).png().toBuffer();
  for (const m of masks) union = await sharp(union).composite([{ input: m, blend: 'lighten' }]).png().toBuffer();
  // Grow ~1% of the width and feather, so halos around the figures come from the clean backdrop.
  const grow = Math.max(3, Math.round(W * 0.01));
  const grown = await sharp(union).extractChannel(0).dilate(grow).blur(grow * 0.6).png().toBuffer();
  const hole = await sharp(await sharp(backdropPng).resize(W, H, { fit: 'fill' }).removeAlpha().png().toBuffer()).joinChannel(grown).png().toBuffer();
  return sharp(await sharp(masterPng).resize(W, H, { fit: 'fill' }).removeAlpha().png().toBuffer())
    .composite([{ input: hole }])
    .png()
    .toBuffer();
};

/** Share of the central region (middle half across, middle 60% down) a cut-out covers: framing objects sit outside it. */
export const centralCoverage = async (cutoutPng: Buffer, W: number, H: number) => {
  const img = await raw(cutoutPng, Math.round(W / 8), Math.round(H / 8));
  const x0 = Math.round(img.width * 0.25);
  const x1 = Math.round(img.width * 0.75);
  const y0 = Math.round(img.height * 0.2);
  const y1 = Math.round(img.height * 0.8);
  let opaque = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (img.data[(y * img.width + x) * 4 + 3]! > 128) opaque++;
  return opaque / ((x1 - x0) * (y1 - y0));
};
