import {
  type ButtonIcon,
  resolveButtonLink,
  TRAILING_BUTTON_ICONS,
} from '@utils/buttons';
import type { FlexibleLink } from '@utils/navigation';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import IconArrowDownTray from '~icons/heroicons/arrow-down-tray-20-solid';
import IconArrowRight from '~icons/heroicons/arrow-right-20-solid';
import IconArrowTopRight from '~icons/heroicons/arrow-top-right-on-square-20-solid';
import IconCalendar from '~icons/heroicons/calendar-20-solid';
import IconChat from '~icons/heroicons/chat-bubble-left-right-20-solid';
import IconDocument from '~icons/heroicons/document-text-20-solid';
import IconEnvelope from '~icons/heroicons/envelope-20-solid';
import IconHeart from '~icons/heroicons/heart-20-solid';
import IconPlay from '~icons/heroicons/play-20-solid';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'square';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // Renders an <a> when `as="a"` or when an href is given
  as?: 'button' | 'a';
  href?: string;
  // CMS link (internal page or external URL); takes precedence over `href`
  link?: FlexibleLink | null;
  // Opens in a new tab. Inferred from `link`/`href` when omitted.
  external?: boolean;
  icon?: ButtonIcon | null;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  // Alias so Astro call sites can keep using `class`
  class?: string;
  children?: ReactNode;
  [key: string]: unknown;
}

const icons: Record<ButtonIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  'arrow-right': IconArrowRight,
  external: IconArrowTopRight,
  download: IconArrowDownTray,
  email: IconEnvelope,
  calendar: IconCalendar,
  document: IconDocument,
  chat: IconChat,
  heart: IconHeart,
  play: IconPlay,
};

const baseStyles = 'button-base';

const variants: Record<ButtonVariant, string> = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  outline: 'button-outline',
  ghost: 'button-ghost',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'button-size-sm',
  md: 'button-size-md',
  lg: 'button-size-lg',
  xl: 'button-size-xl',
  square: 'button-size-square',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = ''
): string {
  return `${baseStyles} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`.trim();
}

export default function Button({
  variant = 'primary',
  size = 'md',
  as,
  href,
  link,
  external,
  icon,
  type = 'button',
  className,
  class: classAlias,
  children,
  ...props
}: ButtonProps) {
  const classes = buttonClasses(variant, size, className ?? classAlias ?? '');
  const resolved = resolveButtonLink({ link, href });
  const isAnchor = as === 'a' || (as !== 'button' && !!resolved.href);
  const opensNewTab = isAnchor && (external ?? resolved.external);

  const Icon = icon ? icons[icon] : undefined;
  const iconElement = Icon && (
    <Icon className="h-[1.1em] w-[1.1em] shrink-0" aria-hidden="true" />
  );
  const trailing = icon ? TRAILING_BUTTON_ICONS.includes(icon) : false;
  const content = (
    <>
      {iconElement && !trailing && iconElement}
      {children}
      {iconElement && trailing && iconElement}
      {opensNewTab && <span className="sr-only"> (opens in a new tab)</span>}
    </>
  );
  const iconClasses = iconElement ? 'gap-2' : '';

  if (isAnchor) {
    const externalProps = opensNewTab
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {};
    return (
      <a
        data-component=""
        href={resolved.href}
        className={`${classes} ${iconClasses}`.trim()}
        {...externalProps}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={`${classes} ${iconClasses}`.trim()}
      {...props}
    >
      {content}
    </button>
  );
}
