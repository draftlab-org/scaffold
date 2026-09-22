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
  // Up to three levels: top-level dropdown → group (dropdown) → links
  children: NavItem[];
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

// Raw navigation data shape from the content collection. `type` is optional on
// children because two-level menus written before nesting existed omit it.
interface RawNavItem {
  type?: 'link' | 'dropdown';
  label: string;
  link?: FlexibleLink;
  description?: string;
  children?: RawNavItem[];
}

// Convert raw navigation data from content collection to NavItem[]
export function convertNavigationItems(items: RawNavItem[]): NavItem[] {
  return items.map((item): NavItem => {
    if (item.type === 'dropdown' && item.children) {
      return {
        type: 'dropdown',
        label: item.label,
        children: convertNavigationItems(item.children),
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

// Find the first resolvable link within an item, descending into nested dropdowns
export function getFirstLink(item: NavItem): FlexibleLink | null {
  if (item.type === 'link') {
    return item.link;
  }
  for (const child of item.children) {
    const link = getFirstLink(child);
    if (link) return link;
  }
  return null;
}

// Normalize a path for comparison: drop a single trailing slash (keep root "/")
export function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

// Check whether an href matches the current path (exact or as a parent path)
export function isPathActive(href: string, currentPath: string): boolean {
  if (!currentPath) return false;
  const target = normalizePath(currentPath);
  const navPath = normalizePath(href);
  if (navPath === '/') return target === '/';
  return target === navPath || target.startsWith(`${navPath}/`);
}

// Check whether a nav item, or any of its nested children, matches the current path
export function isItemActive(item: NavItem, currentPath: string): boolean {
  if (item.type === 'link') {
    if (isExternalLink(item.link)) return false;
    return isPathActive(resolveFlexibleLink(item.link), currentPath);
  }
  return item.children.some((child) => isItemActive(child, currentPath));
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Build the breadcrumb trail for a path from the navigation tree: ancestor
// dropdown labels (unlinked), then the matched nav link. When the path is a
// child of a nav link (e.g. /articles/foo under /articles) the link is
// included as a linked ancestor; on an exact match it's the final segment
// (without href). Returns null when nothing in the nav matches.
export function getBreadcrumbTrail(
  items: NavItem[],
  currentPath: string
): BreadcrumbItem[] | null {
  const target = normalizePath(currentPath);
  for (const item of items) {
    if (item.type === 'link') {
      if (isExternalLink(item.link)) continue;
      const href = resolveFlexibleLink(item.link);
      const navPath = normalizePath(href);
      if (navPath === target) {
        return [{ label: item.label }];
      }
      if (navPath !== '/' && target.startsWith(`${navPath}/`)) {
        return [{ label: item.label, href }];
      }
    } else {
      const childTrail = getBreadcrumbTrail(item.children, currentPath);
      if (childTrail !== null) {
        return [{ label: item.label }, ...childTrail];
      }
    }
  }
  return null;
}

// Title-case a URL segment for use as a fallback breadcrumb label
function segmentLabel(segment: string): string {
  const words = decodeURIComponent(segment).replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

interface BuildBreadcrumbsOptions {
  navItems: NavItem[];
  path: string;
  // Title of the current page, used for the final crumb
  currentTitle?: string;
  // Known pages by path ("/about/team" → "Team"), used to label and link
  // intermediate URL segments when the nav doesn't cover the path
  pageTitles?: Map<string, string>;
}

// Build a full breadcrumb trail, starting at Home. Prefers the navigation tree
// (so dropdown groups show up as ancestors) and falls back to URL segments.
// Intermediate segments are only linked when a page exists at that path.
export function buildBreadcrumbs({
  navItems,
  path,
  currentTitle,
  pageTitles = new Map(),
}: BuildBreadcrumbsOptions): BreadcrumbItem[] {
  const target = normalizePath(path);
  if (target === '/') return [];

  const home: BreadcrumbItem = { label: 'Home', href: '/' };
  const navTrail = getBreadcrumbTrail(navItems, target);

  if (navTrail && navTrail.length > 0) {
    const last = navTrail[navTrail.length - 1];
    // The nav matched a parent path (e.g. /articles for /articles/foo):
    // append the current page as the final crumb
    if (last.href) {
      return [
        home,
        ...navTrail,
        {
          label:
            currentTitle ??
            pageTitles.get(target) ??
            segmentLabel(target.split('/').pop() ?? ''),
        },
      ];
    }
    return [home, ...navTrail];
  }

  const segments = target.split('/').filter(Boolean);
  const crumbs = segments.map((segment, index): BreadcrumbItem => {
    const segmentPath = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    const knownTitle = pageTitles.get(segmentPath);
    if (isLast) {
      return { label: currentTitle ?? knownTitle ?? segmentLabel(segment) };
    }
    return {
      label: knownTitle ?? segmentLabel(segment),
      href: knownTitle ? segmentPath : undefined,
    };
  });
  return [home, ...crumbs];
}
