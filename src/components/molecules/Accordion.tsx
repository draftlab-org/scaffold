import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';

export interface AccordionItem {
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AccordionItemComponent({
  item,
  defaultOpen = false,
}: {
  item: AccordionItem;
  defaultOpen?: boolean;
}) {
  return (
    <Disclosure as="div" defaultOpen={defaultOpen}>
      {({ open }) => (
        <>
          <DisclosureButton
            className={`flex w-full items-center justify-between py-4 text-left text-lg font-medium underline decoration-dotted decoration-2 underline-offset-8 transition-colors ${open ? 'text-gray-900 decoration-primary-300' : 'text-gray-700 decoration-transparent hover:text-gray-900 hover:decoration-gray-200'} `}
          >
            <span>{item.title}</span>
            <ChevronIcon open={open} />
          </DisclosureButton>
          <DisclosurePanel
            transition
            className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
          >
            <div className="pt-2 pb-4 text-gray-600">
              <div dangerouslySetInnerHTML={{ __html: item.content }} />
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

export default function Accordion({
  items,
  allowMultiple = true,
  className = '',
}: AccordionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`divide-y divide-gray-200 ${className}`}>
      {items.map((item, index) => (
        <AccordionItemComponent
          key={`${item.title}:${index}`}
          item={item}
          defaultOpen={index === 0 && !allowMultiple}
        />
      ))}
    </div>
  );
}
