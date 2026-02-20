import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import { siteConfig } from '@lib/config';
import type { NavItem } from '@utils/navigation';
import { isExternalLink, resolveFlexibleLink } from '@utils/navigation';
import { useState } from 'react';
import IconBars3 from '~icons/heroicons/bars-3';
import IconXMark from '~icons/heroicons/x-mark';
import IconChevronDown from '~icons/heroicons/chevron-down-20-solid';
import IconExternalLink from '~icons/heroicons/arrow-top-right-on-square-20-solid';

interface MobileMenuProps {
  items: NavItem[];
  currentPath?: string;
}

export default function MobileMenu({
  items,
  currentPath = '/',
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
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
        <IconBars3 class="size-6" aria-hidden="true" />
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
                <IconXMark class="size-6 text-white" aria-hidden="true" />
              </button>
            </div>

            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <a
                  href="/"
                  className="font-serif text-2xl font-bold text-gray-900 underline decoration-primary-300 decoration-dotted decoration-4 underline-offset-8"
                >
                  {siteConfig.name}
                </a>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul className="-mx-2 space-y-4">
                      {items.map((item) => {
                        if (item.type === 'dropdown') {
                          return (
                            <li key={item.label}>
                              <Disclosure as="div">
                                <DisclosureButton className="group flex w-full items-center gap-x-4 text-xl text-black">
                                  {item.label}
                                  <IconChevronDown class="ml-auto h-5 w-5 shrink-0 transition-transform group-data-open:rotate-180" />
                                </DisclosureButton>
                                <DisclosurePanel
                                  as="ul"
                                  className="mt-2 space-y-2 pl-4"
                                >
                                  {item.children.map((child) => {
                                    const href = resolveFlexibleLink(
                                      child.link
                                    );
                                    const external = isExternalLink(child.link);
                                    return (
                                      <li key={child.label}>
                                        <a
                                          href={href}
                                          target={
                                            external ? '_blank' : undefined
                                          }
                                          rel={
                                            external
                                              ? 'noopener noreferrer'
                                              : undefined
                                          }
                                          className={`group flex items-center gap-x-2 text-lg text-gray-700 ${
                                            isActive(href)
                                              ? 'underline decoration-primary-300 decoration-dotted decoration-4 underline-offset-8'
                                              : 'no-underline'
                                          }`}
                                        >
                                          {child.label}
                                          {external && (
                                            <IconExternalLink class="h-4 w-4 opacity-70" />
                                          )}
                                        </a>
                                      </li>
                                    );
                                  })}
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
                              className={`group flex items-center gap-x-4 text-xl text-black ${
                                isActive(href)
                                  ? 'underline decoration-primary-300 decoration-dotted decoration-4 underline-offset-8'
                                  : 'no-underline'
                              }`}
                            >
                              {item.label}
                              {external && (
                                <IconExternalLink class="h-4 w-4 opacity-70" />
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
