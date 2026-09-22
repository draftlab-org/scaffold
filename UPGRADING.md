# Upgrading

Notes for sites built from Scaffold when pulling a new version with `npm run update-from-scaffold`.

## 0.5 → 0.6

This release brings back features and fixes developed on sites built from Scaffold. Most schema changes still accept the old content shape, so an existing site keeps building. The items marked **action needed** need a change on your side.

### Before you merge

- **Node 22.12+ required.** `package.json` now has `"engines": { "node": ">=22.12.0" }` and `netlify.toml` pins `NODE_VERSION = "22"`.
- **Astro is bumped to `^7.3.3`**, and several markdown packages that were previously only transitive are now declared (`@astrojs/markdown-remark`, `unified`, `remark-parse`, `remark-rehype`, `rehype-raw`, `rehype-expressive-code`, `rehype-autolink-headings`). Run `npm install` after merging.
- **`.pages.yml` will likely conflict** if you've customised it — it changed substantially (category sync markers, new sections, buttons, social links, nested navigation, redirects, body images). Take Scaffold's version as the base and re-apply your changes.

### Action needed

- **Article `tags` are gone — use `categories`.** Articles have a single taxonomy now. Old `tags:` in frontmatter are ignored (not an error), so move any values you still want into `categories:` and add them to `src/content/categories/articles.json`. `getArticlesByTag` and `getAllTags` were removed from `@utils/articles`; related articles are now scored by shared categories.
- **FlexiSection is removed.** Pages using `type: flexi` (nested sections) won't build. Move the nested sections up to the page's top-level `sections:` list.
- **Button, Link and Tag are `.tsx` only.** `Button.astro`, `Link.astro` and `Tag.astro` are deleted. Update imports in your own components:
  ```diff
  - import Button from '@components/atoms/Button.astro';
  + import Button from '@components/atoms/Button.tsx';
  ```
  The `.tsx` atoms accept `class` as an alias for `className`, so existing Astro call sites keep working. `<Button href>` now renders an `<a>`.
- **Category dropdowns in the CMS are now synced, not fetched.** The old `options.fetch` pointing at `scaffold.draftlab.org/api/categories.json` never worked in Pages CMS (and pointed at Scaffold's categories, not yours). The update script re-syncs `.pages.yml` from your `src/content/categories/*.json` automatically; if it warns, run `npm run sync:pages-categories` and fix what it reports. If you added your own category dropdowns, wrap their `values:` in `# pages-cms:category-sync start <id>` / `# pages-cms:category-sync end` markers.
- **Umami moved to the site config and is off by default.** `Head.astro` no longer hardcodes Scaffold's Umami instance (which meant derived sites were reporting to it). To keep analytics, set `analytics.umami.src` and `analytics.umami.websiteId` in `src/content/site/config.json` (or in Site Settings in the CMS). It only loads on production builds.
- **Section `bgColor` must be in the palette.** Allowed values: `white`, `gray`, `gradient`, `primary-light`, `secondary-light`, `highlight-light`, `dark`, `highlight-dark` (see `src/utils/backgrounds.ts`). Anything else fails the build — add your own colour to the palette instead of using a raw class. The `gradient` background previously rendered nothing; it now draws primary → highlight.
- **Navigation children need `type: link` for CMS editing.** Menus now nest three levels (links and groups inside dropdowns). Old two-level menus still build — children without a `type` default to links — but Pages CMS won't recognise them until you add `"type": "link"` to each child.
- **Styles for new components live in `src/styles/scaffold.css`.** `src/styles/**` is `merge=ours`, so this file arrives on your first update and is imported by `BaseLayout`. Leave it unedited so future updates reach it; override its rules in your own stylesheets.

### Still accepted (migrate when convenient)

- **Social links are now a list.** `site.social` is `[{ platform, url }]` (see `src/utils/social.ts`); the old `{ github: "...", ... }` object still works. People gain optional `socialLinks`.
- **Partner `category` is now a list** of one or more categories. A single string is still accepted.
- **Buttons take a `link`** (page picker or external URL) instead of a free-text `href`. `href` is still accepted and shown as "Custom URL" in the CMS; when both are set, `link` wins.
- **Page `sections` may be empty** (`sections:` with no items no longer fails the build).

### New, nothing to do

- Section types: `callToAction`, `miniCta`, `testimonials`, `logoWall`, `featuredArticles`; `hero` gains an optional side image and alignment.
- Breadcrumbs (site-wide `showBreadcrumbs`, per-page `breadcrumbs`), share links (`share` in site config), article table of contents and related content (`relatedResources` on articles and resources).
- Filter bars on landing pages gain text search, sort and multi-select, synced to the URL.
- Full-text site search backed by a new `/api/search.json` index. Drafts no longer leak through any `/api/*.json` endpoint.
- CMS-managed redirects in `src/content/site/_redirects.json` (Scaffold's demo file is removed from your site by the update script; a missing file just means no redirects).
- Images in article and doc bodies uploaded through the CMS (`body-images` media entry).
- `#` anchors on markdown headings; TOC entries are real links.
- Scripts: `typecheck`, `lint`, `lint:fix`, `sync:pages-categories`. GitHub Actions: `sync-pages-categories.yml`, `linkcheck.yml` (see README).
- Performance: lighter hydration (`client:idle` / `client:visible` / `client:media`), resized webp card images, fewer preloaded fonts. Font preloads live in `fonts.config.mjs`, which is yours — trim your own preloads the same way if you like.
