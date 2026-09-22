import { stripMarkdown } from '@utils/search';

/**
 * Plain-text excerpt from a markdown body, for cards and meta descriptions
 * when no excerpt was written. Uses the first real paragraph (skipping
 * headings, blockquotes, lists, code and images) and cuts at a word boundary.
 */
export function getExcerpt(
  markdown: string | undefined,
  maxLength = 180
): string | undefined {
  if (!markdown) return undefined;

  const paragraph = markdown
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find(
      (block) =>
        block !== '' &&
        !/^(#{1,6}\s|>|[-*+]\s|\d+\.\s|!\[|<|\||import\s|export\s)/.test(block)
    );

  const text = stripMarkdown(paragraph ?? '');
  if (!text) return undefined;
  if (text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, '')}…`;
}
