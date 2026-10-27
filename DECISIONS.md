# Decisions

Each entry is a call made during the rebuild that the brief did not settle, with the reason.
Newest last. Change any of them by editing the code and adding a line here.

## 2026-10-16 · Setup

1. **Branch `v2-gallery`.** Requested by Ntsika. The old site is meant to live at tag `v1-ai-studio` (`641432c`). This session's git proxy refused the tag push (HTTP 403); the command is in DEPLOY.md §0.
2. **Scaffold removed entirely**: `App.tsx`, `constants.tsx`, `metadata.json`, `types.ts`, `index.*`, the Vite config, `@google/genai` and every `GEMINI_API_KEY` reference. The old marketing case studies (Brand Audit Engine, GTM-to-Sheets bridge, Payfast) were **not** carried over, because the brief limits content to the supplied facts.
3. **Google Tag Manager dropped** (Ntsika: "let's leave GTM"). Removing it keeps the CSP `'self'`-only and removes the single largest Lighthouse cost of the old site. Cloud Run request logs cover basic traffic. Re-adding analytics means a CSP change in `deploy/Caddyfile`.
4. **Contact details** supplied by Ntsika: email, WhatsApp `+27 81 538 6865`, Calendly link, Formspree. The Formspree form ID is still a TODO. Until it is set, the contact panel falls back to mailto only.
5. **CV moves to the GCS bucket** at `cv/ntsika-gqiba-cv.pdf`. It stays hidden until uploaded (DEPLOY.md §8), so the site never links to a 404.

## Stack

