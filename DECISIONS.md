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
12. **Container runs as a non-root user** with a read-only-friendly setup (Caddy state in `/tmp`), plus a `/healthz` route for smoke tests.

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

25. **GSAP + ScrollTrigger, no Lenis.** Smooth-scroll hijacking hurts low-end Android and assistive tech; native scroll plus scrubbed ScrollTrigger gives most of the feel. GSAP is imported dynamically, after the page has rendered.
26. **The horizontal walk runs only at ≥ 64rem with a fine pointer.** Phones and tablets get a vertical hang with reveals. Keyboard focus on an off-screen painting scrolls the walk to it.
27. **Stepping into a painting uses native cross-document View Transitions** (`@view-transition`), with no client router. Only the clicked painting gets the shared `view-transition-name` (set in `pageswap`/`pagereveal`). Browsers without support just navigate.
28. **`prefers-reduced-motion: reduce` disables all of it**: no GSAP initialisation, no view transitions, and CSS transitions are cut to ~0. The CSS layout is the complete static fallback.

## Images

29. **The painting model defaults to `gpt-image-1`, as briefed.** The installed OpenAI SDK also lists `gpt-image-2` and `gpt-image-2.5-*`. Set the `PAINTING_MODEL` repo variable to try one; no other change is needed.
30. **Portrait 1024×1536 for works, 1024×1024 tondi for crafts**, published as AVIF and WebP at 480, 768 and 1024 px, plus a 1200×630 JPEG share card per project. Social crawlers don't reliably read AVIF/WebP.
31. **Filenames carry the revision** (`<key>-r<rev>-<width>.<ext>`), which is what makes `immutable` caching safe. `content/paintings.json` is only updated after a successful upload.
32. **Generation runs in GitHub Actions** (`paintings.yml`), with the key as a repo secret and WIF for the bucket. No key on a laptop or in this repo, though local runs with `.env` still work.
33. **The share image for the home page (`public/og-default.jpg`) and the touch icon are committed.** They are small brand assets rendered by `scripts/make-static-assets.mjs`, not generated paintings.

## Deployment

34. **`deploy.yml` also runs on `v2-gallery` until the merge**, so the skeleton is live first, as the brief asks. The deploy job skips cleanly until the WIF variables exist.
35. **An extra repo variable, `GCP_PROJECT_ID`,** is needed for the Artifact Registry path. `RUN_SA` (the runtime identity) is optional but recommended.
36. **Least-privilege IAM, tighter than `portfolio-ops.md`.** `iam.serviceAccountUser` is granted on the runtime SA only (not project-wide), `artifactregistry.writer` on the one repository, and `storage.objectAdmin` on the one bucket. `run.admin` stays project-level, because `--allow-unauthenticated` needs `setIamPolicy`.
37. **The image is rebuilt in the deploy job from the same commit** using the GitHub Actions layer cache, rather than shipping a tarball between jobs. Lighthouse in `ci.yml` runs against that same Dockerfile and lockfile.
38. **Lighthouse CI runs against the real Caddy container**, so headers and compression are part of what is measured: mobile emulation, median of 3 runs, every category ≥ 0.90. Measured locally on 2026-10-16 before any paintings existed: performance 97–99, accessibility 100, best practices 100, SEO 100.
