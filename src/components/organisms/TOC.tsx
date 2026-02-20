import type { TocEntry } from '@utils/renderMarkdown';
import { useEffect, useState } from 'react';

interface TOCProps {
  entries: TocEntry[];
  title?: string;
}

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
  onEntryClick: (id: string) => void;
}) {
  return (
    <ul className={depth > 0 ? 'mt-1 ml-4' : ''}>
      {entries.map((entry) => {
        const isActive = activeId === entry.id;
        return (
          <li key={entry.id} className="mt-1">
            <button
              type="button"
              onClick={() => onEntryClick(entry.id)}
              className={`block w-full cursor-pointer text-left text-sm transition-colors ${
                isActive
                  ? 'font-medium text-primary-600 underline decoration-primary-300 decoration-dotted decoration-2 underline-offset-4'
                  : 'hover:text-gray-900'
              }`}
            >
              {entry.value}
            </button>
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

export default function TOC({ entries, title = 'On this page' }: TOCProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const flatEntries = flattenEntries(entries);
    const headingIds = flatEntries.map((e) => e.id);

    // Set up intersection observer
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
        rootMargin: '-80px 0px -70% 0px',
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

  const handleEntryClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
    }
  };

  if (entries.length === 0) {
    return null;
  }

  return (
    <nav className="sticky top-24" aria-label="Table of contents">
      <h4 className="mb-3 text-sm font-semibold tracking-wide text-gray-900 uppercase">
        {title}
      </h4>
      <TOCEntries
        entries={entries}
        activeId={activeId}
        onEntryClick={handleEntryClick}
      />
    </nav>
  );
}
