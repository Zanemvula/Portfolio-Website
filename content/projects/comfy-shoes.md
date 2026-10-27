---
title: Comfy Shoes e-commerce
summary: Headless commerce for LNS Corporation's footwear brand — a Medusa and Next.js store on Oracle Cloud, kept in sync with the in-store ERPNext till.
year: "TODO: year(s)"
status: live
order: 2
draft: false
confidential: true
organisation: LNS Corporation
clouds: [oci]
problem: "The store's stock and accounts lived in ERPNext, the till and stock master. The old WooCommerce site had no reliable link to it, so online stock drifted from the shelf, overselling was a constant risk and web orders were re-keyed by hand. ERPNext had to stay the single source of truth."
role: Designed, built and operate it.
stack:
  - Medusa 2
  - Next.js
  - ERPNext v16 (Frappe)
  - PostgreSQL
  - Redis
  - Paystack
  - Cloudflare
  - Docker Compose · Caddy
  - Sentry
  - Playwright · Lighthouse CI
links:
  caseStudy: https://github.com/Zanemvula/comfy-shoes-case-study
  live: "TODO: storefront URL once the cutover to comfyshoes.co.za is complete"
scene:
  prompt: "A Renaissance cobbler's workshop opening through stone arches onto a sunlit arcade market; wooden shelves of finished leather shoes, an apprentice wrapping a pair in linen for a waiting buyer, lasts and tools on the bench"
  revision: 1
  alt: "A Renaissance cobbler's workshop with shelves of leather shoes opening onto a sunlit arcade."
  focus: center
  layers:
    - { id: plate, depth: 0, transparent: false, contains: "the empty workshop, shelves of shoes, the arches and the arcade beyond, with the apprentice and the buyer removed" }
    - { id: figures, depth: 0.55, transparent: true, contains: "only the apprentice and the buyer" }
    - { id: foreground, depth: 1, transparent: true, contains: "only the workbench edge with its tools and a single pair of shoes along the bottom edge" }
architecture:
  tiers:
    - label: Edge and services
      nodes:
        - { id: cf, label: "Cloudflare", note: "DNS · CDN · TLS" }
        - { id: svc, label: "Paystack · The Courier Guy", note: "payments · shipping" }
    - label: "Oracle Cloud · Always Free"
      nodes:
        - { id: sf, label: "Next.js storefront" }
        - { id: med, label: "Medusa 2", note: "server + worker" }
        - { id: db, label: "Postgres · Redis" }
    - label: Sync
      nodes:
        - { id: hook, label: "Signed webhooks", note: "stock · prices" }
        - { id: outbox, label: "Outbox worker", note: "orders · payments · returns" }
        - { id: recon, label: "Reconciliation", note: "every 15 minutes" }
    - label: Store
      nodes:
        - { id: erp, label: "ERPNext v16 till", note: "stock · prices · accounts" }
  edges:
    - { from: cf, to: sf }
    - { from: sf, to: med }
    - { from: med, to: db }
    - { from: med, to: svc }
    - { from: erp, to: hook }
    - { from: hook, to: med }
    - { from: med, to: outbox }
    - { from: outbox, to: erp }
    - { from: recon, to: erp }
log: [] # TODO: dated entries (launch, cutover to comfyshoes.co.za)
---

I designed and built a headless commerce platform for Comfy Shoes, LNS Corporation's comfort-footwear retailer with a physical store at Northmead Square, Benoni. The online store and the shop's till share one stock and accounting system: a pair sold in-store disappears online within seconds, and every web order lands in ERPNext as proper accounting documents.

**Stock and prices: ERPNext to Medusa (push and reconcile)**

- A Frappe hook fires on every stock ledger entry and sends an HMAC-SHA256 signed webhook after the database commit.
- Medusa verifies the signature and a ±300 s timestamp window, deduplicates on event ID, drops stale events and takes a per-SKU lock before applying.
- Sellable stock is computed, not copied: on-hand stock, minus units on web fulfilments the ERP hasn't seen yet, minus a one-unit safety buffer when stock runs low. This prevents overselling the last pair.
- A reconciliation job pages through every ERPNext bin every 15 minutes, repairs drift and alerts above 2%.
- Price webhooks are only triggers. Medusa re-reads the price from ERPNext, so nothing can sell at a stale price.

**Orders, payments and returns: Medusa to ERPNext (transactional outbox)**

- Every commerce event writes an outbox row with a unique idempotency key, so redelivered events never create duplicates.
- An order becomes a Sales Order, a fulfilment a Delivery Note, a captured payment a Sales Invoice and Payment Entry, a refund a credit note, and a return a return Delivery Note.
- A worker drains the outbox every minute. Retryable failures back off exponentially; anything else, or anything still failing after 10 attempts, is dead-lettered.
- Staff get an ERP sync admin page with health badges and one-click retry. Alerts fire on a backlog, any dead-lettered row, drift above 2%, or a missed reconciliation.

**Deployed, backed up and monitored**

- Production and staging run on separate Arm VMs on Oracle Cloud's Always Free tier, so a staging deploy can never touch production. The running cost is R0 a month.
- Cloudflare handles DNS, TLS and edge caching. Oracle has no Johannesburg region, so caching covers the latency gap, and the origin accepts traffic only from Cloudflare.
- Nightly database dumps are copied off the VM to two providers, and boot volumes are backed up weekly. A restore was tested before launch and is repeated monthly.
- The accepted trade-off is that one VM is a single point of failure, with a runbook restore target under an hour. The till keeps selling regardless.
- Everything is containerised, so moving to Cloud Run with Cloud SQL, or to AWS, is about a day's work when traffic justifies it.
- Quality gates: a Playwright checkout journey that confirms the Sales Order arrived in ERPNext, axe accessibility checks on 14 pages and Lighthouse CI budgets. The gates caught a real launch blocker: a legacy redirect that sent `/checkout` to `/cart`.
- Monitoring: Sentry, uptime checks and the built-in sync health alerts.

The design is recorded in 18 architecture decision records, an integration specification, a runbook and a cutover checklist. The store is live on a temporary domain, and the cutover to comfyshoes.co.za is in progress. More in the [case study](https://github.com/Zanemvula/comfy-shoes-case-study), published with LNS Corporation's permission.
