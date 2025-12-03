import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { visit } from 'unist-util-visit';
import rehypeStringify from 'rehype-stringify';


export const IMAGES = import.meta.glob('/src/assets/**/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
});


export async function renderMarkdownWithImages(markdown: string) {
  const html = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(() => (tree: any) => {
      visit(tree, 'element', (node) => {
        if (node.tagName === 'img') {
          const src = node.properties?.src;
          const alt = node.properties?.alt ?? '';

          const image = IMAGES[src];

          if (image) {
            node.properties = {
              ...image,
              alt,
            };
          }
        }
      });
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

    return String(html);
}