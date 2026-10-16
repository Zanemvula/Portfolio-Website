---
title: Chatly
summary: A WhatsApp-native quote-to-payment platform. I built the backend on Google Cloud.
year: "TODO: year(s), e.g. 2025 or 2025–present"
status: todo # TODO: live | in-progress | paused | archived
order: 1
draft: false
confidential: true # TODO: confirm whether Chatly is your own product, a client's or LNS's
# organisation: TODO: who owns Chatly?
clouds: [gcp]
problem: "TODO: 2–3 sentences — who had what problem before Chatly?"
role: Backend engineer — I built the backend on Google Cloud.
stack:
  - Google Cloud
  - WhatsApp
  # TODO: Google Cloud services used (e.g. which compute, database, queues)
  # TODO: language / framework, payment provider
links:
  live: "TODO: public URL if one exists"
painting:
  prompt: Renaissance messengers on horseback and on foot carrying sealed letters with red wax seals between merchants' counting houses across a sunlit piazza, a merchant at a window receiving a letter and handing back a purse of coins
  revision: 1
  alt: Renaissance messengers carrying sealed letters between merchants across a sunlit piazza.
architecture:
  # TODO: replace with the real architecture once you supply the services
  tiers:
    - label: Channel
      nodes:
        - { id: wa, label: WhatsApp, note: customers }
    - label: Backend
      nodes:
        - { id: api, label: Chatly backend, note: Google Cloud }
  edges:
    - { from: wa, to: api, label: quote → payment }
log: [] # TODO: dated entries, e.g. { date: 2025-06, note: "Launched …" }
---

I built the backend for Chatly, a WhatsApp-native platform that takes a customer from quote to payment, on Google Cloud.

<!-- TODO: what you built, in bullets — components you personally designed, built or run. -->
<!-- TODO: architecture walk-through — how a message becomes a quote, then a payment. -->
