import { getImage } from 'astro:assets';

/** A pre-optimised image, ready to pass as a prop to a React island. */
export interface CardImage {
  src: string;
  width: number;
  height: number;
}

/**
 * React islands can't use Astro's <Image>, so images passed to them as
 * `image.src` ship at their original size. This resizes (never upscales) and
 * converts to webp at build time, keeping the aspect ratio so the returned
 * width/height can be set on the <img> to avoid layout shift.
 *
 * @param width Target width in px — about 2× the largest rendered width
 */
export async function getCardImage(
  image: ImageMetadata,
  width?: number
): Promise<CardImage>;
export async function getCardImage(
  image: ImageMetadata | undefined,
  width?: number
): Promise<CardImage | undefined>;
export async function getCardImage(
  image: ImageMetadata | undefined,
  width = 800
): Promise<CardImage | undefined> {
  if (!image) return undefined;

  // SVGs are already resolution-independent; rasterising would only hurt
  if (image.format === 'svg') {
    return { src: image.src, width: image.width, height: image.height };
  }

  const targetWidth = Math.min(width, image.width);
  const targetHeight = Math.round((image.height / image.width) * targetWidth);
  const optimised = await getImage({
    src: image,
    width: targetWidth,
    height: targetHeight,
    format: 'webp',
  });

  return { src: optimised.src, width: targetWidth, height: targetHeight };
}
