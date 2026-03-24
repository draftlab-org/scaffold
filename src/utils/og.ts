import sharp from 'sharp';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const LOGO_SIZE = 80;
const BADGE_MARGIN = 24;

async function buildLogoBadge(logoBuffer: Buffer): Promise<Buffer> {
  return sharp(logoBuffer)
    .resize(LOGO_SIZE, LOGO_SIZE)
    .png()
    .toBuffer();
}

export async function generateOgImage(
  imageBuffer: Buffer,
  logoBuffer: Buffer | null,
): Promise<Buffer> {
  const base = sharp(imageBuffer).resize(OG_WIDTH, OG_HEIGHT, {
    fit: 'cover',
    position: 'centre',
  });

  if (logoBuffer) {
    const badge = await buildLogoBadge(logoBuffer);
    return base
      .composite([
        {
          input: badge,
          left: OG_WIDTH - LOGO_SIZE - BADGE_MARGIN,
          top: OG_HEIGHT - LOGO_SIZE - BADGE_MARGIN,
        },
      ])
      .png()
      .toBuffer();
  }

  return base.png().toBuffer();
}
