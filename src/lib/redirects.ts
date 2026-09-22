import { existsSync, readFileSync } from 'node:fs';

// Read at config time rather than imported: the file lives in protected
// content, so `update-from-scaffold` removes it from derived sites until they
// add their own redirects in the CMS. A missing file means no redirects.
const REDIRECTS_FILE = new URL('../content/site/_redirects.json', import.meta.url);

const loadRedirects = (): RedirectEntry[] => {
  if (!existsSync(REDIRECTS_FILE)) return [];
  const data = JSON.parse(readFileSync(REDIRECTS_FILE, 'utf-8')) as {
    redirects?: RedirectEntry[] | null;
  };
  return data.redirects ?? [];
};

type RedirectStatus = 300 | 301 | 302 | 303 | 304 | 307 | 308;

interface RedirectEntry {
  from: string;
  to: string;
  status?: number | string | null;
}

/** Normalise an internal path to a single leading slash; leave URLs alone. */
const toPath = (value: string) =>
  /^https?:\/\//.test(value) ? value : `/${value.trim().replace(/^\/+/, '')}`;

/**
 * Turns the CMS-managed redirect list (`src/content/site/_redirects.json`)
 * into Astro's `redirects` config. Editors may write paths with or without a
 * leading slash; `to` may be a full external URL. Pages CMS stores the select
 * value as a string, so status is coerced to a number.
 */
export const buildRedirects = (entries: RedirectEntry[] = loadRedirects()) =>
  entries.reduce<
    Record<string, string | { destination: string; status: RedirectStatus }>
  >((acc, { from, to, status }) => {
    if (!from?.trim() || !to?.trim()) return acc;
    const destination = toPath(to);
    acc[toPath(from)] = status
      ? { destination, status: Number(status) as RedirectStatus }
      : destination;
    return acc;
  }, {});
