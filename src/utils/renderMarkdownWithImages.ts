import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { visit } from 'unist-util-visit';
import rehypeStringify from 'rehype-stringify';
import { getImage } from 'astro:assets';

const processImageNodes = () => async (tree: any) => {
  // Find all image nodes in the tree
  const imageNodes: any[] = [];
  visit(tree, 'element', (node) => {
    if (node.tagName === 'img') {
      imageNodes.push(node);
    }
  });

  // fetch images using Astro getImage
  const imagePromises = imageNodes.map((node) => {
    const src = node.properties?.src;
    const alt = node.properties?.alt ?? '';

    return new Promise((resolve) => {
      getImage({ src })
        .then((fetchedImage) => {
          if (fetchedImage) {
            node.properties = {
              ...fetchedImage.attributes,
              src: fetchedImage.src,
              alt,
            };
          }
          resolve();
      });
    });
  })

  await Promise.all(imagePromises);
}

const renderMarkdownWithImages = async (markdown: string) => {
  const html = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(processImageNodes)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

    return String(html);
}

export default renderMarkdownWithImages;