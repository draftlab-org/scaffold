import type { ReactNode } from 'react';
import IconExternalLink from '~icons/heroicons/arrow-top-right-on-square-20-solid';

export interface LinkProps {
  href: string;
  variant?: 'default' | 'nav' | 'footer' | 'unstyled';
  external?: boolean;
  className?: string;
  // Alias so Astro call sites can keep using `class`
  class?: string;
  children?: ReactNode;
  showExternalIcon?: boolean;
  [key: string]: unknown;
}

const variants = {
  default: 'link-default',
  nav: 'text-xl',
  footer: 'text-white text-sm hover:underline underline-offset-4 transition',
  unstyled: '',
};

export default function Link({
  href,
  variant = 'default',
  external = false,
  className,
  class: classAlias,
  children,
  showExternalIcon = true,
  ...props
}: LinkProps) {
  const classes = `${variants[variant]} ${className ?? classAlias ?? ''}`.trim();
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <a
      data-component=""
      href={href}
      className={classes}
      {...externalProps}
      {...props}
    >
      {children}
      {external && showExternalIcon && (
        <IconExternalLink
          className="ml-1 inline-block h-4 w-4 opacity-70"
          aria-hidden="true"
        />
      )}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
