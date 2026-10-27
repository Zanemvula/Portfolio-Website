/**
 * Regenerates the content section of TODO.md from every "TODO" left in /content.
 *   npm run todos
 * The hand-written section above the marker is kept as is.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const MARKER = '<!-- BEGIN GENERATED: npm run todos -->';
const END = '<!-- END GENERATED -->';

const files: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(md|json)$/.test(name) && name !== 'paintings.json') files.push(path);
  }
};
walk(join(ROOT, 'content'));

const sections: string[] = [];
let total = 0;
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const hits = lines
    .map((line, i) => ({ line: i + 1, text: line.trim() }))
    .filter((l) => /TODO/.test(l.text))
    .map((l) => {
      const text = l.text
        .replace(/^.*?TODO:?\s*/, '')
        .replace(/\s*-->\s*$/, '')
        .replace(/",?$/, '')
        .trim();
      return `- [ ] L${l.line}: ${text}`;
    });
  if (!hits.length) continue;
  total += hits.length;
  sections.push(`### \`${relative(ROOT, file)}\`\n\n${hits.join('\n')}`);
}

const generated = `${MARKER}\n\n## Content TODOs (${total})\n\n_Facts only you can supply. Generated from /content — edit the content files, then re-run \`npm run todos\`._\n\n${sections.join('\n\n')}\n\n${END}`;

const path = join(ROOT, 'TODO.md');
const existing = existsSync(path) ? readFileSync(path, 'utf8') : '# TODO\n\n';
const head = existing.includes(MARKER) ? existing.slice(0, existing.indexOf(MARKER)) : `${existing.trimEnd()}\n\n`;
writeFileSync(path, `${head}${generated}\n`);
console.log(`TODO.md: ${total} content TODOs across ${sections.length} files.`);
