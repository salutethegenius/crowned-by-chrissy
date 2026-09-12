import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import sharp from "sharp";

const PRIVATE_DIR = path.join(process.cwd(), "storage", "private");
const PUBLIC_DERIVED = path.join(process.cwd(), "public", "media", "derived");
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 80 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

function sniff(buf: Buffer) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "image/png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return "image/webp";
  if (buf.length >= 8 && buf.toString("ascii", 4, 8) === "ftyp") return "video/mp4";
  if (buf.length >= 4 && buf.toString("ascii", 0, 4) === "\x1aE\xdf\xa3") return "video/webm";
  return null;
}

export async function savePrivateUpload(file: File, kind: "image" | "video" = "image") {
  const buf = Buffer.from(await file.arrayBuffer());
  const max = kind === "video" ? MAX_VIDEO : MAX_IMAGE;
  if (buf.length > max) {
    throw new Error(kind === "video" ? "Video is too large (80 MB max)." : "Photo is too large (8 MB max).");
  }
  const detected = sniff(buf);
  if (!detected) throw new Error("That file type is not allowed.");
  if (kind === "image" && !IMAGE_TYPES.includes(detected)) throw new Error("Please upload a JPEG, PNG, or WebP photo.");
  if (kind === "video" && !VIDEO_TYPES.includes(detected)) throw new Error("Please upload an MP4 or WebM video.");
  await fs.mkdir(PRIVATE_DIR, { recursive: true });
  const ext = detected === "image/png" ? "png" : detected === "image/webp" ? "webp" : detected === "video/webm" ? "webm" : detected === "video/mp4" ? "mp4" : "jpg";
  const name = `${nanoid(16)}.${ext}`;
  const rel = path.join("inspiration", name);
  const dest = path.join(PRIVATE_DIR, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
  return { relativePath: rel, mime: detected, size: buf.length };
}

export async function savePublicMedia(file: File, slug: string, kind: "image" | "video") {
  const buf = Buffer.from(await file.arrayBuffer());
  const max = kind === "video" ? MAX_VIDEO : MAX_IMAGE;
  if (buf.length > max) throw new Error("File is too large.");
  const detected = sniff(buf);
  if (!detected) throw new Error("That file type is not allowed.");
  const dir = path.join(PUBLIC_DERIVED, slug);
  await fs.mkdir(dir, { recursive: true });
  if (kind === "image") {
    const original = path.join(dir, "original.jpg");
    await sharp(buf).jpeg({ quality: 92 }).toFile(original);
    await writeDerivatives(buf, dir);
    const meta = await sharp(buf).metadata();
    return {
      originalPath: `/media/derived/${slug}/original.jpg`,
      derivedBase: `/media/derived/${slug}`,
      width: meta.width,
      height: meta.height,
    };
  }
  const ext = detected === "video/webm" ? "webm" : "mp4";
  const dest = path.join(dir, `video.${ext}`);
  await fs.writeFile(dest, buf);
  return {
    originalPath: `/media/derived/${slug}/video.${ext}`,
    derivedBase: `/media/derived/${slug}`,
    width: null as number | null,
    height: null as number | null,
  };
}

export async function writeDerivatives(buf: Buffer, dir: string) {
  await fs.mkdir(dir, { recursive: true });
  for (const width of [400, 800, 1200]) {
    await sharp(buf)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(dir, `${width}.webp`));
  }
}

export function publicSrc(derivedBase: string | null | undefined, width: 400 | 800 | 1200 = 800) {
  if (!derivedBase) return "/media/derived/placeholder.jpg";
  return `${derivedBase}/${width}.webp`;
}

export async function readPrivateFile(relativePath: string) {
  const dest = path.join(PRIVATE_DIR, relativePath);
  const resolved = path.resolve(dest);
  if (!resolved.startsWith(path.resolve(PRIVATE_DIR))) {
    throw new Error("Invalid path");
  }
  return fs.readFile(resolved);
}
