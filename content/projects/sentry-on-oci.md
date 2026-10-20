---
title: Self-hosted Sentry on OCI
summary: Self-hosted error tracking for my production services, running on my Oracle Cloud VPS.
year: "TODO: year"
status: todo # TODO: live | in-progress
order: 6
draft: true # Ntsika, 2026-10-20: not done yet — hidden until it is
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
scene:
  prompt: "Night: a watchman in a stone tower above a walled Renaissance town holds up a lantern beside a bronze signal bell; torches flicker through the streets below; moonlit hills beyond"
  revision: 1
  alt: "A night watchman with a lantern and a bell in a tower above a walled town."
  focus: right
  layers:
    - { id: plate, depth: 0, transparent: false, contains: "the walled town, torches, hills and moonlit sky, with the watchman and bell removed" }
    - { id: figures, depth: 0.55, transparent: true, contains: "only the watchman, his lantern and the bronze bell" }
    - { id: foreground, depth: 1, transparent: true, contains: "only the tower parapet stones along the bottom edge" }
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
