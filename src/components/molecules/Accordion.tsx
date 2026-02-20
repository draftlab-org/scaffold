import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import IconChevronDown from '~icons/heroicons/chevron-down-20-solid';

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
    <IconChevronDown
      class={`h-5 w-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    />
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
