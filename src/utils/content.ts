import { isDev, isPreview } from '@utils/dev';

/**
 * Determines if a content item should be visible based on its status.
 * - `published` and `archived` items are always visible
 * - `draft` items are only visible in development or preview mode
 */
export function isVisible(item: { data: { status?: string } }): boolean {
  const status = item.data.status ?? 'published';
  if (status === 'published' || status === 'archived') return true;
  if (status === 'draft') return isDev || isPreview;
  return false;
}

/**
 * Maps color palette values (from site config) to Banner atom variants.
 */
const colorToVariantMap: Record<string, 'info' | 'warning' | 'success' | 'error'> = {
  primary: 'warning',
  secondary: 'info',
  highlight: 'error',
  neutral: 'info',
};

export function mapColorToVariant(color: string): 'info' | 'warning' | 'success' | 'error' {
  return colorToVariantMap[color] ?? 'info';
}
