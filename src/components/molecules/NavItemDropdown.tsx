import Link from '@components/atoms/Link';
import {
  Menu,
  MenuButton,
  MenuHeading,
  MenuItem,
  MenuItems,
  MenuSection,
} from '@headlessui/react';
import {
  isExternalLink,
  isPathActive,
  type NavItemDropdown as NavItemDropdownType,
  type NavItemSingle,
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

  // Groups (third level) are laid out as columns; plain links stack in one column
  const hasGroups = item.children.some((child) => child.type === 'dropdown');
  const links = item.children.filter(
    (child): child is NavItemSingle => child.type === 'link'
  );
  const groups = item.children.filter(
    (child): child is NavItemDropdownType => child.type === 'dropdown'
  );

  const renderLink = (child: NavItemSingle) => {
    const href = resolveFlexibleLink(child.link);
    const external = isExternalLink(child.link);
    const childActive = !external && isPathActive(href, currentPath);
    const childActiveStyles = childActive
      ? 'decoration-primary-300'
      : 'decoration-white transition transition-300 hover:decoration-gray-100 data-focus:decoration-gray-100';
    const itemClasses = `underline underline-offset-8 decoration-dotted decoration-4 inline-flex items-center px-3 py-2 text-black ${childActiveStyles}`;

    return (
      <MenuItem key={`${child.label}-${href}`}>
        <Link
          href={href}
          external={external}
          variant="nav"
          className={itemClasses}
          aria-current={childActive ? 'page' : undefined}
        >
          {child.label}
        </Link>
      </MenuItem>
    );
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className={buttonClasses}>
        {item.label}
        <IconChevronDown className="ml-1 h-5 w-5" aria-hidden="true" />
      </MenuButton>

      <MenuItems
        transition
        className={`absolute left-0 z-50 mt-2 flex origin-top-left gap-1 rounded-md bg-white px-2 py-2 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in ${
          hasGroups ? 'flex-row gap-6 px-4 py-4' : 'flex-col'
        }`}
      >
        {links.length > 0 &&
          (hasGroups ? (
            <MenuSection className="flex min-w-40 flex-col gap-1">
              {links.map(renderLink)}
            </MenuSection>
          ) : (
            links.map(renderLink)
          ))}

        {groups.map((group) => (
          <MenuSection key={group.label} className="flex min-w-40 flex-col gap-1">
            <MenuHeading className="px-3 pb-1 text-sm font-semibold tracking-wide text-gray-500 uppercase">
              {group.label}
            </MenuHeading>
            {group.children
              .filter((child): child is NavItemSingle => child.type === 'link')
              .map(renderLink)}
          </MenuSection>
        ))}
      </MenuItems>
    </Menu>
  );
}
