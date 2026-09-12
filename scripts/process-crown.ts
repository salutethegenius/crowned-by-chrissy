import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ASSET_SRC = "/home/ubuntu/.cursor/projects/workspace/assets/06a3f923-0b47-40b6-9ad0-3bf2e942ce55.png";
const ORIGINALS = path.join(process.cwd(), "content", "originals");
const DERIVED = path.join(process.cwd(), "public", "media", "derived", "brand-crown");

async function readCrownSource() {
  try {
    return await fs.readFile(ASSET_SRC);
  } catch {
    return fs.readFile(path.join(ORIGINALS, "brand-crown.png"));
  }
}

export async function processCrown() {
  await fs.mkdir(ORIGINALS, { recursive: true });
  await fs.mkdir(DERIVED, { recursive: true });
  const buf = await readCrownSource();
  await fs.writeFile(path.join(ORIGINALS, "brand-crown.png"), buf);

  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < 16) data[i + 3] = 0;
    else if (lum < 42) data[i + 3] = Math.round(((lum - 16) / 26) * 255);
  }

  const transparent = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
  const meta = await sharp(transparent).metadata();
  await fs.writeFile(path.join(DERIVED, "crown.png"), transparent);
  await sharp(transparent)
    .resize({ height: 400, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(path.join(DERIVED, "400.webp"));
  await sharp(transparent)
    .resize({ height: 800, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(path.join(DERIVED, "800.webp"));
  console.log(`Wrote brand-crown ${meta.width}x${meta.height}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  processCrown().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
