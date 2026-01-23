// Navigation utilities for resolving flexible links and transforming navigation items

export interface FlexibleLink {
  type: 'internal' | 'external';
  pageRef?: string;
  url?: string;
}

export interface NavItemSingle {
  type: 'link';
  label: string;
  link: FlexibleLink;
  description?: string;
}

export interface NavItemDropdown {
  type: 'dropdown';
  label: string;
  children: NavItemSingle[];
}

export type NavItem = NavItemSingle | NavItemDropdown;

// Resolve a flexible link to an href string
export function resolveFlexibleLink(link: FlexibleLink): string {
  if (link.type === 'external' && link.url) {
    return link.url;
  }
  return link.pageRef || '/';
}

// Check if a flexible link is external
export function isExternalLink(link: FlexibleLink): boolean {
  return link.type === 'external';
}

// Convert raw navigation data from content collection to NavItem[]
export function convertNavigationItems(
  items: Array<{
    type: 'link' | 'dropdown';
    label: string;
    link?: { type: 'internal' | 'external'; pageRef?: string; url?: string };
    description?: string;
    children?: Array<{
      label: string;
      link: { type: 'internal' | 'external'; pageRef?: string; url?: string };
      description?: string;
    }>;
  }>
): NavItem[] {
  return items.map((item) => {
    if (item.type === 'dropdown' && item.children) {
      return {
        type: 'dropdown',
        label: item.label,
        children: item.children.map((child) => ({
          type: 'link' as const,
          label: child.label,
          link: child.link,
          description: child.description,
        })),
      };
    }

    return {
      type: 'link',
      label: item.label,
      link: item.link as FlexibleLink,
      description: item.description,
    };
  });
}

// Get href from a NavItem (for single links only)
export function getNavItemHref(item: NavItem): string | null {
  if (item.type === 'link') {
    return resolveFlexibleLink(item.link);
  }
  return null;
}