6. **Astro 7.3.8, not 7.4.0.** 7.4.0 was one day old at the time of writing. All dependencies are pinned to exact versions.
7. **TypeScript 6.0.3, not 7.x.** `@astrojs/check` and `typescript-eslint` don't support TS 7 yet.
8. **Plain CSS with custom properties; no Tailwind and no client framework.** About 26 KB of CSS before compression. The JS is a few KB of vanilla TS, plus GSAP loaded on demand.
9. **Fonts self-hosted through Fontsource**, still the Google Fonts families: Cormorant Garamond for display, Cinzel for the engraved plaques, Inter for body. Self-hosting removes a render-blocking third-party request and keeps `font-src 'self'`. Only the hero display face is preloaded.
10. **Caddy instead of nginx.** The official `nginx:alpine` image has no Brotli module; Caddy serves pre-compressed `.br`/`.gz` files natively. Files are compressed once at build time (`scripts/precompress.mjs`), so there is no per-request CPU cost.
11. **Base images from `mirror.gcr.io`** (Google's Docker Hub mirror), pinned to `node:22.23.3-alpine` and `caddy:2.11.7-alpine`. This avoids Docker Hub's anonymous pull limits, which hit during development.
12. **Container runs as a non-root user** with a read-only-friendly setup (Caddy state in `/tmp`), plus a `/health` route for smoke tests (renamed from `/healthz`; see 60).

## Security headers

13. **CSP is `'self'`-only for scripts and styles, with no hashes and no `'unsafe-inline'`.** Astro is set to never inline stylesheets or assets, and the code avoids `style=""` attributes. Runtime style changes (GSAP, view transitions) go through the CSSOM, which CSP allows. JSON-LD is a non-executable data block, so CSP doesn't apply to it.
14. **HSTS is `max-age=31536000` without `includeSubDomains`/`preload`.** Preload is hard to undo, and `includeSubDomains` would break any future plain-HTTP subdomain. Tighten it once the domain is settled.
15. **HTML gets a 5-minute cache** (`max-age=300, must-revalidate`); hashed `/_astro/*` assets are immutable for a year.

## Content model

16. **TODOs are literal strings starting with `TODO`** (frontmatter), YAML comments, or `<!-- TODO -->` comments (markdown body). The site never renders a TODO value. It shows "This part of the catalogue entry is being written." instead, so recruiters never see a placeholder. `npm run todos` rebuilds the list in TODO.md.
17. **`problem` is a frontmatter field; the markdown body is "What I built".** This keeps the five required room sections predictable without parsing headings.
18. **Architecture diagrams are a frontmatter `architecture` block** (tiers → nodes, plus edges), rendered to inline SVG at build time. Client-side Mermaid would add several hundred KB of JS. Every current diagram uses only the facts supplied; each one is marked TODO for the real components.
19. **Projects whose status is unknown are marked `status: todo`**, which hides the status line. Only statuses stated in the brief are shown: Comfy Shoes "production" → In service; CRM "deploying" → In progress.
20. **Chatly and RetailBridge have no `organisation`.** The brief doesn't say who owns them. They default to `confidential: true` until confirmed.
21. **Docker and CI/CD are both marked "in apprenticeship".** The brief says "where I'm still learning" without naming which; both carry a TODO to confirm.
22. **A "Provenance" strip (career and education) was added between Crafts and Apprenticeship.** The brief lists the roles and degrees but no section for them. It uses only the supplied dates, and the freelance start date is a TODO.
23. **"This gallery" (portfolio.md) is `draft: true`.** The brief says to add it once live. Drafts appear in `astro dev` only.
24. **A plain-text catalogue lives at `/works/`** for visitors who skim. It is linked from the hall.

## Motion

25. ~~**GSAP + ScrollTrigger, no Lenis.**~~ _Superseded by 41._ Smooth-scroll hijacking hurts low-end Android and assistive tech; native scroll plus scrubbed ScrollTrigger gives most of the feel. GSAP is imported dynamically, after the page has rendered.
26. ~~**The horizontal walk runs only at ≥ 64rem with a fine pointer.**~~ _Superseded by 40._ Phones and tablets get a vertical hang with reveals. Keyboard focus on an off-screen painting scrolls the walk to it.
27. **Stepping into a painting uses native cross-document View Transitions** (`@view-transition`), with no client router. Only the clicked painting gets the shared `view-transition-name` (set in `pageswap`/`pagereveal`). Browsers without support just navigate.
28. **`prefers-reduced-motion: reduce` disables all of it**: no GSAP initialisation, no view transitions, and CSS transitions are cut to ~0. The CSS layout is the complete static fallback.

## Images

29. _(Still true for `npm run art:generate`; ChatGPT is now the primary route — see 43.)_ **The painting model defaults to `gpt-image-1`, as briefed.** The installed OpenAI SDK also lists `gpt-image-2` and `gpt-image-2.5-*`. Set the `PAINTING_MODEL` repo variable to try one; no other change is needed.
30. ~~**Portrait 1024×1536 for works, 1024×1024 tondi for crafts**~~ _Superseded by 42._, published as AVIF and WebP at 480, 768 and 1024 px, plus a 1200×630 JPEG share card per project. Social crawlers don't reliably read AVIF/WebP.
31. **Filenames carry the revision** (`<key>-r<rev>-<width>.<ext>`), which is what makes `immutable` caching safe. `content/paintings.json` is only updated after a successful upload.
32. ~~**Generation runs in GitHub Actions** (`paintings.yml`)~~ _Superseded by 43._, with the key as a repo secret and WIF for the bucket. No key on a laptop or in this repo, though local runs with `.env` still work.
33. **The share image for the home page (`public/og-default.jpg`) and the touch icon are committed.** They are small brand assets rendered by `scripts/make-static-assets.mjs`, not generated paintings.

## Deployment

34. **`deploy.yml` also runs on `v2-gallery` until the merge**, so the skeleton is live first, as the brief asks. The deploy job skips cleanly until the WIF variables exist.
35. **An extra repo variable, `GCP_PROJECT_ID`,** is needed for the Artifact Registry path. `RUN_SA` (the runtime identity) is optional but recommended.
36. **Least-privilege IAM, tighter than `portfolio-ops.md`.** `iam.serviceAccountUser` is granted on the runtime SA only (not project-wide), `artifactregistry.writer` on the one repository, and `storage.objectAdmin` on the one bucket. `run.admin` stays project-level, because `--allow-unauthenticated` needs `setIamPolicy`.
37. **The image is rebuilt in the deploy job from the same commit** using the GitHub Actions layer cache, rather than shipping a tarball between jobs. Lighthouse in `ci.yml` runs against that same Dockerfile and lockfile.
38. **Lighthouse CI runs against the real Caddy container**, so headers and compression are part of what is measured: mobile emulation, median of 3 runs, every category ≥ 0.90. Measured locally on 2026-10-16 before any paintings existed: performance 97–99, accessibility 100, best practices 100, SEO 100.

## 2026-10-16 · The Edition redesign

Ntsika's verdict on the first build: it "missed the design and feeling of the Shopify build". Correct: the Winter '26 Edition is a scroll-driven run of full-screen, 3D-layered Renaissance paintings with parallax depth, scroll-scrubbed camera moves and brushstroke transitions between scenes. The first build hung small framed pictures on a wall. The live reference site couldn't be inspected from the build environment (shopify.com and awwwards.com are blocked by its network policy), so the redesign follows the published descriptions (RGD, Awwwards, Shopify News). It recreates the *techniques* with original code and art. No Shopify assets, code or branding are used.

39. **Frontispiece: one gilded frame on the damask wall.** Scrolling pins it and flies the camera through the frame until the painting fills the screen; then the value statement and calls to action land over the painting. This is the hand-off from "gallery" to "edition".
40. **Chapters replace the hall.** Each work is a full-screen painted chapter. They share one pinned stage and play as a scroll-scrubbed sequence. Each chapter is wiped in with a dry-brush mask (`public/brush-wipe.webp`, ~29 KB, rendered by `scripts/make-static-assets.mjs`), while its layers drift at speeds set by their `depth`. Copy and a brass plaque rise in, then clear before the next wipe.
41. **Lenis smooth scrolling, on fine pointers only.** The cinematic feel depends on it; touch devices keep native scrolling, and reduced motion gets none. This reverses decision 25.
42. **Scenes are layered.** A scene is one painting cut into up to four aligned layers (backdrop + transparent cut-outs), 1536×1024 landscape, plus square 1024 tondi for crafts. A scene with only `full.png` still renders, with a camera push and no depth. Until art exists, each scene shows a **sinopia**, the red-ochre under-drawing a fresco painter puts on the plaster, drawn as two SVG layers so the depth still reads.
43. **Ntsika paints in ChatGPT; the site does the rest.** `npm run art:brief` writes ART.md from the content files, with every master prompt and layer-extraction prompt ready to paste. Exports go in `art/<scene>/`. `npm run art:process` previews locally (same-origin, gitignored), and `--upload` publishes to GCS. The **Art** workflow does the same from `gs://…/originals/`. `npm run art:generate` (OpenAI API, with `images.edit` for the cut-outs) remains an optional route.
44. **Contents page** after the opening: an editorial table of contents with Roman numerals, linking into the sequence. The anchors resolve to the moment each chapter is fully shown, not to the top of the pinned stage. **A chapter rail** (right edge on desktop, top progress bar on phones) shows where you are.
45. **Brushed edges** (`public/brush-edge.webp`) where parchment sections meet paintings.
46. **Project rooms open on a full-bleed scene**, the same painting as the chapter. The view transition morphs the chapter's scene into the room's hero.
47. **Performance guard: the chapter sequence is built lazily**, when the reader comes within 1.5 screens of it, a chapter link is clicked, or the URL points into it. Building it at load cost ~570 ms of main-thread time under Lighthouse's mobile CPU throttle and pulled the home page to 84–89. Lazy, with layered test art in place: home 95–96, rooms 96–97, accessibility, best practices and SEO all 100.
48. **Copy is faded with opacity, never `visibility`**, so every chapter link stays in the tab order. Focusing one scrolls the sequence to that chapter. Inactive chapters get `pointer-events: none`.
49. **Cut-outs are re-seated on the master painting** (`scripts/lib/align.ts`, run by `art:process`). Image models redraw a cut-out rather than cut it. In the first API run the draughtsman came back 1.87× too large, and two "foreground" objects were invented outright. For each transparent layer the processor searches scale and offset for the best fit on `full.png`, coarse to fine, then confirms the fit by structural correlation. Real cut-outs scored 0.97 and 0.89; invented objects 0.44 and 0.04; the threshold is 0.6. A matched cut-out is rebuilt from the master's own pixels under its re-positioned silhouette, so it lines up exactly. The backdrop becomes the master everywhere except behind the cut-outs. An invented object is kept only if it stays out of the centre of the picture (framing columns, yes; a balustrade across the subject, no). `--no-align` turns it off.
50. **Node's `fetch` ignores `HTTPS_PROXY`.** Inside a proxied cloud session, run the API generator with `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21). GitHub runners and normal machines don't need it.
51. **First real art (hero + Chatly, gpt-image-1, high quality):** about 70–90 s per image. Lighthouse mobile with it in place: home 95, rooms 95–97, the rest 100; home page 265 KiB in total.
52. **No floating WhatsApp button** (Ntsika, 2026-10-17: "looks a bit tacky"). It overrides the original brief. WhatsApp stays as a call to action in the frontispiece and as a channel in Patronage.
53. **A cut-out that duplicates an earlier one is dropped.** If more than 30% of a re-seated layer is already covered by an earlier cut-out, it goes. Two layers holding the same pixels would shear apart in parallax. First seen in CRM on AWS, where the "foreground" ledger was 99% inside the clerk's cut-out.
54. **A scene may ship as a single painting.** RetailBridge came back from ChatGPT with a "plate" byte-identical to the master (no porters removed) and a "figures" layer that was a fresh, larger frieze rather than a cut-out (dropped by the aligner). The invented foreground boat and reeds technically passed the edge-framing rule but hid the tagged bundles that carry the scene's meaning and left a white halo, so I removed it by hand. The master alone gets the slow camera push. Deriving cut-outs by differencing master and plate was considered and rejected: ChatGPT's plates differ from their masters in 5–23% of pixels even at quarter resolution outside the figures, so the difference isn't a silhouette.
55. **Self-hosted Sentry on OCI is hidden (`draft: true`)** — Ntsika, 2026-10-20: "I haven't done Sentry". Nothing on the site may claim work that isn't done. The file stays so it can come back with one line once the work exists. The Edition now runs to five chapters.
56. **Tondi are cropped to their painted disc.** ChatGPT paints a medallion as a disc on a dark ground, not always centred: the delivery and business discs sat about 10 px off-centre. The site clips each medallion to a circle at the canvas edge. `findDisc` (`scripts/lib/align.ts`) finds the disc from pixels that differ from the corner colour. `art:process` then crops every square scene to 98% of that disc before resizing, so no dark ring shows inside the gilt frame.
57. **The Finale's layers came from the API** (Ntsika, 2026-10-26: "use the openai api key to generate the last two"). The master is Ntsika's ChatGPT painting. The desk-and-chair cut-out re-seated at scale 1.000, match 0.87. The backdrop keeps a faint ghost of the desk; at full parallax shift only a sliver shows, and under the patronage veil.
58. **`gpt-image-1` is retired** and returns 400 "model does not exist", although `models.list()` still lists it. The new default is `gpt-image-2`. It rejects `input_fidelity` (it always edits at high fidelity) and cannot output transparency. Transparent cut-outs therefore go to `CUTOUT_MODEL`, default `gpt-image-1.5`, which does both. Supersedes 29.
59. **Paintings are served from `gs://ntsikagqiba-assets/paintings/`** (2026-10-27). They were converted in the Claude session, then uploaded by Ntsika from Cloud Shell with `deploy/publish-art.sh`, so the session never held cloud credentials. Checked after upload: all 151 files return 200, with the correct `Content-Type`, `public, max-age=31536000, immutable`, and byte sizes identical to the local conversions. The originals are in `originals/`, so the Art workflow can rebuild from them. `content/paintings.json` now carries all 11 published scenes.
60. **The health route is `/health`, not `/healthz`.** The first deploy (revision `portfolio-00001-p2m`) went live, but its smoke test failed with a 404 on `/healthz`. Cloud Run's front end reserves URL paths ending in `z` and answers them itself, so the request never reached Caddy. The local container test in CI could not catch this, because it doesn't go through Google's front end.
