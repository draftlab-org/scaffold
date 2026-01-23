import type { ReactNode } from 'react';

export interface LinkProps {
  href: string;
  variant?: 'default' | 'nav' | 'footer' | 'unstyled';
  external?: boolean;
  className?: string;
  children: ReactNode;
  showExternalIcon?: boolean;
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
  className = '',
  children,
  showExternalIcon = true,
}: LinkProps) {
  const classes = `${variants[variant]} ${className}`;
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <a href={href} className={classes} {...externalProps}>
      {children}
      {external && showExternalIcon && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="ml-1 inline-block h-4 w-4 opacity-70"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z"
            clipRule="evenodd"
          />
          <path
            fillRule="evenodd"
            d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </a>
  );
}
