export interface MastodonAccount {
  display_name: string;
  username: string;
  acct: string;
  avatar: string;
  url: string;
}

export interface MastodonMedia {
  type: 'image' | 'video' | 'gifv' | 'audio' | 'unknown';
  url: string;
  preview_url: string;
  description: string | null;
  meta?: {
    original?: { width?: number; height?: number };
    small?: { width?: number; height?: number };
  };
}

export interface MastodonPost {
  id: string;
  url: string;
  content: string;
  created_at: string;
  account: MastodonAccount;
  media_attachments: MastodonMedia[];
  sourceInstance: string;
}

const STATUS_ID_RE = /\/(\d+)(?:\/?$|\?)/;

export function parseMastodonUrl(
  url: string
): { instance: string; statusId: string } | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const match = u.pathname.match(STATUS_ID_RE);
    if (!match) return null;
    return { instance: u.hostname, statusId: match[1] };
  } catch {
    return null;
  }
}

export async function fetchMastodonPost(
  url: string
): Promise<MastodonPost | null> {
  const parsed = parseMastodonUrl(url);
  if (!parsed) return null;

  const apiUrl = `https://${parsed.instance}/api/v1/statuses/${parsed.statusId}`;
  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Omit<MastodonPost, 'sourceInstance'>;
    return { ...data, sourceInstance: parsed.instance };
  } catch {
    return null;
  }
}
