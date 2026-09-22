import type { TocEntry } from '@utils/renderMarkdown';
import { type MouseEvent, useEffect, useState } from 'react';

interface TOCProps {
  entries: TocEntry[];
  // Pass an empty string to omit the heading (e.g. inside a <details> summary)
  title?: string;
  // Stick to the viewport; turn off when a parent handles positioning
  sticky?: boolean;
}

// Breathing room between the sticky header and a heading scrolled to
const SCROLL_GAP = 16;

// Flatten TOC entries for intersection observer
function flattenEntries(entries: TocEntry[]): TocEntry[] {
  const flattened: TocEntry[] = [];
  for (const entry of entries) {
    flattened.push(entry);
    if (entry.children) {
      flattened.push(...flattenEntries(entry.children));
    }
  }
  return flattened;
}

// Height of the sticky site header, if any — measured, not hardcoded, so it
// follows the header's actual size (logo, banner, breakpoint)
function getStickyHeaderHeight(): number {
  const header = document.querySelector('header');
  if (!header || getComputedStyle(header).position !== 'sticky') return 0;
  return header.getBoundingClientRect().height;
}

// Render TOC entries recursively
function TOCEntries({
  entries,
  activeId,
  depth = 0,
  onEntryClick,
}: {
  entries: TocEntry[];
  activeId: string | null;
  depth?: number;
  onEntryClick: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
}) {
  return (
    <ul className={depth > 0 ? 'mt-1 ml-4' : ''}>
      {entries.map((entry) => {
        const isActive = activeId === entry.id;
        return (
          <li key={entry.id} className="mt-1">
            <a
              href={`#${entry.id}`}
              data-component="toc-link"
              aria-current={isActive ? 'location' : undefined}
              onClick={(event) => onEntryClick(event, entry.id)}
              className="toc-link block text-sm transition-colors"
            >
              {entry.value}
            </a>
            {entry.children && entry.children.length > 0 && (
              <TOCEntries
                entries={entry.children}
                activeId={activeId}
                depth={depth + 1}
                onEntryClick={onEntryClick}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function TOC({
  entries,
  title = 'On this page',
  sticky = true,
}: TOCProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const flatEntries = flattenEntries(entries);
    const headingIds = flatEntries.map((e) => e.id);

    // A heading becomes active once it passes just below the sticky header
    const topOffset = Math.round(getStickyHeaderHeight() + SCROLL_GAP);

    const observer = new IntersectionObserver(
      (observerEntries) => {
        // Find the first visible heading
        for (const observerEntry of observerEntries) {
          if (observerEntry.isIntersecting) {
            setActiveId(observerEntry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: `-${topOffset}px 0px -70% 0px`,
        threshold: 0,
      }
    );

    // Observe all headings
    headingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [entries]);

  // Entries are real links (shareable, work without JS); when hydrated, scroll
  // with the sticky header accounted for and keep the URL hash in sync
  const handleEntryClick = (
    event: MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    // Let modified clicks (open in new tab etc.) behave natively
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
      return;

    const element = document.getElementById(id);
    if (!element) return;

    event.preventDefault();
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const top =
      element.getBoundingClientRect().top +
      window.scrollY -
      getStickyHeaderHeight() -
      SCROLL_GAP;

    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.pushState(null, '', `#${id}`);
    // Move focus for keyboard and screen reader users, without a second jump
    element.setAttribute('tabindex', '-1');
    element.focus({ preventScroll: true });
    setActiveId(id);
  };

  if (entries.length === 0) {
    return null;
  }

  return (
    <nav
      className={sticky ? 'sticky top-24 pt-6' : ''}
      aria-label="Table of contents"
    >
      {title && (
        <h4 className="toc-title mb-3 font-semibold tracking-wide uppercase">
          {title}
        </h4>
      )}
      <TOCEntries
        entries={entries}
        activeId={activeId}
        onEntryClick={handleEntryClick}
      />
    </nav>
  );
}
