/**
 * Scaffolds a new painting for the Hall of Works:
 *   npm run new-project my-project-slug
 * Writes content/projects/<slug>.md with every frontmatter field and TODOs.
 * Then: fill the TODOs, run `npm run todos`, and paint its scene (ART.md).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const slug = process.argv[2];
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run new-project <slug>   (lowercase letters, digits and hyphens, e.g. "aws-landing-zone")');
  process.exit(1);
}

const dir = join(process.cwd(), 'content', 'projects');
const file = join(dir, `${slug}.md`);
if (existsSync(file)) {
  console.error(`${file} already exists.`);
  process.exit(1);
}

const nextOrder =
  Math.max(
    0,
    ...readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => Number(readFileSync(join(dir, f), 'utf8').match(/^order:\s*(\d+)/m)?.[1] ?? 0)),
  ) + 1;

const title = slug
  .split('-')
  .map((w) => w[0]!.toUpperCase() + w.slice(1))
  .join(' ');
const today = new Date().toISOString().slice(0, 10);

writeFileSync(
  file,
  `---
title: ${title} # TODO: confirm title
summary: "TODO: one sentence for the plaque and search results (max 200 characters)"
year: "TODO: year or range, e.g. 2026 or 2025–present"
status: todo # TODO: live | in-progress | paused | archived
order: ${nextOrder}
draft: true # Set to false to hang it in the hall.
confidential: true # false if this is your own system and code may be linked
# organisation: TODO: employer or client, if any
clouds: [] # TODO: any of aws, oci, gcp, linux
problem: "TODO: 2–3 sentences — who had what problem?"
role: "TODO: your role in one line"
stack: [] # TODO: services, runtimes, databases, CI/CD, monitoring
links: {} # TODO: { github: https://…, live: https://…, caseStudy: https://… }
scene:
  prompt: "TODO: a wide Renaissance scene that is a metaphor for the project — backdrop, middle-ground figures, a few near objects; no text, logos or real people"
  revision: 1
  alt: "TODO: one-sentence description of the painting for screen readers"
  focus: center # left | center | right — where the subject sits
  layers:
    - { id: plate, depth: 0, transparent: false, contains: "TODO: the empty backdrop, with the figures and near objects removed" }
    - { id: figures, depth: 0.55, contains: "TODO: only the figures" }
    - { id: foreground, depth: 1, contains: "TODO: only the nearest objects along the bottom edge" }
# architecture:
#   tiers:
#     - label: Users
#       nodes:
#         - { id: users, label: Customers }
#     - label: Platform
#       nodes:
#         - { id: app, label: Application, note: where it runs }
#   edges:
#     - { from: users, to: app }
log:
  - { date: ${today}, note: Added to the gallery. }
---

<!-- TODO: What I built — bullet the components you personally designed, built or run. -->
`,
);

console.log(`Created ${file}
Next:
  1. Fill in the TODOs (npm run todos lists them).
  2. Set draft: false when it is ready to hang.
  3. Paint it: npm run art:brief, then follow its section in ART.md.`);
