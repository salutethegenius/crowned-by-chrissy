import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ASSETS = "/home/ubuntu/.cursor/projects/workspace/assets";
const ORIGINALS = path.join(process.cwd(), "content", "originals");
const DERIVED = path.join(process.cwd(), "public", "media", "derived");
const ICONS = path.join(process.cwd(), "public", "icons");

export const IMAGE_MAP = [
  { file: "b6bf4b54-b9a2-448e-ac10-a076df4d274d.jpg", slug: "knotless-braids-long-back" },
  { file: "77d1eee7-a047-489b-884c-f19ee4368e1f.jpg", slug: "locs-high-bun-profile" },
  { file: "bf722cc1-0cab-4839-a777-5c1ca980cc55.jpg", slug: "locs-natural-length" },
  { file: "81e77f4e-14b0-4fed-a3ca-0f6089c6ca7b.jpg", slug: "starter-locs" },
  { file: "5f8a9bfb-0341-4cf9-b945-dcfdae148722.jpg", slug: "salon-wall-signs" },
  { file: "c7bed8a0-09c9-4438-8d5e-77f618f5c829.jpg", slug: "locs-updo-pearls" },
  { file: "7b27daad-74e5-4dbd-8f84-904d2904eccf.jpg", slug: "brand-logo" },
  { file: "3a131f01-f195-4fe6-a875-3e116cfc6e23.jpg", slug: "locs-highlighted-bun" },
  { file: "8653f495-7b08-42d5-b819-7f1d6fa2983c.jpg", slug: "barrel-twists-curly-end" },
  { file: "35a2d50c-c4b3-4da5-ba3f-f978fdf18284.jpg", slug: "barrel-twists-diamond" },
  { file: "da43a71b-154d-49b3-a9a9-c498bc3f601a.jpg", slug: "locs-low-ponytail" },
  { file: "2a87117e-81cf-4368-9e13-339794bf8d2e.jpg", slug: "loc-retwist-front" },
  { file: "6006efb6-178d-4070-90a3-f870e96796c4.jpg", slug: "barrel-twists-overhead" },
  { file: "c8192c8b-285f-4de5-8f73-b5b315b4c64d.jpg", slug: "two-strand-twists-portrait" },
  { file: "148d9648-97d0-4591-a58d-f60df71349cd.jpg", slug: "twists-burgundy-ends" },
  { file: "7f4e4bc7-628c-476a-99d5-06d017711d42.jpg", slug: "feed-in-braids-bun" },
  { file: "099799aa-7a1a-48ce-acb5-360e5904ad45.jpg", slug: "salon-hexagon-wall" },
  { file: "c7a3768e-0d59-4eaf-b1e8-160263346a23.jpg", slug: "portrait-unconfirmed" },
] as const;

async function derive(buf: Buffer, dir: string, extra?: { square?: number[] }) {
  await fs.mkdir(dir, { recursive: true });
  await sharp(buf).rotate().jpeg({ quality: 92 }).toFile(path.join(dir, "original.jpg"));
  for (const width of [400, 800, 1200, 1600]) {
    await sharp(buf)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(dir, `${width}.webp`));
  }
  if (extra?.square) {
    for (const size of extra.square) {
      await sharp(buf)
        .rotate()
        .resize(size, size, { fit: "cover", position: "attention" })
        .png()
        .toFile(path.join(dir, `icon-${size}.png`));
    }
  }
}

export async function processImages() {
  await fs.mkdir(ORIGINALS, { recursive: true });
  await fs.mkdir(DERIVED, { recursive: true });
  await fs.mkdir(ICONS, { recursive: true });
  for (const item of IMAGE_MAP) {
    const src = path.join(ASSETS, item.file);
    const originalDest = path.join(ORIGINALS, `${item.slug}.jpg`);
    const buf = await fs.readFile(src);
    await fs.writeFile(originalDest, buf);
    await derive(buf, path.join(DERIVED, item.slug), item.slug === "brand-logo" ? { square: [192, 512] } : undefined);
  }
  const logo = await fs.readFile(path.join(DERIVED, "brand-logo", "original.jpg"));
  await fs.copyFile(path.join(DERIVED, "brand-logo", "icon-192.png"), path.join(ICONS, "icon-192.png"));
  await fs.copyFile(path.join(DERIVED, "brand-logo", "icon-512.png"), path.join(ICONS, "icon-512.png"));
  await sharp(logo).resize(32, 32, { fit: "cover" }).png().toFile(path.join(process.cwd(), "public", "favicon.png"));
  await fs.writeFile(
    path.join(process.cwd(), "public", "media", "derived", ".gitkeep"),
    "",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  processImages()
    .then(() => console.log("Processed gallery originals and web derivatives."))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
