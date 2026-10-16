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
painting:
  prompt: A Renaissance archive of patrons' correspondence, a wall of wooden pigeonholes filled with folded letters, a clerk entering a new patron's name into a great bound register, and through the window masons using a wooden crane to raise a stone into a new wing of the building
  revision: 1
  alt: A clerk recording a new patron in a great register while masons raise a stone into a new wing outside.
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
