/**
 * Returns CSS classes only in development mode
 * @param classes - The classes to apply in dev mode
 * @returns The classes string in dev, empty string in production
 *
 * @example
 * <div class={`base-class ${devClass('border-2 border-red-500')}`}>
 */
export function devClass(classes: string): string {
  return import.meta.env.DEV ? classes : '';
}

/**
 * Conditionally merges classes, filtering out dev-only classes in production
 * @param baseClasses - Classes that always apply
 * @param devClasses - Classes that only apply in dev mode
 * @returns Merged class string
 *
 * @example
 * <div class={devClasses('base-class', 'border-2 border-red-500')}>
 */
export function devClasses(baseClasses: string, devClasses: string): string {
  const dev = import.meta.env.DEV ? devClasses : '';
  return [baseClasses, dev].filter(Boolean).join(' ');
}

/**
 * Check if currently in development mode
 */
export const isDev = import.meta.env.DEV;
