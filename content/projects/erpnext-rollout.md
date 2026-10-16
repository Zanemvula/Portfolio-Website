---
title: ERPNext rollout
summary: Led the ERPNext (Frappe) implementation across all LNS Corporation branches, on a Linux VPS.
year: "TODO: year(s)"
status: todo # TODO: live | in-progress
order: 3
draft: false
confidential: true
organisation: LNS Corporation
clouds: [linux]
problem: "TODO: 2–3 sentences — how were the branches run before ERPNext?"
role: Implementation lead — led the rollout across all branches.
stack:
  - ERPNext
  - Frappe
  - Linux VPS
  # TODO: VPS provider, OS, database, backups, what you automated
links: {}
scene:
  prompt: "Stewards from several branch houses, each carrying a bound ledger, converge on a long oak table in a vaulted hall where a single great master ledger lies open; clerks reconcile its columns; daylight from tall windows"
  revision: 1
  alt: "Stewards from several houses bringing their ledgers to one master ledger in a vaulted hall."
  focus: center
  layers:
    - { id: plate, depth: 0, transparent: false, contains: "the empty vaulted hall, windows, the long table and the open master ledger, with every person removed" }
    - { id: figures, depth: 0.55, transparent: true, contains: "only the stewards and the clerks" }
    - { id: foreground, depth: 1, transparent: true, contains: "only the stack of ledgers and the candlestick along the bottom edge" }
architecture:
  # TODO: hosting details
  tiers:
    - label: Users
      nodes:
        - { id: branches, label: LNS branches, note: all branches }
    - label: Application
      nodes:
        - { id: erp, label: ERPNext, note: Frappe }
    - label: Host
      nodes:
        - { id: vps, label: Linux VPS }
  edges:
    - { from: branches, to: erp }
    - { from: erp, to: vps }
log: [] # TODO: dated entries
---

I led the ERPNext (Frappe) implementation across all LNS Corporation branches, hosted on a Linux VPS.

<!-- TODO: hosting details (provider, sizing, backups). -->
<!-- TODO: what you automated. -->
