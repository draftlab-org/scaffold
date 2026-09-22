import type { Options as AutolinkHeadingsOptions } from 'rehype-autolink-headings';
import type { RehypeExpressiveCodeOptions } from 'rehype-expressive-code';
import type { Options as ExternalLinksOptions } from 'rehype-external-links';

/**
 * Shared configuration for the site's two markdown pipelines:
 *
 *   1. `astro.config.mjs` — Astro's own pipeline, for `.md` content
 *      collections (articles, docs). Configured via
 *      `markdown.processor: unified({...})`.
 *   2. `src/utils/renderMarkdown.ts` — a standalone unified pipeline, for
 *      markdown strings embedded in YAML/JSON content (richText sections,
 *      footer copy, cookie banner).
 *
 * Keeping the options here stops the two pipelines drifting apart.
 */

/** Open external links in a new tab, without leaking the referrer. */
export const externalLinksOptions: ExternalLinksOptions = {
  target: '_blank',
  rel: ['noopener', 'noreferrer'],
};

/**
 * Append a `#` anchor to every heading that has an id, so any section can be
 * linked to. Run after heading ids are assigned.
 *
 * The anchor is decorative (the heading text is the accessible name of the
 * section; the TOC offers keyboard navigation), so it's hidden from assistive
 * tech and taken out of the tab order. `ariaHidden` must be the *string*
 * 'true' — `aria-hidden=""` means "not hidden".
 *
 * The `#` itself is drawn in CSS (`.heading-anchor::before`) rather than as a
 * text node: Astro reads heading text *after* user plugins to build its
 * headings list, and a literal '#' would leak into TOC titles.
 */
export const autolinkHeadingsOptions: AutolinkHeadingsOptions = {
  behavior: 'append',
  headingProperties: { className: ['heading-anchor-group'] },
  properties: {
    className: ['heading-anchor'],
    // Opts out of the generic link styles in typography.css
    dataComponent: 'heading-anchor',
    ariaHidden: 'true',
    tabIndex: -1,
  },
  content: [],
};

/** Expressive Code settings, shared by the Astro integration and renderMarkdown. */
export const expressiveCodeOptions: RehypeExpressiveCodeOptions = {
  themes: ['catppuccin-frappe'],
  defaultProps: {
    // Enable word wrap by default
    wrap: true,
    // Disable wrapped line indentation for terminal languages
    overridesByLang: {
      'bash,ps,sh': { preserveIndent: false },
    },
  },
};
