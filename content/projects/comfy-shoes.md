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
painting:
  prompt: A Renaissance cobbler's bottega opening onto a sunlit stone arcade, rows of finished leather shoes on wooden shelves, an apprentice wrapping a pair in cloth for a waiting buyer, warm workshop light
  revision: 1
  alt: A Renaissance cobbler's workshop with rows of finished leather shoes opening onto a sunlit arcade.
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
