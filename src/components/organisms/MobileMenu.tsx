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

interface MobileMenuProps {
  items: NavItem[];
  currentPath?: string;
}

// TODO: #17 clean up manually added SVGs, check external link

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
        <svg
          className="size-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
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
                <svg
                  className="size-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
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
                                  <svg
                                    role="graphics-symbol img"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="ml-auto h-5 w-5 shrink-0 transition-transform group-data-open:rotate-180"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
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
                                            <svg
                                              role="graphics-symbol img"
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 20 20"
                                              fill="currentColor"
                                              className="h-4 w-4 opacity-70"
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
                                <svg
                                  role="graphics-symbol img"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-4 w-4 opacity-70"
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
