import { getImage } from 'astro:assets';
import rehypeTableAlign from '@lib/rehype-table-align';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
import rehypeExternalLinks from 'rehype-external-links';
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

    // Get the imported image from our glob map
    const importedImage = images[src];

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

// Plugin to update TOC IDs with prefix
const updateTocWithPrefix = (toc: TocEntry[], prefix: string): TocEntry[] => {
  return toc.map((entry) => ({
    ...entry,
    id: `${prefix}-${entry.id}`,
    children: entry.children ? updateTocWithPrefix(entry.children, prefix) : undefined,
  }));
};

// Extract base markdown processor (no image processing)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMarkdownProcessor = (withTOC = false, idPrefix?: string): any => {
  // Build the processor with all plugins
  // Using any type to avoid complex generic inference issues with unified's plugin system
  let processor: any = unified()
    .use(remarkParse)
    .use(remarkGfm) // Enable GFM tables with alignment
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeTableAlign) // Apply alignment classes to table cells
    .use(rehypeExternalLinks, {
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    });

  // Add ID prefix if provided
  if (idPrefix) {
    processor = processor.use(rehypeAddIdPrefix(idPrefix));
  }

  // Add TOC extraction if requested
  if (withTOC) {
    processor = processor.use(rehypeExtractToc);
  }

  return processor.use(rehypeStringify, { allowDangerousHtml: true });
};

// New: Plain markdown rendering (no image processing)
export const renderMarkdown = async (
  markdown: string,
  withTOC = false,
  idPrefix?: string
): Promise<RenderResult> => {
  const processor = createMarkdownProcessor(withTOC, idPrefix);
  const result = await processor.process(markdown);

  let toc = (result.data as any)?.toc as TocEntry[] | undefined;

  // Apply prefix to TOC IDs if both TOC and prefix are provided
  if (toc && idPrefix) {
    toc = updateTocWithPrefix(toc, idPrefix);
  }

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

  let toc = (result.data as any)?.toc as TocEntry[] | undefined;

  // Apply prefix to TOC IDs if both TOC and prefix are provided
  if (toc && idPrefix) {
    toc = updateTocWithPrefix(toc, idPrefix);
  }

  return {
    html: String(result),
    toc,
  };
};

// Default export for backward compatibility
export default renderMarkdownWithImages;
