import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { siteConfig } from '@lib/config';
import { useState } from 'react';

export interface NavLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  links: NavLink[];
  currentPath?: string;
}

export default function MobileMenu({
  links,
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
                      {links.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            className={`group flex gap-x-4 text-xl text-black ${
                              isActive(link.href)
                                ? 'underline decoration-primary-300 decoration-dotted decoration-4 underline-offset-8'
                                : 'no-underline'
                            }`}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
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
