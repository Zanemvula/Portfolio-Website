---
title: CRM on AWS
summary: Deploying LNS Corporation's CRM on AWS, including the deployment workflow.
year: "TODO: year, e.g. 2026"
status: in-progress
order: 4
draft: false
confidential: true
organisation: LNS Corporation
clouds: [aws]
problem: "TODO: 2–3 sentences — why the CRM is moving to AWS / what it replaces."
role: Deploying the CRM on AWS and building its deployment workflow.
stack:
  - AWS
  # TODO: AWS services, IaC tool, CI/CD system
links: {}
scene:
  prompt: "An archive of patrons' correspondence: a wall of wooden pigeonholes filled with folded letters, a clerk entering a new patron into a great bound register; through a large window on the right, masons raise a stone into a new wing with a wooden crane"
  revision: 1
  alt: "A clerk recording a new patron in a great register while masons raise a stone into a new wing outside."
  focus: left
  layers:
    - { id: plate, depth: 0, transparent: false, contains: "the archive room, the pigeonholes and the view through the window including the crane and masons, with the clerk removed" }
    - { id: figures, depth: 0.55, transparent: true, contains: "only the clerk at the desk" }
    - { id: foreground, depth: 1, transparent: true, contains: "only the open register, inkwell and quills along the bottom edge" }
architecture:
  # TODO: services, IaC and CI details
  tiers:
    - label: Delivery
      nodes:
        - { id: pipeline, label: Deployment workflow }
    - label: Platform
      nodes:
        - { id: crm, label: LNS CRM, note: AWS }
  edges:
    - { from: pipeline, to: crm, label: deploys }
log: [] # TODO: dated entries
---

I am deploying LNS Corporation's CRM on AWS, including the workflow that deploys it.

<!-- TODO: what you built, in bullets — services, IaC, CI/CD. -->
