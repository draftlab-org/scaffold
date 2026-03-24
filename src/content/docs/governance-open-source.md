---
permalink: governance-open-source
title: Open Source Governance
chapter: Chapter 3
chapterOrder: 3
order: 1
status: published
description: Governance models for open source projects serving the public interest.
---

> **Disclaimer:** This is placeholder content created to demonstrate the features of the Scaffold starter template. The organizations, people, and projects referenced here are fictional.

Open source without governance defaults to the rule of whoever has commit access. This creates bus factor risks, corporate capture, and contributor burnout.

![Sample background](/src/assets/backgrounds/anna-magenta--NUiL7xSUHA-unsplash.jpg)

## Governance Models

### Benevolent Dictator for Life (BDFL)

A single person has final authority. Fast decisions, clear authority, but a single point of failure.

### Steering Committee

A small elected group makes strategic decisions. Balances speed and inclusivity:

```yaml
# Example governance config
steering_committee:
  seats: 5
  term_months: 12
  election: ranked_choice
  quorum: 3
  decisions:
    - type: breaking_change
      requires: supermajority
    - type: new_feature
      requires: simple_majority
    - type: security_patch
      requires: single_maintainer
```

### Foundation Model

The project is housed within a nonprofit foundation that provides legal, financial, and governance infrastructure.

## Key Documents

Every mature project should have:

- **Code of Conduct** — Behavioral expectations with enforcement procedures
- **Contributing Guide** — How to file issues, submit PRs, and get decisions made
- **Governance Charter** — Roles, responsibilities, and conflict resolution

```markdown
## Decision Process

1. Proposal filed as RFC issue
2. 14-day comment period
3. Steering committee vote
4. Implementation begins after approval
5. Post-implementation review at next meeting
```

## Sustainability

Open source governance must address financial sustainability through grants, sponsorships, paid support, or cooperative models.
