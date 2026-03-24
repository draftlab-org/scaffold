import type { CollectionEntry } from 'astro:content';
import { getVisibleEntries } from '@utils/content';

export type DocEntry = CollectionEntry<'docs'>;

export interface DocChapter {
  name: string;
  order: number;
  pages: DocEntry[];
}

/** Get all visible docs, sorted by chapterOrder then order */
export async function getPublishedDocs(): Promise<DocEntry[]> {
  const docs = await getVisibleEntries('docs');
  return docs.sort((a, b) => {
    if (a.data.chapterOrder !== b.data.chapterOrder) {
      return a.data.chapterOrder - b.data.chapterOrder;
    }
    return a.data.order - b.data.order;
  });
}

/** Group docs into chapters, sorted */
export async function getDocChapters(): Promise<DocChapter[]> {
  const docs = await getPublishedDocs();
  const chapterMap = new Map<string, DocChapter>();

  for (const doc of docs) {
    const existing = chapterMap.get(doc.data.chapter);
    if (existing) {
      existing.pages.push(doc);
    } else {
      chapterMap.set(doc.data.chapter, {
        name: doc.data.chapter,
        order: doc.data.chapterOrder,
        pages: [doc],
      });
    }
  }

  return Array.from(chapterMap.values()).sort((a, b) => a.order - b.order);
}

/** Get the first doc page (for /docs redirect) */
export async function getFirstDocPage(): Promise<DocEntry | undefined> {
  const docs = await getPublishedDocs();
  return docs[0];
}

/** Get prev/next navigation for a doc */
export async function getDocNavigation(currentPermalink: string) {
  const docs = await getPublishedDocs();
  const index = docs.findIndex((d) => d.data.permalink === currentPermalink);
  return {
    prev: index > 0 ? docs[index - 1] : null,
    next: index < docs.length - 1 ? docs[index + 1] : null,
  };
}

export function getDocUrl(doc: DocEntry): string {
  return `/docs/${doc.data.permalink}`;
}
