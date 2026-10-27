# The Gallery of Ntsika Gqiba

Source for [ntsikagqiba.com](https://ntsikagqiba.com), the portfolio of a Cloud & Software
Engineer, built as an *edition*. The site opens on a gilded frame; scrolling flies through it into
a run of full-screen, layered Renaissance paintings, one chapter per project, wiped in with
brushstrokes. Each painting opens into a room with the architecture, stack, role and
restoration log.

**Stack:** a static Astro build, plain CSS and vanilla TypeScript with GSAP. Caddy serves it on
Cloud Run (europe-west1). GitHub Actions deploys it through Workload Identity Federation, with no
keys. Paintings are made in ChatGPT from [ART.md](ART.md), cut into depth layers, and served as
AVIF/WebP from Cloud Storage.

## Updating the content

All content lives in [`/content`](content). You never need to edit a component.

| To… | Do this |
|---|---|
| Add a project | `npm run new-project <slug>`, fill in the TODOs, set `draft: false` |
| Improve a project | Append `{ date: YYYY-MM-DD, note: … }` to its `log:`. It appears in the Restoration log |
| Change skills | `content/skills.json` |
| Update what you're studying | `content/studying.json` |
| Change links and contact details | `content/site.json` |
| Paint or repaint a scene | `npm run art:brief`, follow [ART.md](ART.md), then `npm run art:process` (bump `scene.revision` to repaint) |
| See what's missing | `npm run todos`, then read [TODO.md](TODO.md) |

The build validates every file against the zod schemas in
[`src/content.config.ts`](src/content.config.ts) and fails on a bad field. Values starting with
`TODO` are allowed and never shown on the site.

## Commands

```bash
npm install
npm run dev                 # http://localhost:4321 (drafts visible)
npm run lint
npm run typecheck
npm run build               # dist/ with .br/.gz siblings
npm run new-project <slug>
npm run todos
npm run art:brief           # ART.md: every ChatGPT prompt
npm run art:process         # preview art/ locally; --upload to publish
docker build -t portfolio . && docker run -p 8080:8080 portfolio
```

## Docs

- [DEPLOY.md](DEPLOY.md): GCP bootstrap, WIF, the CI/CD pipeline (PR previews, verified releases, rollback), paintings, the domain, cost.
- [DECISIONS.md](DECISIONS.md): every call the brief didn't settle, and why.
- [ART.md](ART.md): the painting brief, generated from the content.
- [TODO.md](TODO.md): setup steps and the facts still to be supplied.

Employer systems are described by architecture and role only. This repository contains no
proprietary code, internal addresses, credentials or client data.
