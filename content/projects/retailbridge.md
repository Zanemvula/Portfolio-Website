---
title: RetailBridge
summary: RFID stock control for Comfy Shoes on Chainway handhelds — 7,610 SKUs tagged and integrated with IQ Retail stock exports.
year: "TODO: year(s)"
status: in-progress
order: 5
draft: false
confidential: true
organisation: LNS Corporation
clouds: [] # TODO: where it runs
problem: "TODO: 2–3 sentences — what went wrong with stock control before RFID?"
role: Building it.
stack:
  - RFID
  - Chainway handhelds
  - Android RFID SDK (Java, Kotlin)
  - IQ Retail
links: {}
scene:
  prompt: "A broad stone bridge over a river at evening, crowded with porters carrying countless small bundles tied with coloured cords and wax tags from a great warehouse on the left bank to a bustling market on the right bank"
  revision: 1
  alt: "Porters carrying thousands of tagged bundles across a stone bridge from a warehouse to a market."
  focus: center
  layers:
    - { id: plate, depth: 0, transparent: false, contains: "the river, the empty bridge, the warehouse, the market and the evening sky, with every porter removed" }
    - { id: figures, depth: 0.55, transparent: true, contains: "only the porters and their bundles" }
    - { id: foreground, depth: 1, transparent: true, contains: "only the riverside reeds and the moored boat along the bottom edge" }
architecture:
  tiers:
    - label: Floor
      nodes:
        - { id: rfid, label: "Chainway RFID handhelds", note: "Android RFID SDK" }
    - label: Platform
      nodes:
        - { id: rb, label: "RetailBridge", note: "7,610 SKUs tagged" }
    - label: Stock system
      nodes:
        - { id: iq, label: "IQ Retail" }
  edges:
    - { from: rfid, to: rb, label: "tag reads" }
    - { from: iq, to: rb, label: "stock exports" }
log: [] # TODO: dated entries
---

I am building RFID stock control on Chainway handhelds for LNS Corporation. RetailBridge is the Comfy Shoes system: 7,610 SKUs are tagged, and it is integrated with IQ Retail stock exports.

- Handheld software on the Chainway Android RFID SDK, in Java and Kotlin.
- Alongside it, an offline-first stocktake app for the Premium Aluminium showroom, on the same handhelds.

<!-- TODO: what you built, in bullets; where it runs; whether it feeds the online store. -->
