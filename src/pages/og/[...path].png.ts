import { getCollection, getEntry } from 'astro:content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isVisible } from '@utils/content';
import { generateOgImage } from '@utils/og';
import type { APIRoute, GetStaticPaths } from 'astro';

// Build a reverse lookup: ImageMetadata.src → absolute file path on disk.
// Astro's image() schema resolves to ImageMetadata where .src is a hashed
// URL like /_astro/photo.abc123.jpg. We need the original path for Sharp.
const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{jpg,jpeg,png,webp,svg}',
  { eager: true }
);

const srcToAbsolutePath = new Map<string, string>();
for (const [globPath, mod] of Object.entries(imageModules)) {
  const absolutePath = join(process.cwd(), globPath);
  srcToAbsolutePath.set(mod.default.src, absolutePath);
}

function resolveImageBuffer(image: ImageMetadata): Buffer | null {
  const absPath = srcToAbsolutePath.get(image.src);
  if (!absPath) return null;
  return readFileSync(absPath);
}

// Resolve the square logo from site config for the OG badge
async function resolveLogoBuffer(): Promise<Buffer | null> {
  const siteConfig = await getEntry('site', 'config');
  const logo = siteConfig?.data.defaultLogoSquare;
  if (!logo) return null;
  return resolveImageBuffer(logo);
}

interface OgEntry {
  ogPath: string;
  image: ImageMetadata;
}

export const getStaticPaths: GetStaticPaths = async () => {
  // If no square logo is configured, skip OG generation entirely
  const siteConfig = await getEntry('site', 'config');
  if (!siteConfig?.data.defaultLogoSquare) return [];

  const entries: OgEntry[] = [];

  // Home page
  const homePage = await getEntry('pages', 'home');
  if (homePage?.data.heroImage) {
    entries.push({ ogPath: 'index', image: homePage.data.heroImage });
  }

  // CMS pages (excluding home, which is handled above)
  const pages = await getCollection('pages');
  for (const page of pages) {
    if (page.id === 'home' || !isVisible(page) || !page.data.heroImage)
      continue;
    entries.push({ ogPath: page.id, image: page.data.heroImage });
  }

  // Articles
  const articles = await getCollection('articles');
  for (const article of articles) {
    if (!isVisible(article) || !article.data.heroImage) continue;
    entries.push({
      ogPath: `articles/${article.slug}`,
      image: article.data.heroImage,
    });
  }

  // People
  const people = await getCollection('people');
  for (const person of people) {
    if (!isVisible(person) || !person.data.headshot) continue;
    entries.push({
      ogPath: `people/${person.data.id}`,
      image: person.data.headshot,
    });
  }

  // Partners (image is optional)
  const partners = await getCollection('partners');
  for (const partner of partners) {
    if (!isVisible(partner) || !partner.data.image) continue;
    entries.push({
      ogPath: `partners/${partner.data.id}`,
      image: partner.data.image,
    });
  }

  return entries.map((entry) => ({
    params: { path: entry.ogPath },
    props: { image: entry.image },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { image } = props as { image: ImageMetadata };
  const imageBuffer = resolveImageBuffer(image);

  if (!imageBuffer) {
    return new Response('Image not found', { status: 404 });
  }

  const logoBuffer = await resolveLogoBuffer();
  const ogBuffer = await generateOgImage(imageBuffer, logoBuffer);

  return new Response(new Uint8Array(ogBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
