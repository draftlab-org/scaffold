---
permalink: building-encrypted-messaging
title: Encrypted Messaging
chapter: Chapter 2
chapterOrder: 2
order: 2
status: published
description: Implementing end-to-end encryption for secure communications.
---

> **Disclaimer:** This is placeholder content created to demonstrate the features of the Scaffold starter template. The organizations, people, and projects referenced here are fictional.

End-to-end encryption (E2EE) ensures that only the communicating parties can read the messages — not the service provider, not the network operator, and not an attacker who compromises the server.

## The Signal Protocol

The Signal Protocol combines several cryptographic primitives:

### Double Ratchet Algorithm

Each message is encrypted with a unique key derived from a continuously evolving chain. If a single key is compromised, past and future messages remain secure.

```python
def ratchet_step(state):
    """Advance the symmetric ratchet by one step."""
    state.chain_key = hmac_sha256(state.chain_key, b'\x02')
    message_key = hmac_sha256(state.chain_key, b'\x01')
    state.message_number += 1
    return message_key
```

### X3DH Key Agreement

Extended Triple Diffie-Hellman establishes a shared secret between two parties, even when one is offline. It combines identity keys, signed pre-keys, and one-time pre-keys.

![Sample background](/src/assets/backgrounds/anna-magenta-XUCfqIEudBU-unsplash.jpg)

## Metadata Protection

Encrypting content is necessary but insufficient. Metadata — who communicates with whom and when — can be equally revealing.

- **Sealed sender** — The server cannot see who sent a message
- **Private contact discovery** — Determine which contacts use the service without uploading your address book in plaintext
- **Padding** — Add random bytes so message length does not reveal content type

## Implementation Considerations

```typescript
// Do not roll your own crypto — use audited libraries
import { SignalProtocol } from '@lib/signal-protocol';

const session = await SignalProtocol.createSession({
  localIdentity: myKeyPair,
  remoteIdentity: recipientPublicKey,
  preKey: recipientPreKey,
});

const encrypted = await session.encrypt(plaintext);
```

Key takeaways: use audited libraries, plan for key loss, and make security features usable by non-technical users.
