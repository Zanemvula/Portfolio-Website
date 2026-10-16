---
title: Self-hosted Sentry on OCI
summary: Self-hosted error tracking for my production services, running on my Oracle Cloud VPS.
year: "TODO: year"
status: todo # TODO: live | in-progress
order: 6
draft: false
confidential: false
clouds: [oci]
problem: "TODO: 2–3 sentences — why self-host error tracking?"
role: Set up and run it myself.
stack:
  - Sentry (self-hosted)
  - Oracle Cloud
  # TODO: install method, sizing, which services report to it
links:
  github: "TODO: case-study repo URL once it exists"
painting:
  prompt: A night watchman in a stone tower above a walled Renaissance town holding a lantern, a bronze signal bell beside him, the town's streets lit by scattered torches below and a moonlit sky over the hills
  revision: 1
  alt: A night watchman with a lantern and a bell in a tower above a walled town.
architecture:
  tiers:
    - label: Services
      nodes:
        - { id: apps, label: My production services }
    - label: Observability
      nodes:
        - { id: sentry, label: Sentry, note: self-hosted }
    - label: Host
      nodes:
        - { id: vps, label: Oracle Cloud VPS }
  edges:
    - { from: apps, to: sentry, label: errors }
    - { from: sentry, to: vps }
log: [] # TODO: dated entries
---

I run a self-hosted Sentry instance on my Oracle Cloud VPS to track errors from my production services.

<!-- TODO: status, which services report to it, how it is maintained. -->
