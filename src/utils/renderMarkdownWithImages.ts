import { getImage } from 'astro:assets';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

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

const renderMarkdownWithImages = async (markdown: string) => {
  const html = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(processImageNodes)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(html);
};

export default renderMarkdownWithImages;
