import { prisma } from "./db";
import { getSettings, bookingConfigured } from "./settings";

export async function publicServices() {
  return prisma.service.findMany({
    where: { active: true },
    include: {
      optionGroups: {
        orderBy: { displayOrder: "asc" },
        include: { options: { orderBy: { displayOrder: "asc" } } },
      },
    },
    orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
  });
}

export async function publicGallery(category?: "LOCS" | "BRAIDS" | "SEW_INS" | "PONYTAILS") {
  return prisma.media.findMany({
    where: {
      visibility: "PUBLIC",
      archived: false,
      kind: "IMAGE",
      ...(category ? { category } : { category: { not: null } }),
    },
    include: { service: true },
    orderBy: [{ featured: "desc" }, { displayOrder: "asc" }],
  });
}

export async function publicVideos() {
  return prisma.media.findMany({
    where: { visibility: "PUBLIC", archived: false, kind: "VIDEO" },
    include: { service: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function salonPhotos() {
  return prisma.media.findMany({
    where: {
      visibility: "PUBLIC",
      archived: false,
      kind: "IMAGE",
      category: null,
      slug: { startsWith: "salon-" },
    },
    orderBy: { displayOrder: "asc" },
  });
}

export async function featuredLooks() {
  return prisma.media.findMany({
    where: { visibility: "PUBLIC", archived: false, featured: true, kind: "IMAGE" },
    include: { service: true },
    orderBy: { displayOrder: "asc" },
    take: 8,
  });
}

export { getSettings, bookingConfigured };
