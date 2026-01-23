import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';

/**
 * Rehype plugin to apply text alignment classes to table cells.
 *
 * This plugin reads the `align` property from table cells (th, td) that is
 * set by remark-rehype based on markdown table alignment syntax:
 * - :--- or --- = left alignment
 * - :---: = center alignment
 * - ---: = right alignment
 *
 * It converts these to Tailwind CSS classes:
 * - text-left
 * - text-center
 * - text-right
 */
export default function rehypeTableAlign() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      // Only process th and td elements
      if (node.tagName !== 'th' && node.tagName !== 'td') {
        return;
      }

      const align = node.properties?.align;

      if (!align) {
        return;
      }

      // Map alignment to Tailwind class
      const alignmentClasses: Record<string, string> = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      };

      const alignClass = alignmentClasses[align as string];

      if (alignClass) {
        // Get existing classes or initialize empty array
        const existingClasses = node.properties?.className;
        let classes: string[] = [];

        if (Array.isArray(existingClasses)) {
          classes = existingClasses.filter(
            (c): c is string => typeof c === 'string'
          );
        } else if (typeof existingClasses === 'string') {
          classes = existingClasses.split(' ').filter(Boolean);
        }

        // Add alignment class if not already present
        if (!classes.includes(alignClass)) {
          classes.push(alignClass);
        }

        // Update node properties
        node.properties = {
          ...node.properties,
          className: classes,
        };

        // Remove the style-based align property as we're using classes now
        delete node.properties.align;
      }
    });
  };
}
