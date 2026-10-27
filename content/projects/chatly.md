---
title: Chatly
summary: A multi-tenant WhatsApp commerce platform for South African small businesses — quotes, payment links and order records, on Google Cloud Run.
year: "2026–present"
status: in-progress
order: 1
draft: false
confidential: false
organisation: Vularis (Pty) Ltd
clouds: [gcp]
problem: "South African service and trades businesses quote, sell and get paid inside WhatsApp, by hand. Quotes are typed out, payment details are sent as screenshots, and nobody can see what was sold."
role: Founder and engineer. I designed, built and run it.
stack:
  - Cloud Run
  - WhatsApp Cloud API
  - Paystack
  - Firestore
  - Neon Postgres
  - Node.js · Express · TypeScript
  - Next.js
links:
  caseStudy: https://github.com/Zanemvula/chatly-case-study
  live: "TODO: public URL if one exists"
scene:
  prompt: "Renaissance messengers on horseback and on foot carrying sealed letters with red wax seals across a sunlit piazza between merchants' counting houses; on the right a merchant leans from an open window to receive a letter and hand back a purse of coins; a campanile and blue hills in the distance"
  revision: 1
  alt: "Renaissance messengers carrying sealed letters across a sunlit piazza between merchants' houses."
  focus: center
  layers:
    - { id: plate, depth: 0, transparent: false, contains: "the empty piazza, buildings, campanile, hills and sky, with every person and horse removed" }
    - { id: figures, depth: 0.55, transparent: true, contains: "only the messengers, their horses and the merchant at the window" }
    - { id: foreground, depth: 1, transparent: true, contains: "only the stone balustrade and the scattered letters along the bottom edge" }
architecture:
  tiers:
    - label: Channels
      nodes:
        - { id: wa, label: WhatsApp Cloud API, note: "customers chat here" }
        - { id: dash, label: Merchant dashboard, note: "Next.js static export" }
    - label: Platform
      nodes:
        - { id: run, label: Cloud Run service, note: "Express + TypeScript · europe-west1" }
        - { id: pay, label: Paystack, note: "one subaccount per merchant" }
    - label: Data and settlement
      nodes:
        - { id: fs, label: Firestore, note: "live carts · idempotency" }
        - { id: pg, label: Neon Postgres, note: "orders · system of record" }
        - { id: bank, label: "Merchant's bank" }
  edges:
    - { from: wa, to: run, label: webhooks }
    - { from: dash, to: run }
    - { from: run, to: pay, label: "payment links" }
    - { from: run, to: fs }
    - { from: run, to: pg }
    - { from: pay, to: bank, label: "settles direct" }
log:
  - { date: 2026-06, note: "Started Chatly under Vularis (Pty) Ltd." }
---

Chatly is a multi-tenant conversational-commerce platform. A merchant connects their own WhatsApp number. Chatly runs the ordering and quoting conversation on it, takes payment through the merchant's own payment account, records the sale and gives the merchant a dashboard over all of it. I designed, built and run it under Vularis (Pty) Ltd. It is in active development, at the founder-cohort stage.

- **One Cloud Run service** (Node.js, Express, TypeScript) serves the WhatsApp webhooks, the API and the merchant dashboard from the same origin. WhatsApp is integrated directly through the Cloud API as an Independent Tech Provider, with no reseller in between.
- **Two datastores, split by access pattern.** Firestore holds the hot path: tenant credentials, live conversation state and inbound-message idempotency. Postgres is the system of record for orders, customers, organisations and billing.
- **One money chokepoint.** Every payment, whether from chat checkout, a dashboard link, a PDF quote or a POS QR code, goes through one function. It refuses to create a link unless the merchant has their own Paystack subaccount, so no charge can settle to the platform account. Chatly never holds merchant money.
- **Orders are written only by the payment webhook**, only as paid or failed, so revenue figures read straight off the orders table.
- **Safe under scale-out.** Inbound messages are claimed with a Firestore create that fails if the document already exists. Payments are idempotent on the payment reference.
- **A deterministic state machine, not an LLM**, drives the conversation. Each timeout exists because production showed a customer could otherwise get stuck.
- **Multi-tenant authorisation in one place:** organisations, merchants and members with roles. Every route declares the capability it needs.

**Milestones.** Approved through Meta App Review for WhatsApp Business messaging and management. The quote-to-payment flow is proven end to end with a live transaction: a PDF quote and payment link delivered in WhatsApp, the money settled and the order recorded.

**Not done yet, on the roadmap:** an automated test suite, Cloud Scheduler for time-based automations, Secret Manager before the wider launch, and metrics and uptime checks beyond Cloud Logging and email alerts.

The full design, with 25+ architecture decision records behind it, is in the [case study](https://github.com/Zanemvula/chatly-case-study). The source is private.
