# TODO

## Setup — things only you can do

- [ ] **Rotate the Gemini API key** in Google AI Studio (the old build exposed it client-side).
- [ ] Push the `v1-ai-studio` tag (DEPLOY.md §0) — this session's git proxy refused the tag push.
- [ ] Run the GCP bootstrap (DEPLOY.md §1–4).
- [ ] Add repo variables `WIF_PROVIDER`, `WIF_SA`, `RUN_SA`, `GCP_PROJECT_ID` and the secret `OPENAI_API_KEY` (DEPLOY.md §5).
- [ ] Re-run the latest **Deploy** workflow → note the `run.app` URL (DEPLOY.md §6).
- [ ] Create a Formspree form; put its ID in `content/site.json` → `contact.formspreeId`.
- [ ] Upload the CV to the bucket and set `cv` in `content/site.json` (DEPLOY.md §8). Check it reflects the Software Engineer role (Sep 2026).
- [ ] Consider a Calendly event aimed at hiring managers (e.g. "30-min intro call"); the current link is `free-strategy-session`, which reads as an agency sales call.
- [ ] Run the **Paintings** workflow once the bootstrap is done (DEPLOY.md §7).
- [ ] Domain: verify ntsikagqiba.com, create the mappings, add the DNS records (DEPLOY.md §9).
- [ ] After cut-over: `portfolio.md` → `draft: false`, merge `v2-gallery`, remove `v2-gallery` from `deploy.yml`/`ci.yml`, retire the old host.
- [ ] Afterwards: profile README repo `Zanemvula/Zanemvula` and one case-study repo per project (I will ask for the facts).

<!-- BEGIN GENERATED: npm run todos -->

## Content TODOs (65)

_Facts only you can supply. Generated from /content — edit the content files, then re-run `npm run todos`._

### `content/projects/chatly.md`

- [ ] L4: year(s), e.g. 2025 or 2025–present
- [ ] L5: live | in-progress | paused | archived
- [ ] L8: confirm whether Chatly is your own product, a client's or LNS's
- [ ] L9: who owns Chatly?
- [ ] L11: 2–3 sentences — who had what problem before Chatly?
- [ ] L16: Google Cloud services used (e.g. which compute, database, queues)
- [ ] L17: language / framework, payment provider
- [ ] L19: public URL if one exists
- [ ] L25: replace with the real architecture once you supply the services
- [ ] L35: dated entries, e.g. { date: 2025-06, note: "Launched …" }
- [ ] L40: what you built, in bullets — components you personally designed, built or run.
- [ ] L41: architecture walk-through — how a message becomes a quote, then a payment.

### `content/projects/comfy-shoes.md`

- [ ] L4: year(s)
- [ ] L11: 2–3 sentences — what did the brand need before the platform?
- [ ] L15: storefront platform / framework, database, payments, CDN, monitoring
- [ ] L17: storefront URL (public site only)
- [ ] L23: replace with the real architecture
- [ ] L33: dated entries
- [ ] L38: what you built, in bullets.
- [ ] L39: how it is deployed, backed up and monitored.

### `content/projects/crm-on-aws.md`

- [ ] L4: year, e.g. 2026
- [ ] L11: 2–3 sentences — why the CRM is moving to AWS / what it replaces.
- [ ] L15: AWS services, IaC tool, CI/CD system
- [ ] L22: services, IaC and CI details
- [ ] L32: dated entries
- [ ] L37: what you built, in bullets — services, IaC, CI/CD.

### `content/projects/erpnext-rollout.md`

- [ ] L4: year(s)
- [ ] L5: live | in-progress
- [ ] L11: 2–3 sentences — how were the branches run before ERPNext?
- [ ] L17: VPS provider, OS, database, backups, what you automated
- [ ] L24: hosting details
- [ ] L38: dated entries
- [ ] L43: hosting details (provider, sizing, backups).
- [ ] L44: what you automated.

### `content/projects/portfolio.md`

- [ ] L10: confirm this problem statement (drafted from your brief)

### `content/projects/retailbridge.md`

- [ ] L4: year(s)
- [ ] L5: live | in-progress | paused
- [ ] L9: who owns RetailBridge?
- [ ] L10: where it runs
- [ ] L11: 2–3 sentences — what went wrong between stock on the floor and the online store?
- [ ] L12: your role on RetailBridge
- [ ] L15: stack
- [ ] L22: real components
- [ ] L36: dated entries
- [ ] L41: what you built, in bullets.
- [ ] L42: status and stack.

### `content/projects/sentry-on-oci.md`

- [ ] L4: year
- [ ] L5: live | in-progress
- [ ] L10: 2–3 sentences — why self-host error tracking?
- [ ] L15: install method, sizing, which services report to it
- [ ] L17: case-study repo URL once it exists
- [ ] L36: dated entries
- [ ] L41: status, which services report to it, how it is maintained.

### `content/site.json`

- [ ] L15: create a Formspree form and paste its ID (the part after formspree.io/f/)
- [ ] L21: upload the CV (see DEPLOY.md §CV) then set this to https://storage.googleapis.com/ntsikagqiba-assets/cv/ntsika-gqiba-cv.pdf
- [ ] L50: start month (YYYY-MM)
- [ ] L58: year completed
- [ ] L63: year completed

### `content/skills.json`

- [ ] L39: confirm Docker is still 'in apprenticeship'" },
- [ ] L40: confirm CI/CD is still 'in apprenticeship'" }

### `content/studying.json`

- [ ] L8: start month (YYYY-MM)
- [ ] L9: target exam month (YYYY-MM)
- [ ] L10: current module or next milestone
- [ ] L19: start month (YYYY-MM)
- [ ] L20: current section or next milestone

<!-- END GENERATED -->
