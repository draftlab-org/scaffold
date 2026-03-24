---
permalink: building-consent-frameworks
title: Consent Frameworks
chapter: Chapter 2
chapterOrder: 2
order: 1
status: published
description: Designing meaningful consent flows that respect user autonomy.
---

> **Disclaimer:** This is placeholder content created to demonstrate the features of the Scaffold starter template. The organizations, people, and projects referenced here are fictional.

Most consent implementations reduce to a single "I agree" checkbox — a legal formality that informs no one. Building meaningful consent requires rethinking the entire flow.

![Sample background](/src/assets/backgrounds/anna-magenta-vKhd5bnnolg-unsplash.jpg)

## What Meaningful Consent Looks Like

Meaningful consent is **informed**, **specific**, **granular**, **revocable**, and **current**.

## Consent Receipts

Give users a record of what they consented to:

```typescript
interface ConsentReceipt {
  id: string;
  timestamp: Date;
  purposes: {
    id: string;
    label: string;
    description: string;
    isRequired: boolean;
  }[];
  dataCategories: string[];
  expiresAt: Date | null;
  withdrawalUrl: string;
}
```

## Revocation Architecture

When a user revokes consent, your system should:

1. **Stop processing** — Immediately cease the revoked use
2. **Propagate** — Notify downstream systems and third parties
3. **Delete or anonymize** — Remove the relevant data
4. **Confirm** — Acknowledge the withdrawal to the user

```typescript
async function revokeConsent(userId: string, purposeId: string) {
  await db.consents.update(userId, purposeId, { status: 'revoked' });
  await propagateRevocation(userId, purposeId);
  await scheduleDataDeletion(userId, purposeId);
  await notifyUser(userId, { type: 'consent-revoked', purposeId });
}
```

## Anti-Patterns

- **Consent fatigue** — Asking so frequently that users click "yes" reflexively
- **Dark patterns** — Making "accept all" prominent while hiding granular controls
- **Bundled consent** — Requiring analytics consent to use core features
