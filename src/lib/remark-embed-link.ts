import type { Root, RootContent, Link, Paragraph, Parent } from 'mdast';
import type { Plugin } from 'unified';
import youtubeMatcher from '@astro-community/astro-embed-youtube/matcher';
import vimeoMatcher from '@astro-community/astro-embed-vimeo/matcher';
import blueskyMatcher from '@astro-community/astro-embed-bluesky/matcher';
import mastodonMatcher from '@astro-community/astro-embed-mastodon/matcher';
import {
  buildBlueskyHTML,
  buildMastodonHTML,
  buildVimeoHTML,
  buildYouTubeHTML,
} from './embed-builders';
import { fetchBlueskyPost } from './fetch-bluesky';
import { fetchMastodonPost } from './fetch-mastodon';

const MARKER = 'EmbedLink';

interface Candidate {
  parentIndex: number;
  container: Parent;
  url: string;
}

const isEmbedLinkNode = (node: RootContent | Link): node is Link => {
  if (node.type !== 'link') return false;
  const link = node as Link;
  if (link.children.length !== 1) return false;
  const [child] = link.children;
  return child.type === 'text' && child.value === MARKER;
};

const isParent = (node: unknown): node is Parent =>
  typeof node === 'object' &&
  node !== null &&
  'children' in node &&
  Array.isArray((node as Parent).children);

const walk = (node: Parent, candidates: Candidate[]): void => {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (
      child.type === 'paragraph' &&
      (child as Paragraph).children.length === 1 &&
      isEmbedLinkNode((child as Paragraph).children[0] as RootContent)
    ) {
      const link = (child as Paragraph).children[0] as Link;
      candidates.push({
        parentIndex: i,
        container: node,
        url: link.url,
      });
      continue;
    }
    if (isParent(child)) walk(child, candidates);
  }
};

// Module-level dedupe of in-flight fetches across a single build
const inflight = new Map<string, Promise<string | null>>();

const buildEmbedHTML = async (url: string): Promise<string | null> => {
  // YouTube
  const ytId = youtubeMatcher(url);
  if (ytId) return buildYouTubeHTML(ytId);

  // Vimeo
  const vimeoId = vimeoMatcher(url);
  if (vimeoId) return buildVimeoHTML(vimeoId);

  // Bluesky (async)
  if (blueskyMatcher(url)) {
    const post = await fetchBlueskyPost(url);
    if (!post) {
      console.warn(`[remark-embed-link] Bluesky fetch failed: ${url}`);
      return null;
    }
    return buildBlueskyHTML(post);
  }

  // Mastodon (async)
  if (mastodonMatcher(url)) {
    const post = await fetchMastodonPost(url);
    if (!post) {
      console.warn(`[remark-embed-link] Mastodon fetch failed: ${url}`);
      return null;
    }
    return buildMastodonHTML(post);
  }

  console.warn(
    `[remark-embed-link] No matching provider for EmbedLink URL: ${url}`
  );
  return null;
};

const cachedBuild = (url: string): Promise<string | null> => {
  let p = inflight.get(url);
  if (!p) {
    p = buildEmbedHTML(url);
    inflight.set(url, p);
  }
  return p;
};

const remarkEmbedLink: Plugin<[], Root> = () => async (tree) => {
  const candidates: Candidate[] = [];
  walk(tree, candidates);
  if (candidates.length === 0) return;

  const results = await Promise.all(
    candidates.map(async (c) => ({ c, html: await cachedBuild(c.url) }))
  );

  // Group replacements by container so we can splice them in correctly,
  // walking from the end to keep indices valid.
  const byContainer = new Map<Parent, { index: number; html: string }[]>();
  for (const { c, html } of results) {
    if (!html) continue; // leave the original link in place
    let arr = byContainer.get(c.container);
    if (!arr) {
      arr = [];
      byContainer.set(c.container, arr);
    }
    arr.push({ index: c.parentIndex, html });
  }

  for (const [container, ops] of byContainer) {
    ops.sort((a, b) => b.index - a.index);
    for (const { index, html } of ops) {
      container.children.splice(index, 1, {
        type: 'html',
        value: html,
      } as RootContent);
    }
  }
};

export default remarkEmbedLink;
