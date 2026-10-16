# The Gallery of Ntsika Gqiba

Source for [ntsikagqiba.com](https://ntsikagqiba.com), the portfolio of a Cloud & Software
Engineer. The site is laid out as a Renaissance gallery: each project is a framed painting, and
each painting opens into a room with the architecture, stack, role and restoration log.

**Stack:** a static Astro build, plain CSS and vanilla TypeScript with GSAP. Caddy serves it on
Cloud Run (europe-west1). GitHub Actions deploys it through Workload Identity Federation, with no
keys. Paintings are generated once and served as AVIF/WebP from Cloud Storage.

## Updating the content

All content lives in [`/content`](content). You never need to edit a component.

| To… | Do this |
|---|---|
| Add a project | `npm run new-project <slug>`, fill in the TODOs, set `draft: false` |
| Improve a project | Append `{ date: YYYY-MM-DD, note: … }` to its `log:`. It appears in the Restoration log |
| Change skills | `content/skills.json` |
| Update what you're studying | `content/studying.json` |
| Change links and contact details | `content/site.json` |
| Repaint a project | Bump `painting.revision`, then run the **Paintings** workflow |
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
npm run paintings:generate -- --dry-run
npm run paintings:process
docker build -t portfolio . && docker run -p 8080:8080 portfolio
```

## Docs

- [DEPLOY.md](DEPLOY.md): GCP bootstrap, WIF, the first deploy, paintings, the domain, cost.
- [DECISIONS.md](DECISIONS.md): every call the brief didn't settle, and why.
- [TODO.md](TODO.md): setup steps and the facts still to be supplied.

Employer systems are described by architecture and role only. This repository contains no
proprietary code, internal addresses, credentials or client data.
