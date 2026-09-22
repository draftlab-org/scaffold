import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import type { NavItem, NavItemSingle } from '@utils/navigation';
import {
  isExternalLink,
  isItemActive,
  isPathActive,
  resolveFlexibleLink,
} from '@utils/navigation';
import { slugify } from '@utils/slugify';
import { useState } from 'react';
import IconExternalLink from '~icons/heroicons/arrow-top-right-on-square-20-solid';
import IconBars3 from '~icons/heroicons/bars-3';
import IconChevronDown from '~icons/heroicons/chevron-down-20-solid';
import IconXMark from '~icons/heroicons/x-mark';

interface MobileMenuProps {
  items: NavItem[];
  currentPath?: string;
  // Passed in rather than imported, so the site config isn't bundled into client JS
  siteName: string;
}

export default function MobileMenu({
  items,
  currentPath = '/',
  siteName,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeLinkClasses =
    'underline decoration-primary-300 decoration-dotted decoration-4 underline-offset-8';

  const renderChildLink = (child: NavItemSingle) => {
    const href = resolveFlexibleLink(child.link);
    const external = isExternalLink(child.link);
    const active = !external && isPathActive(href, currentPath);
    return (
      <li key={`${child.label}-${href}`}>
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          aria-current={active ? 'page' : undefined}
          className={`group flex items-center gap-x-2 text-lg text-gray-700 ${
            active ? activeLinkClasses : 'no-underline'
          }`}
        >
          {child.label}
          {external && (
            <>
              <IconExternalLink className="h-4 w-4 opacity-70" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </>
          )}
        </a>
      </li>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="button-base button-primary inline-flex cursor-pointer items-center justify-center rounded-md p-1"
        aria-label="Open menu"
      >
        <IconBars3 className="size-6" aria-hidden="true" />
      </button>

      {/* Mobile menu dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50 md:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <div className="absolute top-0 right-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="-m-2.5 p-2.5"
                aria-label="Close menu"
              >
                <IconXMark className="size-6 text-white" aria-hidden="true" />
              </button>
            </div>

            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <a
                  href="/"
                  className="font-serif text-2xl font-bold text-gray-900 underline decoration-primary-300 decoration-dotted decoration-4 underline-offset-8"
                >
                  {siteName}
                </a>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul className="-mx-2 space-y-4">
                      {items.map((item, itemIndex) => {
                        if (item.type === 'dropdown') {
                          return (
                            <li key={item.label}>
                              <Disclosure
                                as="div"
                                defaultOpen={isItemActive(item, currentPath)}
                              >
                                <DisclosureButton className="group flex w-full items-center gap-x-4 text-xl text-black">
                                  {item.label}
                                  <IconChevronDown className="ml-auto h-5 w-5 shrink-0 transition-transform group-data-open:rotate-180" />
                                </DisclosureButton>
                                <DisclosurePanel
                                  as="ul"
                                  className="mt-2 space-y-2 pl-4"
                                >
                                  {item.children.map((child, childIndex) =>
                                    child.type === 'dropdown' ? (
                                      <li key={child.label} className="pt-2">
                                        <p
                                          id={`mobile-nav-group-${itemIndex}-${childIndex}-${slugify(child.label)}`}
                                          className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
                                        >
                                          {child.label}
                                        </p>
                                        <ul
                                          aria-labelledby={`mobile-nav-group-${itemIndex}-${childIndex}-${slugify(child.label)}`}
                                          className="space-y-2 pl-2"
                                        >
                                          {child.children
                                            .filter(
                                              (grandchild): grandchild is NavItemSingle =>
                                                grandchild.type === 'link'
                                            )
                                            .map(renderChildLink)}
                                        </ul>
                                      </li>
                                    ) : (
                                      renderChildLink(child)
                                    )
                                  )}
                                </DisclosurePanel>
                              </Disclosure>
                            </li>
                          );
                        }

                        const href = resolveFlexibleLink(item.link);
                        const external = isExternalLink(item.link);
                        return (
                          <li key={item.label}>
                            <a
                              href={href}
                              target={external ? '_blank' : undefined}
                              rel={external ? 'noopener noreferrer' : undefined}
                              aria-current={
                                !external && isPathActive(href, currentPath)
                                  ? 'page'
                                  : undefined
                              }
                              className={`group flex items-center gap-x-4 text-xl text-black ${
                                !external && isPathActive(href, currentPath)
                                  ? activeLinkClasses
                                  : 'no-underline'
                              }`}
                            >
                              {item.label}
                              {external && (
                                <IconExternalLink className="h-4 w-4 opacity-70" />
                              )}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
