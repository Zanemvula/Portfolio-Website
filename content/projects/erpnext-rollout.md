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
painting:
  prompt: Stewards from several branch houses arriving at a great vaulted hall, each carrying a bound ledger to a long oak table where a single master ledger lies open, clerks reconciling columns by candlelight and daylight from tall windows
  revision: 1
  alt: Stewards from several houses bringing their ledgers to one master ledger in a vaulted hall.
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
