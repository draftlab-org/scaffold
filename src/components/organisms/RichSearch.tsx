import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from '@headlessui/react';
import type { SearchIndexItem } from '@utils/search';
import Fuse, { type FuseResult } from 'fuse.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import BookOpenIcon from '~icons/heroicons/book-open';
import ChevronRightIcon from '~icons/heroicons/chevron-right-16-solid';
import DocumentIcon from '~icons/heroicons/document-text';
import ExclamationTriangleIcon from '~icons/heroicons/exclamation-triangle';
import FolderIcon from '~icons/heroicons/folder';
import LifebuoyIcon from '~icons/heroicons/lifebuoy';
import MagnifyingGlassIcon from '~icons/heroicons/magnifying-glass-20-solid';
import UserIcon from '~icons/heroicons/user';

type SearchResult = SearchIndexItem;

// unplugin-icons React components (compiled as JSX) take `className`
type IconComponent = React.ComponentType<{
  className?: string;
  'aria-hidden'?: 'true' | 'false';
}>;

type CategoryConfig = {
  // Matches `category` in the search index built by @utils/search
  name: SearchIndexItem['category'];
  icon: IconComponent;
  modifier: string;
};

// Display order, icons and query modifiers for each result category. The
// entries themselves come from /api/search.json (see @utils/search).
const SEARCH_CATEGORIES: CategoryConfig[] = [
  { name: 'Pages', icon: FolderIcon, modifier: '#' },
  { name: 'People', icon: UserIcon, modifier: '>' },
  { name: 'Articles', icon: DocumentIcon, modifier: '@' },
  { name: 'Docs', icon: BookOpenIcon, modifier: '!' },
];

const MODIFIER_PATTERN = new RegExp(
  `^[${SEARCH_CATEGORIES.map((c) => `\\${c.modifier}`).join('')}]`
);

const DEBOUNCE_MS = 150;

const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'content', weight: 1 },
  ],
  threshold: 0.4,
  // Content is long; match anywhere in it, not just near the start
  ignoreLocation: true,
  includeMatches: true,
  minMatchCharLength: 3,
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type Snippet = { before: string; match: string; after: string };

const SNIPPET_CONTEXT = 40;

function sliceSnippet(text: string, start: number, end: number): Snippet {
  const from = Math.max(0, start - SNIPPET_CONTEXT);
  const to = Math.min(text.length, end + SNIPPET_CONTEXT);
  return {
    before: `${from > 0 ? '…' : ''}${text.slice(from, start)}`,
    match: text.slice(start, end),
    after: `${text.slice(end, to)}${to < text.length ? '…' : ''}`,
  };
}

// A short excerpt around the first content match, for display under a result
function getMatchSnippet(
  result: FuseResult<SearchResult>,
  query: string
): Snippet | null {
  const text = result.item.content;
  if (!text) return null;

  // Prefer an exact substring match — most meaningful to the reader
  const idx = text.toLowerCase().indexOf(query);
  if (idx !== -1) return sliceSnippet(text, idx, idx + query.length);

  // Otherwise use the longest fuzzy match in the content
  const indices = result.matches?.find((m) => m.key === 'content')?.indices;
  if (!indices?.length) return null;
  const [start, end] = indices.reduce((best, cur) =>
    cur[1] - cur[0] > best[1] - best[0] ? cur : best
  );
  return sliceSnippet(text, start, end + 1);
}

