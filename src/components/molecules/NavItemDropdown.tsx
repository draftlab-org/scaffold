import Link from '@components/atoms/Link';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
  isExternalLink,
  type NavItemDropdown as NavItemDropdownType,
  resolveFlexibleLink,
} from '@utils/navigation';

interface NavItemDropdownProps {
  item: NavItemDropdownType;
  active?: boolean;
}

// TODO: #18 Clean up and simplify

export default function NavItemDropdown({
  item,
  active = false,
}: NavItemDropdownProps) {
  const activeStyles = active
    ? 'decoration-primary-300'
    : 'decoration-white transition transition-300 hover:decoration-gray-100';

  const buttonClasses = `underline underline-offset-8 decoration-dotted decoration-4 inline-flex items-center px-3 py-2 text-xl cursor-pointer ${activeStyles}`;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className={buttonClasses}>
        {item.label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="ml-1 h-5 w-5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </MenuButton>

      <MenuItems
        transition
        className="absolute left-0 z-50 mt-2 w-56 origin-top-left rounded-md bg-white py-2 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        {item.children.map((child) => {
          const href = resolveFlexibleLink(child.link);
          const external = isExternalLink(child.link);

          return (
            <MenuItem key={child.label}>
              <Link
                href={href}
                external={external}
                variant="unstyled"
                className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900"
              >
                <span className="font-medium">{child.label}</span>
                {child.description && (
                  <span className="mt-1 block text-xs text-gray-500">
                    {child.description}
                  </span>
                )}
              </Link>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
