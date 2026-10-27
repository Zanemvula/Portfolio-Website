# TODO

## Setup — things only you can do

- [ ] **Rotate the Gemini API key** in Google AI Studio (the old build exposed it client-side).
- [ ] Push the `v1-ai-studio` tag (DEPLOY.md §0) — this session's git proxy refused the tag push.
- [x] Run the GCP bootstrap (DEPLOY.md §1–4): project `ntsikagqiba-portfolio`, 2026-10-27.
- [x] Add repo variables `WIF_PROVIDER`, `WIF_SA`, `RUN_SA`, `GCP_PROJECT_ID` (DEPLOY.md §5). Optional, still open: the secret `OPENAI_API_KEY`, only for API painting in the Art workflow.
- [x] First deploy (DEPLOY.md §6): https://portfolio-156341520802.europe-west1.run.app (revision `portfolio-00002-6bm`).
- [x] Create a Formspree form; put its ID in `content/site.json` → `contact.formspreeId` (`xnpppyez`).
- [x] Upload the CV to the bucket and set `cv` in `content/site.json` (DEPLOY.md §8).
- [ ] Consider a Calendly event aimed at hiring managers (e.g. "30-min intro call"); the current link is `free-strategy-session`, which reads as an agency sales call.
- [x] **Paint the scenes** ([ART.md](ART.md)): all 11 published scenes are in `gs://ntsikagqiba-assets/paintings/`, originals in `originals/`.
- [x] Domain: ntsikagqiba.com and www live on Cloud Run domain mappings, DNS at Namecheap, 2026-10-27 (DEPLOY.md §9).
- [ ] After cut-over: `portfolio.md` → `draft: false`, merge `v2-gallery`, remove `v2-gallery` from `deploy.yml`/`ci.yml`, retire the old host.
- [ ] Afterwards: profile README repo `Zanemvula/Zanemvula` and one case-study repo per project (I will ask for the facts).

<!-- BEGIN GENERATED: npm run todos -->

## Content TODOs (32)

_Facts only you can supply. Generated from /content — edit the content files, then re-run `npm run todos`._

### `content/projects/chatly.md`

- [ ] L23: public URL if one exists

### `content/projects/comfy-shoes.md`

- [ ] L4: year(s)
- [ ] L26: storefront URL once the cutover to comfyshoes.co.za is complete
- [ ] L65: dated entries (launch, cutover to comfyshoes.co.za)

### `content/projects/crm-on-aws.md`

- [ ] L4: year, e.g. 2026
- [ ] L11: 2–3 sentences — why the CRM is moving to AWS / what it replaces.
- [ ] L15: AWS services, IaC tool, CI/CD system
- [ ] L27: services, IaC and CI details
- [ ] L37: dated entries
- [ ] L42: what you built, in bullets — services, IaC, CI/CD.

### `content/projects/erpnext-rollout.md`

- [ ] L4: year(s)
- [ ] L46: dated entries
- [ ] L55: hosting details (provider, sizing, backups) and what you automated.

### `content/projects/portfolio.md`

- [ ] L10: confirm this problem statement (drafted from your brief)

### `content/projects/retailbridge.md`

- [ ] L4: year(s)
- [ ] L10: where it runs
- [ ] L11: 2–3 sentences — what went wrong with stock control before RFID?
- [ ] L42: dated entries
- [ ] L50: what you built, in bullets; where it runs; whether it feeds the online store.

### `content/projects/sentry-on-oci.md`

- [ ] L4: year
- [ ] L5: live | in-progress
- [ ] L10: 2–3 sentences — why self-host error tracking?
- [ ] L15: install method, sizing, which services report to it
- [ ] L17: case-study repo URL once it exists
- [ ] L41: dated entries
- [ ] L46: status, which services report to it, how it is maintained.

### `content/site.json`

- [ ] L57: start month (YYYY-MM)

### `content/studying.json`

- [ ] L8: start month (YYYY-MM)
- [ ] L9: target exam month (YYYY-MM)
- [ ] L10: current module or next milestone
- [ ] L19: start month (YYYY-MM)
- [ ] L20: current section or next milestone

<!-- END GENERATED -->
