import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import IconChevronDown from '~icons/heroicons/chevron-down-20-solid';
import IconCheck from '~icons/heroicons/check-20-solid';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selected: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <IconChevronDown
      class={`h-5 w-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    />
  );
}

function CheckIcon() {
  return (
    <IconCheck class="h-5 w-5 text-primary-600" aria-hidden="true" />
  );
}

export default function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = 'All',
  className = '',
}: FilterDropdownProps) {
  const selectedOption = options.find((opt) => opt.value === selected);
  const displayValue = selectedOption?.label || placeholder;

  // Add "All" option at the beginning
  const allOptions: FilterOption[] = [
    { value: '', label: placeholder },
    ...options,
  ];

  const handleChange = (value: string) => {
    onChange(value === '' ? null : value);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <Listbox value={selected || ''} onChange={handleChange}>
        {({ open }) => (
          <>
            <ListboxButton
              className={`relative w-full cursor-pointer rounded-lg border bg-white py-2 pl-3 pr-10 text-left shadow-sm transition-all
                ${open ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-300 hover:border-gray-400'}
                focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300
              `}
            >
              <span
                className={`block truncate ${!selectedOption ? 'text-gray-500' : ''}`}
              >
                {displayValue}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronIcon open={open} />
              </span>
            </ListboxButton>

            <ListboxOptions
              transition
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 transition focus:outline-none data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
            >
              {allOptions.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className="relative cursor-pointer select-none py-2 pl-10 pr-4 text-gray-900 data-focus:bg-primary-50 data-focus:text-primary-900 data-selected:font-medium"
                >
                  {({ selected: isSelected }) => (
                    <>
                      <span
                        className={`block truncate ${isSelected ? 'font-medium' : 'font-normal'}`}
                      >
                        {option.label}
                      </span>
                      {isSelected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <CheckIcon />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </>
        )}
      </Listbox>
    </div>
  );
}
