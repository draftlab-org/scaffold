import { getImage } from 'astro:assets';
import {
  autolinkHeadingsOptions,
  expressiveCodeOptions,
  externalLinksOptions,
} from '@lib/markdown-plugins';
import rehypeTableAlign from '@lib/rehype-table-align';
import remarkEmbedLink from '@lib/remark-embed-link';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExpressiveCode from 'rehype-expressive-code';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

// TOC entry type from rehype-extract-toc
export interface TocEntry {
  id: string;
  value: string;
  depth: number;
  children?: TocEntry[];
}

// Build nested TOC entries (h2 with h3 children) from the headings returned
// by Astro's render() — for content rendered natively rather than via
// renderMarkdown
export function getTocEntries(
  headings: { depth: number; slug: string; text: string }[]
): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const heading of headings) {
    if (heading.depth !== 2 && heading.depth !== 3) continue;
    const entry: TocEntry = {
      id: heading.slug,
      value: heading.text,
      depth: heading.depth,
    };
    const parent = entries[entries.length - 1];
    if (heading.depth === 3 && parent) {
      parent.children ??= [];
      parent.children.push(entry);
    } else {
      entries.push(entry);
    }
  }
  return entries;
}

// Count entries including nested children
export function countTocEntries(entries: TocEntry[]): number {
  return entries.reduce(
    (total, entry) => total + 1 + countTocEntries(entry.children ?? []),
    0
  );
}

// Result type for markdown rendering with TOC
export interface RenderResult {
  html: string;
  toc?: TocEntry[];
}

// Eagerly import all images from /src/assets
const images: Record<string, ImageMetadata> = import.meta.glob(
  '/src/assets/**/*.{png,jpg,jpeg,gif,webp,svg}',
  {
    eager: true,
    import: 'default',
  }
);

const safeDecodeURI = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const processImageNodes = () => async (tree: any) => {
  // Find all image nodes in the tree
  const imageNodes: any[] = [];
  visit(tree, 'element', (node) => {
    if (node.tagName === 'img') {
      imageNodes.push(node);
    }
  });

  // Process each image node with getImage
  const imagePromises = imageNodes.map(async (node) => {
    const src = node.properties?.src;
    const alt = node.properties?.alt ?? '';

    if (!src) {
      console.warn('Image node missing src attribute');
      return;
    }

    // Remote URLs (e.g. embed avatars) bypass Astro's getImage — leave them as-is.
    if (typeof src === 'string' && /^(https?:)?\/\//.test(src)) {
      return;
    }

    // Get the imported image from our glob map. Pages CMS percent-encodes
    // filenames (spaces become %20), so fall back to the decoded path. Paths
    // written relative to a content file (../../assets/x.png, the "Body
    // Images" media output) map onto the same /src/assets keys.
    const key = String(src).replace(/^(?:\.\.\/)+assets\//, '/src/assets/');
    const importedImage = images[key] ?? images[safeDecodeURI(key)];

    if (!importedImage) {
      console.warn(`Image not found in /src/assets: ${src}`);
      return;
    }

    try {
      const fetchedImage = await getImage({ src: importedImage });

      if (fetchedImage) {
        node.properties = {
          src: fetchedImage.src,
          alt,
          ...fetchedImage.attributes,
        };
      }
    } catch (error) {
      console.error(`Failed to process image with getImage: ${src}`, error);
    }
  });

  await Promise.all(imagePromises);
};

// Plugin to add ID prefix to headings
const rehypeAddIdPrefix = (prefix: string) => {
  return () => (tree: any) => {
    visit(tree, 'element', (node) => {
      if (/^h[1-6]$/.test(node.tagName) && node.properties?.id) {
        node.properties.id = `${prefix}-${node.properties.id}`;
      }
    });
  };
};

// Extract base markdown processor (no image processing)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMarkdownProcessor = (withTOC = false, idPrefix?: string): any => {
  // Build the processor with all plugins
  // Using any type to avoid complex generic inference issues with unified's plugin system
  let processor: any = unified()
    .use(remarkParse)
    .use(remarkGfm) // Enable GFM tables with alignment
    .use(remarkEmbedLink) // Transform [EmbedLink](url) → embed HTML
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug);

  // Add ID prefix if provided
  if (idPrefix) {
    processor = processor.use(rehypeAddIdPrefix(idPrefix));
  }

  // Add TOC extraction if requested
  if (withTOC) {
    processor = processor.use(rehypeExtractToc);
  }

  return processor
    // After the id prefix, so anchors point at the final ids
    .use(rehypeAutolinkHeadings, autolinkHeadingsOptions)
    .use(rehypeRaw)
    // After rehypeRaw, so tables and links written as raw HTML are covered too
    .use(rehypeTableAlign) // Apply alignment classes to table cells
    .use(rehypeExternalLinks, externalLinksOptions)
    .use(rehypeExpressiveCode, expressiveCodeOptions)
    .use(rehypeStringify);
};

// New: Plain markdown rendering (no image processing)
export const renderMarkdown = async (
  markdown: string,
  withTOC = false,
  idPrefix?: string
): Promise<RenderResult> => {
  const processor = createMarkdownProcessor(withTOC, idPrefix);
  const result = await processor.process(markdown);

  const toc = (result.data as any)?.toc as TocEntry[] | undefined;

  return {
    html: String(result),
    toc,
  };
};

// Existing: Markdown with image optimization
export const renderMarkdownWithImages = async (
  markdown: string,
  withTOC = false,
  idPrefix?: string
): Promise<RenderResult> => {
  const processor = createMarkdownProcessor(withTOC, idPrefix).use(processImageNodes);
  const result = await processor.process(markdown);

  const toc = (result.data as any)?.toc as TocEntry[] | undefined;

  return {
    html: String(result),
    toc,
  };
};

// Default export for backward compatibility
export default renderMarkdownWithImages;
