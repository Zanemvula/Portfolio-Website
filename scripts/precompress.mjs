/**
 * Writes .br and .gz siblings for text assets in dist/ so Caddy can serve them
 * with `file_server { precompressed br gzip }` — maximum compression, zero CPU per request.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const ROOT = 'dist';
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.svg', '.xml', '.txt', '.json', '.webmanifest']);
const MIN_BYTES = 512;

let files = 0;
let before = 0;
let after = 0;

const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (!TEXT.has(extname(name))) continue;
    const buf = readFileSync(path);
    if (buf.length < MIN_BYTES) continue;
    const br = brotliCompressSync(buf, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: buf.length },
    });
    writeFileSync(`${path}.br`, br);
    writeFileSync(`${path}.gz`, gzipSync(buf, { level: 9 }));
    files += 1;
    before += buf.length;
    after += br.length;
  }
};

walk(ROOT);
console.log(`precompress: ${files} files, ${(before / 1024).toFixed(1)} KiB → ${(after / 1024).toFixed(1)} KiB brotli`);
