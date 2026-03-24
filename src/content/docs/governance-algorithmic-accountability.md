---
permalink: governance-algorithmic-accountability
title: Algorithmic Accountability
chapter: Chapter 3
chapterOrder: 3
order: 2
status: published
description: Frameworks for auditing and governing automated decision-making systems.
---

> **Disclaimer:** This is placeholder content created to demonstrate the features of the Scaffold starter template. The organizations, people, and projects referenced here are fictional.

Algorithms increasingly mediate access to housing, employment, credit, and justice. When these systems produce biased outcomes, affected individuals often have no recourse.

## Algorithmic Impact Assessments

Before deploying an automated system, conduct a structured assessment:

1. **Purpose** — What decision does this system make? Is automation appropriate?
2. **Data audit** — Does the training data reflect historical biases?
3. **Disparate impact analysis** — Are there significant differences across demographic groups?
4. **Redress mechanisms** — Can affected individuals challenge a decision?

![Sample background](/src/assets/backgrounds/anna-magenta-DJ7FzM_WZXs-unsplash.jpg)

## Fairness Metrics

No single definition of fairness applies universally:

```python
def demographic_parity(predictions, groups):
    """Check if decision rates are equal across groups."""
    rates = {}
    for group in set(groups):
        mask = [g == group for g in groups]
        group_preds = [p for p, m in zip(predictions, mask) if m]
        rates[group] = sum(group_preds) / len(group_preds)
    return rates

def equalized_odds(predictions, actuals, groups):
    """Check if TPR and FPR are equal across groups."""
    metrics = {}
    for group in set(groups):
        mask = [g == group for g in groups]
        tp = sum(1 for p, a, m in zip(predictions, actuals, mask)
                 if m and p == 1 and a == 1)
        fp = sum(1 for p, a, m in zip(predictions, actuals, mask)
                 if m and p == 1 and a == 0)
        metrics[group] = {'tpr': tp, 'fpr': fp}
    return metrics
```

## Building Accountable Systems

For technologists building public interest tools:

- **Document everything** — Training data choices, model architecture, deployment context
- **Test for bias before deployment** — Not after harm has occurred
- **Build in human oversight** — Automated systems should inform decisions, not replace judgment
- **Create feedback loops** — Make it easy for affected individuals to report problems
- **Plan for failure** — Design rollback procedures and remediation plans in advance
