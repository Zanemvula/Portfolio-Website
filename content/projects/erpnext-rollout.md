---
title: ERPNext rollout
summary: Led the ERPNext (Frappe) implementation across LNS Corporation's businesses, from requirements to configuration, print formats and staff guides.
year: "TODO: year(s)"
status: in-progress
order: 3
draft: false
confidential: true
organisation: LNS Corporation
clouds: [linux]
problem: "LNS Corporation is a holding company with aluminium manufacturing, glass retail, plastics and footwear retail businesses. Each business's stock, POS, sales and accounts are moving onto ERPNext. Premium Aluminium still runs a legacy IQ Retail system and POS, with supplier pricing spread across more than 20 catalogues."
role: Implementation lead, from requirements to configuration, print formats and staff guides.
stack:
  - ERPNext
  - Frappe
  - Linux VPS
  - IQ Retail (being replaced)
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
  tiers:
    - label: Businesses
      nodes:
        - { id: comfy, label: "Comfy Shoes", note: "footwear retail · in-store till" }
        - { id: premium, label: "Premium Aluminium", note: "moving off IQ Retail" }
        - { id: group, label: "Other LNS businesses", note: "glass retail · plastics" }
    - label: Application
      nodes:
        - { id: erp, label: "ERPNext", note: "stock · POS · sales · accounts" }
    - label: Host
      nodes:
        - { id: vps, label: "Linux VPS" }
  edges:
    - { from: comfy, to: erp }
    - { from: premium, to: erp, label: "scoping" }
    - { from: group, to: erp }
    - { from: erp, to: vps }
log: [] # TODO: dated entries
---

I led the ERPNext (Frappe) implementation across LNS Corporation's branches, hosted on a Linux VPS.

- Took each rollout from requirements through configuration to print formats and staff guides.
- ERPNext is the till, stock master and accounting system behind the Comfy Shoes store. The [Comfy Shoes e-commerce platform](/works/comfy-shoes/) syncs with it in both directions.
- Now scoping the replacement of Premium Aluminium's legacy IQ Retail system and POS with ERPNext. That starts with a current-state analysis of IQ Retail and the existing POS, then maps the supplier pricing spread across more than 20 catalogues and the move of stock, sales and the showroom POS.

<!-- TODO: hosting details (provider, sizing, backups) and what you automated. -->
