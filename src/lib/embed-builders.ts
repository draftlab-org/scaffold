import { renderBlueskyText, type BlueskyPost } from './fetch-bluesky';
import type { MastodonPost } from './fetch-mastodon';

const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const esc = (s: string | undefined | null): string =>
  (s ?? '').replace(/[&<>"']/g, (c) => escapeMap[c] ?? c);

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

export const buildYouTubeHTML = (videoId: string): string =>
  `<div class="embed-video"><lite-youtube videoid="${esc(videoId)}" playlabel="Play video"></lite-youtube></div>`;

export const buildVimeoHTML = (videoId: string): string =>
  `<div class="embed-video"><lite-vimeo videoid="${esc(videoId)}"></lite-vimeo></div>`;

export const buildBlueskyHTML = (post: BlueskyPost): string => {
  const author = post.author;
  const avatar = author.avatar
    ? `<img class="embed-post__avatar" src="${esc(author.avatar)}" alt="" width="40" height="40" loading="lazy" />`
    : '';
  const displayName = esc(author.displayName || author.handle);
  const handle = esc(author.handle);
  const text = renderBlueskyText(post);
  const postUrl = `https://bsky.app/profile/${esc(author.handle)}/post/${esc(post.uri.split('/').pop() ?? '')}`;
  const date = formatDate(post.indexedAt ?? post.record.createdAt ?? '');

  // Images, if any are attached
  let media = '';
  const embed = post.embed;
  if (embed && embed.$type === 'app.bsky.embed.images#view' && Array.isArray(embed.images)) {
    media = `<div class="embed-post__media">${embed.images
      .map(
        (img) =>
          `<img src="${esc(img.thumb)}" alt="${esc(img.alt)}" loading="lazy" />`
      )
      .join('')}</div>`;
  }

  return `<figure class="embed-post embed-post--bluesky" data-platform="bluesky">
  <header class="embed-post__header">
    ${avatar}
    <div class="embed-post__author">
      <a href="https://bsky.app/profile/${handle}" class="embed-post__name">${displayName}</a>
      <span class="embed-post__handle">@${handle}</span>
    </div>
    <span class="embed-post__badge" aria-label="Bluesky">Bluesky</span>
  </header>
  <div class="embed-post__content">${text}</div>
  ${media}
  <footer class="embed-post__footer">
    <a href="${esc(postUrl)}" rel="noopener noreferrer">${esc(date)}</a>
  </footer>
</figure>`;
};

export const buildMastodonHTML = (post: MastodonPost): string => {
  const a = post.account;
  const avatar = a.avatar
    ? `<img class="embed-post__avatar" src="${esc(a.avatar)}" alt="" width="40" height="40" loading="lazy" />`
    : '';
  const displayName = esc(a.display_name || a.username);
  const handle = esc(`@${a.acct || a.username}@${post.sourceInstance}`);
  const date = formatDate(post.created_at);

  const media = post.media_attachments?.length
    ? `<div class="embed-post__media">${post.media_attachments
        .filter((m) => m.type === 'image' || m.type === 'gifv' || m.type === 'video')
        .map((m) =>
          m.type === 'image'
            ? `<img src="${esc(m.preview_url || m.url)}" alt="${esc(m.description)}" loading="lazy" />`
            : `<video src="${esc(m.url)}" controls preload="metadata"${m.meta?.original?.width ? ` width="${m.meta.original.width}"` : ''}${m.meta?.original?.height ? ` height="${m.meta.original.height}"` : ''}></video>`
        )
        .join('')}</div>`
    : '';

  // post.content is already sanitized HTML from the Mastodon API
  return `<figure class="embed-post embed-post--mastodon" data-platform="mastodon">
  <header class="embed-post__header">
    ${avatar}
    <div class="embed-post__author">
      <a href="${esc(a.url)}" class="embed-post__name">${displayName}</a>
      <span class="embed-post__handle">${handle}</span>
    </div>
    <span class="embed-post__badge" aria-label="Mastodon">Mastodon</span>
  </header>
  <div class="embed-post__content">${post.content}</div>
  ${media}
  <footer class="embed-post__footer">
    <a href="${esc(post.url)}" rel="noopener noreferrer">${esc(date)}</a>
  </footer>
</figure>`;
};
