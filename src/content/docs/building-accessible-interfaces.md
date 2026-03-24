---
permalink: building-accessible-interfaces
title: Accessible Interfaces
chapter: Chapter 2
chapterOrder: 2
order: 3
status: published
description: Building digital tools that work for everyone.
---

> **Disclaimer:** This is placeholder content created to demonstrate the features of the Scaffold starter template. The organizations, people, and projects referenced here are fictional.

When civic technology is inaccessible, it excludes the very communities it aims to serve. An estimated 16% of the global population lives with a significant disability.

## The POUR Principles

WCAG organizes accessibility into four principles:

- **Perceivable** — Information presentable in ways all users can perceive
- **Operable** — Interactive elements usable by all, including keyboard-only users
- **Understandable** — Content and operation must be comprehensible
- **Robust** — Content reliably interpreted by assistive technologies

![Sample background](/src/assets/backgrounds/anna-magenta-YELG0ZVK5yw-unsplash.jpg)

## Semantic HTML First

Before reaching for ARIA, use the correct HTML elements:

```html
<!-- Accessible by default -->
<button type="button">Submit report</button>

<!-- Requires significant ARIA work to match -->
<div role="button" tabindex="0" aria-label="Submit report">
  Submit report
</div>
```

## Form Accessibility

Forms are where accessibility failures most directly harm users:

```html
<form>
  <fieldset>
    <legend>Contact Information</legend>

    <label for="email">Email address</label>
    <input id="email" type="email" autocomplete="email" required />

    <label for="message">Message</label>
    <textarea id="message" rows="4"></textarea>
  </fieldset>

  <button type="submit">Send</button>
</form>
```

## Testing Strategy

Automated tools catch roughly 30% of issues. A comprehensive strategy includes:

1. **Automated scanning** — axe-core or Lighthouse in CI
2. **Manual keyboard testing** — Tab through every page without a mouse
3. **Screen reader testing** — VoiceOver (macOS) and NVDA (Windows)
4. **User testing** — Include people with disabilities in research
