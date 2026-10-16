---
title: Comfy Shoes e-commerce
summary: The production e-commerce platform for LNS Corporation's footwear retail brand, built and run on Oracle Cloud.
year: "TODO: year(s)"
status: live
order: 2
draft: false
confidential: true
organisation: LNS Corporation
clouds: [oci]
problem: "TODO: 2–3 sentences — what did the brand need before the platform?"
role: Built and runs the platform on Oracle Cloud.
stack:
  - Oracle Cloud
  # TODO: storefront platform / framework, database, payments, CDN, monitoring
links:
  live: "TODO: storefront URL (public site only)"
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
  # TODO: replace with the real architecture
  tiers:
    - label: Customers
      nodes:
        - { id: shoppers, label: Online shoppers }
    - label: Platform
      nodes:
        - { id: store, label: Comfy Shoes store, note: Oracle Cloud }
  edges:
    - { from: shoppers, to: store }
log: [] # TODO: dated entries
---

I built the Comfy Shoes e-commerce platform for LNS Corporation's footwear retail brand and run it in production on Oracle Cloud.

<!-- TODO: what you built, in bullets. -->
<!-- TODO: how it is deployed, backed up and monitored. -->
