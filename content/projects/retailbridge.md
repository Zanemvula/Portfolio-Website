---
title: RetailBridge
summary: An RFID-integrated inventory and e-commerce platform connecting 7,600+ SKUs to the online store.
year: "TODO: year(s)"
status: todo # TODO: live | in-progress | paused
order: 5
draft: false
confidential: true
# organisation: TODO: who owns RetailBridge?
clouds: [] # TODO: where it runs
problem: "TODO: 2–3 sentences — what went wrong between stock on the floor and the online store?"
role: "TODO: your role on RetailBridge"
stack:
  - RFID
  # TODO: stack
links: {}
painting:
  prompt: A broad stone bridge over a river crowded with porters carrying countless small bundles, each tied with a coloured cord and wax tag, from a great warehouse on one bank to a bustling market on the other, evening light
  revision: 1
  alt: Porters carrying thousands of tagged bundles across a stone bridge from a warehouse to a market.
architecture:
  # TODO: real components
  tiers:
    - label: Floor
      nodes:
        - { id: rfid, label: RFID }
    - label: Platform
      nodes:
        - { id: inv, label: Inventory, note: "7,600+ SKUs" }
    - label: Channel
      nodes:
        - { id: shop, label: Online store }
  edges:
    - { from: rfid, to: inv }
    - { from: inv, to: shop }
log: [] # TODO: dated entries
---

RetailBridge connects RFID-tracked inventory — more than 7,600 SKUs — to the online store.

<!-- TODO: what you built, in bullets. -->
<!-- TODO: status and stack. -->
