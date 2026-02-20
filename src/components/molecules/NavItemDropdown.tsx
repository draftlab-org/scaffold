import Link from '@components/atoms/Link';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
  isExternalLink,
  type NavItemDropdown as NavItemDropdownType,
  resolveFlexibleLink,
} from '@utils/navigation';
import IconChevronDown from '~icons/heroicons/chevron-down-20-solid';

interface NavItemDropdownProps {
  item: NavItemDropdownType;
  active?: boolean;
  currentPath?: string;
}

export default function NavItemDropdown({
  item,
  active = false,
  currentPath = '',
}: NavItemDropdownProps) {
  const activeStyles = active
    ? 'decoration-primary-300'
    : 'decoration-white transition transition-300 hover:decoration-gray-100';

  const buttonClasses = `underline underline-offset-8 decoration-dotted decoration-4 inline-flex items-center px-3 py-2 text-xl text-black cursor-pointer ${activeStyles}`;

  const isChildActive = (href: string) => {
    if (!currentPath) return false;
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className={buttonClasses}>
        {item.label}
        <IconChevronDown class="ml-1 h-5 w-5" aria-hidden="true" />
      </MenuButton>

      <MenuItems
        transition
        className="absolute left-0 z-50 mt-2 flex origin-top-left flex-col gap-1 rounded-md bg-white py-2 px-2 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        {item.children.map((child) => {
          const href = resolveFlexibleLink(child.link);
          const external = isExternalLink(child.link);
          const childActive = isChildActive(href);
          const childActiveStyles = childActive
            ? 'decoration-primary-300'
            : 'decoration-white transition transition-300 hover:decoration-gray-100';
          const itemClasses = `underline underline-offset-8 decoration-dotted decoration-4 inline-flex items-center px-3 py-2 text-black ${childActiveStyles}`;

          return (
            <MenuItem key={child.label}>
              <Link
                href={href}
                external={external}
                variant="nav"
                className={itemClasses}
              >
                {child.label}
              </Link>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