export default function RichSearch() {
  const [open, setOpen] = useState(false);
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedRawQuery, setDebouncedRawQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const query = debouncedRawQuery
    .toLowerCase()
    .replace(MODIFIER_PATTERN, '')
    .trim();

  // Run the (comparatively expensive) search after typing pauses
  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedRawQuery(rawQuery),
      DEBOUNCE_MS
    );
    return () => clearTimeout(timeout);
  }, [rawQuery]);

  // Fetch the index lazily when search opens for the first time
  useEffect(() => {
    async function fetchSearchData() {
      setLoading(true);
      try {
        const response = await fetch('/api/search.json');
        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch search data:', error);
      } finally {
        setLoading(false);
      }
    }

    // Only fetch when search opens and we haven't fetched yet
    if (open && !hasFetched.current) {
      hasFetched.current = true;
      fetchSearchData();
    }
  }, [open]);

  // Open/close event listener
  useEffect(() => {
    const handleOpenSearch = () => {
      delete document.documentElement.dataset.searchPending;
      setOpen(true);
    };

    window.addEventListener('open-search', handleOpenSearch);

    // Search may have been requested before this island hydrated
    if (document.documentElement.dataset.searchPending) handleOpenSearch();

    return () => {
      window.removeEventListener('open-search', handleOpenSearch);
    };
  }, []);

  // One Fuse index per category, rebuilt only when the data changes
  const fuseByCategory = useMemo(() => {
    const instances: Record<string, Fuse<SearchResult>> = {};
    for (const category of SEARCH_CATEGORIES) {
      instances[category.name] = new Fuse(
        results.filter((r) => r.category === category.name),
        FUSE_OPTIONS
      );
    }
    return instances;
  }, [results]);

  // Filter results for each category, with content-match snippets
  const { filteredResultsByCategory, snippets } = useMemo(() => {
    const filtered: Record<string, SearchResult[]> = {};
    const snippetsById: Record<string, Snippet> = {};

    SEARCH_CATEGORIES.forEach((category) => {
      // If modifier is used on its own, show all items from that category
      if (debouncedRawQuery === category.modifier) {
        filtered[category.name] = results.filter(
          (r) => r.category === category.name
        );
        return;
      }

      // If query is empty or another modifier is active, show nothing
      const otherModifiers = SEARCH_CATEGORIES.filter(
        (c) => c.modifier !== category.modifier
      ).map((c) => c.modifier);

      if (
        query === '' ||
        otherModifiers.some((mod) => debouncedRawQuery.startsWith(mod))
      ) {
        filtered[category.name] = [];
        return;
      }

      const matches = fuseByCategory[category.name]?.search(query) ?? [];
      filtered[category.name] = matches.map((match) => match.item);
      for (const match of matches) {
        const snippet = getMatchSnippet(match, query);
        if (snippet) snippetsById[match.item.id] = snippet;
      }
    });

    return { filteredResultsByCategory: filtered, snippets: snippetsById };
  }, [debouncedRawQuery, query, results, fuseByCategory]);

  return (
    <Dialog
      className="relative z-100"
      open={open}
      onClose={() => {
        setOpen(false);
        setRawQuery('');
        setDebouncedRawQuery('');
      }}
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/25 transition-opacity data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
        <DialogPanel
          transition
          className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-lg border-6 border-dotted border-primary-300 bg-white shadow-lg transition-all data-closed:scale-95 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        >
          <Combobox
            onChange={(item: any) => {
              if (item) {
                window.location = item.url;
              }
            }}
          >
            <div className="grid grid-cols-1">
              <ComboboxInput
                autoFocus
                className="col-start-1 row-start-1 h-12 w-full bg-white pr-4 pl-11 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm"
                placeholder="Search..."
                onChange={(event) => setRawQuery(event.target.value)}
                onBlur={() => setRawQuery('')}
              />
              <MagnifyingGlassIcon
                className="pointer-events-none col-start-1 row-start-1 ml-4 size-5 self-center text-gray-400"
                aria-hidden="true"
              />
            </div>

            {loading && query === '' && (
              <div className="space-y-4 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-16 animate-pulse rounded bg-primary-100" />
                    <div className="space-y-2">
                      {[1, 2].map((j) => (
                        <div
                          key={j}
                          className="flex items-center gap-3 px-4 py-2"
                        >
                          <div className="size-6 animate-pulse rounded bg-primary-100" />
                          <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading &&
              Object.values(filteredResultsByCategory).some(
                (arr) => arr.length > 0
              ) && (
                <ComboboxOptions
                  static
                  as="ul"
                  className="max-h-80 transform-gpu scroll-py-10 scroll-pb-2 space-y-4 overflow-y-auto p-4 pb-2"
                >
                  {SEARCH_CATEGORIES.map((category) => {
                    const items =
                      filteredResultsByCategory[category.name] || [];
                    if (items.length === 0) return null;

                    const Icon = category.icon;

                    return (
                      <li key={category.name}>
                        <h2 className="text-xs font-semibold tracking-wide text-gray-900 uppercase">
                          {category.name}
                        </h2>
                        <ul className="-mx-4 mt-2 text-sm text-gray-700">
                          {items.map((item) => (
                            <ComboboxOption
                              as="li"
                              key={item.id}
                              value={item}
                              className="group flex cursor-pointer items-center rounded px-4 py-2 transition-colors select-none hover:bg-primary-100 data-focus:bg-primary-300 data-focus:outline-hidden"
                            >
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className={
                                    category.name === 'People'
                                      ? 'size-6 flex-none rounded-full border-2 border-gray-200 bg-gray-100'
                                      : 'aspect-video h-6 flex-none rounded border-2 border-gray-200 bg-gray-100 object-cover'
                                  }
                                />
                              ) : (
                                <Icon
                                  className="size-6 flex-none text-gray-500 group-data-focus:text-gray-700"
                                  aria-hidden="true"
                                />
                              )}
                              <span className="ml-3 min-w-0 flex-auto">
                                <span className="block truncate">
                                  {item.name}
                                </span>
                                {snippets[item.id] && (
                                  <span className="mt-0.5 block truncate text-xs text-gray-500 group-data-focus:text-gray-700">
                                    {snippets[item.id].before}
                                    <mark className="rounded-sm bg-highlight-200 px-0.5 text-gray-900">
                                      {snippets[item.id].match}
                                    </mark>
                                    {snippets[item.id].after}
                                  </span>
                                )}
                              </span>
                              <ChevronRightIcon
                                className="ml-3 size-4 flex-none text-gray-400 group-data-focus:text-gray-700"
                                aria-hidden="true"
                              />
                            </ComboboxOption>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ComboboxOptions>
              )}

            {!loading && rawQuery === '?' && (
              <div className="px-6 py-14 text-center text-sm sm:px-14">
                <LifebuoyIcon
                  className="mx-auto size-6 text-gray-400"
                  aria-hidden="true"
                />
                <p className="mt-4 font-semibold text-gray-900">
                  Help with searching
                </p>
                <p className="mt-2">
                  Quickly search through site content and get results divided by
                  category. You can also use search modifiers in the footer to
                  search and show all results from a single category.
                </p>
              </div>
            )}

            {!loading &&
              query !== '' &&
              rawQuery !== '?' &&
              Object.values(filteredResultsByCategory).every(
                (arr) => arr.length === 0
              ) && (
                <div className="px-6 py-14 text-center text-sm sm:px-14">
                  <ExclamationTriangleIcon
                    className="mx-auto size-6 text-gray-400"
                    aria-hidden="true"
                  />
                  <p className="mt-4 font-semibold text-gray-900">
                    No results found
                  </p>
                  <p className="mt-2">
                    We couldn't find anything with that term. Please try again.
                  </p>
                </div>
              )}

            <div className="flex flex-wrap items-center border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-xs">
              Type{' '}
              {SEARCH_CATEGORIES.map((category) => (
                <span key={category.name} className="inline-flex items-center">
                  <kbd
                    className={classNames(
                      'mx-1 flex size-5 items-center justify-center rounded-sm border-2 bg-white font-semibold sm:mx-2',
                      rawQuery.startsWith(category.modifier)
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700'
                    )}
                  >
                    {category.modifier}
                  </kbd>{' '}
                  <span className="">
                    {`for ${category.name.toLowerCase()}, `}
                  </span>
                </span>
              ))}
              <kbd
                className={classNames(
                  'mx-1 flex size-5 items-center justify-center rounded-sm border-2 bg-white font-semibold sm:mx-2',
                  rawQuery === '?'
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-700'
                )}
              >
                ?
              </kbd>{' '}
              for help.
            </div>
          </Combobox>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
