---
title: This gallery
summary: This site — an Astro static build served by Caddy on Cloud Run, shipped by GitHub Actions with Workload Identity Federation.
year: "2026"
status: in-progress
order: 7
draft: true # Set to false once ntsikagqiba.com serves this build.
confidential: false
clouds: [gcp]
# TODO: confirm this problem statement (drafted from your brief)
problem: I needed a portfolio that proves the work rather than describing it, and that is cheap and boring to run.
role: Designed, built and operate it.
stack:
  - Astro
  - TypeScript
  - GSAP
  - Caddy
  - Docker
  - GitHub Actions
  - Workload Identity Federation
  - Artifact Registry
  - Cloud Run
  - Cloud Storage
  - Lighthouse CI
links:
  github: https://github.com/Zanemvula/Portfolio-Website
  live: https://ntsikagqiba.com
painting:
  prompt: Craftsmen on wooden scaffolding hanging gilded framed paintings along a long vaulted gallery, light streaming through high arched windows, a master directing the hang from the marble floor
  revision: 1
  alt: Craftsmen on scaffolding hanging gilded paintings along a long vaulted gallery.
architecture:
  tiers:
    - label: Source
      nodes:
        - { id: gh, label: GitHub, note: push to main }
    - label: Pipeline
      nodes:
        - { id: gha, label: GitHub Actions, note: lint · typecheck · build · Lighthouse }
        - { id: wif, label: Workload Identity Federation, note: no JSON keys }
    - label: Google Cloud · europe-west1
      nodes:
        - { id: ar, label: Artifact Registry }
        - { id: run, label: Cloud Run, note: Caddy · static build }
        - { id: gcs, label: Cloud Storage, note: paintings · media }
    - label: Visitors
      nodes:
        - { id: web, label: ntsikagqiba.com }
  edges:
    - { from: gh, to: gha }
    - { from: gha, to: wif, label: OIDC }
    - { from: wif, to: ar, label: push image }
    - { from: ar, to: run, label: deploy }
    - { from: run, to: web, label: HTML · CSS · JS }
    - { from: gcs, to: web, label: AVIF / WebP }
log:
  - { date: 2026-10-16, note: Rebuilt from the Google AI Studio scaffold as an Astro static site served by Caddy on Cloud Run. }
---

The site is a static Astro build — no server code, no client framework. Interactivity is a few kilobytes of vanilla TypeScript and GSAP, and it falls back to a static gallery when the visitor prefers reduced motion.

- **Build:** Astro content collections with zod schemas. Every project is one markdown file; the build fails if a file breaks the schema.
- **Serve:** a two-stage Docker image — Node builds, `caddy:2-alpine` serves pre-compressed Brotli/gzip files on port 8080 with a strict Content-Security-Policy and long-lived caching on hashed assets.
- **Ship:** GitHub Actions lints, type-checks, builds, runs Lighthouse CI against the real container (fails under 90), pushes the image tagged with the commit SHA to Artifact Registry and deploys to Cloud Run. It authenticates with Workload Identity Federation, so there are no service-account keys anywhere.
- **Media:** paintings are generated once, converted to AVIF and WebP at three widths, and served from Cloud Storage with immutable caching. They never enter git.
