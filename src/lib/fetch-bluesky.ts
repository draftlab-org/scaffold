export interface BlueskyAuthor {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface BlueskyImage {
  thumb: string;
  fullsize: string;
  alt: string;
}

export interface BlueskyPost {
  uri: string;
  cid: string;
  author: BlueskyAuthor;
  record: {
    text: string;
    createdAt: string;
    facets?: Array<{
      index: { byteStart: number; byteEnd: number };
      features: Array<{
        $type: string;
        uri?: string;
        did?: string;
        tag?: string;
      }>;
    }>;
  };
  indexedAt: string;
  embed?: {
    $type?: string;
    images?: BlueskyImage[];
    [k: string]: unknown;
  };
}

const APP_VIEW = 'https://public.api.bsky.app';

const parseBlueskyUrl = (
  url: string
): { handleOrDid: string; postId: string } | null => {
  try {
    const u = new URL(url);
    if (u.hostname !== 'bsky.app') return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length !== 4 || parts[0] !== 'profile' || parts[2] !== 'post') {
      return null;
    }
    return { handleOrDid: parts[1], postId: parts[3] };
  } catch {
    return null;
  }
};

const resolveDid = async (handleOrDid: string): Promise<string | null> => {
  if (handleOrDid.startsWith('did:')) return handleOrDid;
  try {
    const res = await fetch(
      `${APP_VIEW}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handleOrDid)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { did?: string };
    return data.did ?? null;
  } catch {
    return null;
  }
};

export async function fetchBlueskyPost(
  url: string
): Promise<BlueskyPost | null> {
  const parsed = parseBlueskyUrl(url);
  if (!parsed) return null;

  const did = await resolveDid(parsed.handleOrDid);
  if (!did) return null;

  const atUri = `at://${did}/app.bsky.feed.post/${parsed.postId}`;
  try {
    const res = await fetch(
      `${APP_VIEW}/xrpc/app.bsky.feed.getPosts?uris=${encodeURIComponent(atUri)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { posts?: BlueskyPost[] };
    return data.posts?.[0] ?? null;
  } catch {
    return null;
  }
}

const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const escHTML = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => escapeMap[c] ?? c);

export const renderBlueskyText = (post: BlueskyPost): string => {
  const { text, facets } = post.record;
  if (!facets || facets.length === 0) return escHTML(text);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const bytes = encoder.encode(text);

  const sorted = [...facets].sort(
    (a, b) => a.index.byteStart - b.index.byteStart
  );

  let cursor = 0;
  let html = '';
  for (const facet of sorted) {
    const { byteStart, byteEnd } = facet.index;
    if (byteStart < cursor) continue; // overlapping; skip
    html += escHTML(decoder.decode(bytes.slice(cursor, byteStart)));
    const segment = decoder.decode(bytes.slice(byteStart, byteEnd));
    const [feature] = facet.features;
    switch (feature?.$type) {
      case 'app.bsky.richtext.facet#link':
        html += `<a href="${escHTML(feature.uri ?? '#')}" rel="noopener noreferrer">${escHTML(segment)}</a>`;
        break;
      case 'app.bsky.richtext.facet#mention':
        html += `<a href="https://bsky.app/profile/${escHTML(feature.did ?? '')}">${escHTML(segment)}</a>`;
        break;
      case 'app.bsky.richtext.facet#tag':
        html += `<a href="https://bsky.app/hashtag/${escHTML(feature.tag ?? '')}">${escHTML(segment)}</a>`;
        break;
      default:
        html += escHTML(segment);
    }
    cursor = byteEnd;
  }
  html += escHTML(decoder.decode(bytes.slice(cursor)));
  return html;
};
