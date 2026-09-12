import { PrismaClient, Category, PricingType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SERVICES: Array<{
  slug: string;
  name: string;
  category: Category;
  description: string;
  pricingType: PricingType;
  priceMinMinor: number | null;
  priceMaxMinor: number | null;
  priceMaxOpenEnded?: boolean;
  displayNote?: string;
  displayOrder: number;
  options?: Array<{ name: string; required?: boolean; choices: string[] }>;
}> = [
  {
    slug: "starter-locs",
    name: "Starter Locs",
    category: "LOCS",
    description: "Begin your loc journey with a clean, even start.",
    pricingType: "FIXED",
    priceMinMinor: 6500,
    priceMaxMinor: 6500,
    displayOrder: 1,
  },
  {
    slug: "loc-wash-treatment-style",
    name: "Loc Wash, Treatment & Style",
    category: "LOCS",
    description: "A full loc wash, treatment, and finish.",
    pricingType: "FIXED",
    priceMinMinor: 14000,
    priceMaxMinor: 14000,
    displayOrder: 2,
  },
  {
    slug: "loc-retwist",
    name: "Loc Retwist",
    category: "LOCS",
    description: "Neat retwist to keep your locs looking fresh.",
    pricingType: "FIXED",
    priceMinMinor: 4000,
    priceMaxMinor: 4000,
    displayOrder: 3,
  },
  {
    slug: "loc-styling",
    name: "Loc Styling",
    category: "LOCS",
    description: "Style your existing locs for everyday or a special occasion.",
    pricingType: "FIXED",
    priceMinMinor: 3000,
    priceMaxMinor: 3000,
    displayOrder: 4,
  },
  {
    slug: "knotless-braids",
    name: "Knotless Braids",
    category: "BRAIDS",
    description: "Soft knotless braids. Size and length change the time and finish.",
    pricingType: "RANGE",
    priceMinMinor: 10000,
    priceMaxMinor: 14000,
    priceMaxOpenEnded: true,
    displayNote: "Small, medium, and large options may vary by size and length. Hair is not included.",
    displayOrder: 10,
    options: [
      { name: "Size", required: true, choices: ["Small", "Medium", "Large", "Not sure — ask Chrissy"] },
      { name: "Length", required: true, choices: ["Shoulder", "Mid-back", "Waist", "Extra long", "Not sure — ask Chrissy"] },
    ],
  },
  {
    slug: "box-braids",
    name: "Box Braids",
    category: "BRAIDS",
    description: "Classic box braids. Pricing depends on size and length.",
    pricingType: "QUOTE_REQUIRED",
    priceMinMinor: null,
    priceMaxMinor: null,
    displayNote: "Small, medium, and large options may vary by size and length. Hair is not included.",
    displayOrder: 11,
    options: [
      { name: "Size", required: true, choices: ["Small", "Medium", "Large", "Not sure — ask Chrissy"] },
      { name: "Length", required: true, choices: ["Shoulder", "Mid-back", "Waist", "Extra long", "Not sure — ask Chrissy"] },
    ],
  },
  {
    slug: "miracle-invisible-locs",
    name: "Miracle / Invisible Locs",
    category: "BRAIDS",
    description: "Soft loc-inspired braids. Chrissy will quote after seeing your look and hair.",
    pricingType: "QUOTE_REQUIRED",
    priceMinMinor: null,
    priceMaxMinor: null,
    displayNote: "Hair is not included.",
    displayOrder: 12,
  },
  {
    slug: "traditional-sew-in",
    name: "Traditional Sew-In",
    category: "SEW_INS",
    description: "A traditional sew-in install.",
    pricingType: "FIXED",
    priceMinMinor: 7500,
    priceMaxMinor: 7500,
    displayOrder: 20,
  },
  {
    slug: "quick-weave",
    name: "Quick Weave",
    category: "SEW_INS",
    description: "A quicker weave install.",
    pricingType: "FIXED",
    priceMinMinor: 6000,
    priceMaxMinor: 6000,
    displayOrder: 21,
  },
  {
    slug: "closure-sew-in",
    name: "Closure Sew-In",
    category: "SEW_INS",
    description: "Sew-in with a closure.",
    pricingType: "FIXED",
    priceMinMinor: 8000,
    priceMaxMinor: 8000,
    displayOrder: 22,
  },
  {
    slug: "sleek-ponytail",
    name: "Sleek Ponytail",
    category: "PONYTAILS",
    description: "A polished sleek ponytail.",
    pricingType: "FIXED",
    priceMinMinor: 5000,
    priceMaxMinor: 5000,
    displayOrder: 30,
  },
  {
    slug: "extended-ponytail",
    name: "Extended Ponytail",
    category: "PONYTAILS",
    description: "A longer ponytail finish.",
    pricingType: "FIXED",
    priceMinMinor: 6500,
    priceMaxMinor: 6500,
    displayOrder: 31,
  },
];

const GALLERY: Array<{
  slug: string;
  alt: string;
  caption: string;
  category: Category | null;
  serviceSlug?: string;
  featured?: boolean;
  displayOrder: number;
  archived?: boolean;
}> = [
  { slug: "knotless-braids-long-back", alt: "Long black knotless braids seen from behind", caption: "Long knotless braids", category: "BRAIDS", serviceSlug: "knotless-braids", featured: true, displayOrder: 1 },
  { slug: "locs-high-bun-profile", alt: "Locs gathered into a high bun, profile view", caption: "Locs styled high", category: "LOCS", serviceSlug: "loc-styling", featured: true, displayOrder: 2 },
  { slug: "locs-natural-length", alt: "Natural locs worn down in the salon", caption: "Locs, worn free", category: "LOCS", serviceSlug: "loc-wash-treatment-style", displayOrder: 3 },
  { slug: "starter-locs", alt: "Fresh starter locs with a neat grid", caption: "Starter locs", category: "LOCS", serviceSlug: "starter-locs", featured: true, displayOrder: 4 },
  { slug: "salon-wall-signs", alt: "Purple hexagon wall signs reading Crowned By Chrissy", caption: "The studio wall", category: null, displayOrder: 90 },
  { slug: "locs-updo-pearls", alt: "Locs in an updo with a pearl hair comb", caption: "Locs updo", category: "LOCS", serviceSlug: "loc-styling", featured: true, displayOrder: 5 },
  { slug: "brand-logo", alt: "Crowned by Chrissy logo with crown illustration", caption: "Brand mark", category: null, displayOrder: 100, archived: true },
  { slug: "locs-highlighted-bun", alt: "Highlighted locs in a bun with hanging ends", caption: "Highlighted loc bun", category: "LOCS", serviceSlug: "loc-styling", displayOrder: 6 },
  { slug: "barrel-twists-curly-end", alt: "Two-strand loc pattern with a curly ponytail", caption: "Two-strand with curly ends", category: "LOCS", serviceSlug: "loc-styling", featured: true, displayOrder: 7 },
  { slug: "barrel-twists-diamond", alt: "Diamond two-strand pattern across the head", caption: "Diamond two-strand set", category: "LOCS", serviceSlug: "loc-retwist", featured: true, displayOrder: 8 },
  { slug: "locs-low-ponytail", alt: "Retwisted locs gathered into a low ponytail", caption: "Locs, low ponytail", category: "LOCS", serviceSlug: "loc-styling", displayOrder: 9 },
  { slug: "loc-retwist-front", alt: "Loc retwist photographed from the front hairline", caption: "Loc retwist", category: "LOCS", serviceSlug: "loc-retwist", displayOrder: 10 },
  { slug: "barrel-twists-overhead", alt: "Overhead view of a two-strand loc set", caption: "Two-strand loc set", category: "LOCS", serviceSlug: "loc-retwist", displayOrder: 11 },
  { slug: "two-strand-twists-portrait", alt: "Shoulder-length two-strand twists", caption: "Two-strand twists", category: "BRAIDS", serviceSlug: "box-braids", displayOrder: 12 },
  { slug: "twists-burgundy-ends", alt: "Two-strand twists with burgundy ends", caption: "Twists with colour", category: "LOCS", serviceSlug: "loc-styling", displayOrder: 13 },
  { slug: "feed-in-braids-bun", alt: "Feed-in braids gathered into a bun", caption: "Feed-in braids bun", category: "BRAIDS", serviceSlug: "box-braids", featured: true, displayOrder: 14 },
  { slug: "salon-hexagon-wall", alt: "Crowned, By, and Chrissy hexagon signs above purple flowers", caption: "Crowned By Chrissy", category: null, displayOrder: 91 },
  { slug: "portrait-unconfirmed", alt: "Portrait held until identity is confirmed", caption: "Unpublished portrait", category: null, displayOrder: 200, archived: true },
];

export async function seedCore() {
  const demo = ["1", "true", "yes"].includes((process.env.DEMO_MODE || "").toLowerCase());
  const ownerEmail = demo
    ? process.env.DEMO_OWNER_EMAIL || "chrissy@demo.crownedbychrissy.local"
    : process.env.OWNER_EMAIL;
  const ownerPassword = demo
    ? process.env.DEMO_OWNER_PASSWORD || "demo-owner-pass"
    : process.env.OWNER_PASSWORD;
  if (!ownerEmail || !ownerPassword) {
    throw new Error("OWNER_EMAIL and OWNER_PASSWORD must be set to seed an owner account.");
  }

  await prisma.owner.upsert({
    where: { email: ownerEmail },
    update: { name: process.env.OWNER_NAME || "Chrissy", isDemo: demo },
    create: {
      email: ownerEmail,
      passwordHash: await bcrypt.hash(ownerPassword, 12),
      name: process.env.OWNER_NAME || "Chrissy",
      isDemo: demo,
    },
  });

  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      biography: null,
      portraitMediaId: null,
      workingDays: [],
      requestsOpen: false,
      depositAmountMinor: null,
      publicCopy: {
        heroHeadline: "Your next crown starts here.",
        heroSupport: "Explore Chrissy’s work, find your look, and request your appointment in Freeport.",
        meet:
          "Chrissy styles locs, braids, sew-ins, and ponytails in Freeport, Grand Bahama. Request a time that works for you — she reviews every appointment personally.",
        prep:
          "Please arrive with hair clean and ready unless a wash service is included. Hair is not included for braiding services. Bring inspiration photos if you have them.",
      },
    },
  });

  for (const service of SERVICES) {
    const row = await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name,
        category: service.category,
        description: service.description,
        pricingType: service.pricingType,
        priceMinMinor: service.priceMinMinor,
        priceMaxMinor: service.priceMaxMinor,
        priceMaxOpenEnded: service.priceMaxOpenEnded ?? false,
        displayNote: service.displayNote,
        displayOrder: service.displayOrder,
        preparationInstructions:
          "Please arrive with hair clean and ready unless a wash service is included. Prices may vary depending on length and style.",
      },
      create: {
        slug: service.slug,
        name: service.name,
        category: service.category,
        description: service.description,
        pricingType: service.pricingType,
        priceMinMinor: service.priceMinMinor,
        priceMaxMinor: service.priceMaxMinor,
        priceMaxOpenEnded: service.priceMaxOpenEnded ?? false,
        displayNote: service.displayNote,
        displayOrder: service.displayOrder,
        preparationInstructions:
          "Please arrive with hair clean and ready unless a wash service is included. Prices may vary depending on length and style.",
      },
    });
    if (service.options?.length) {
      await prisma.serviceOption.deleteMany({
        where: { group: { serviceId: row.id } },
      });
      await prisma.serviceOptionGroup.deleteMany({ where: { serviceId: row.id } });
      for (const [gi, group] of service.options.entries()) {
        await prisma.serviceOptionGroup.create({
          data: {
            serviceId: row.id,
            name: group.name,
            required: group.required ?? false,
            displayOrder: gi,
            options: {
              create: group.choices.map((label, oi) => ({ label, displayOrder: oi })),
            },
          },
        });
      }
    }
  }

  const services = await prisma.service.findMany();
  const bySlug = Object.fromEntries(services.map((s) => [s.slug, s]));

  for (const item of GALLERY) {
    await prisma.media.upsert({
      where: { slug: item.slug },
      update: {
        alt: item.alt,
        caption: item.caption,
        category: item.category,
        featured: item.featured ?? false,
        archived: item.archived ?? false,
        displayOrder: item.displayOrder,
        serviceId: item.serviceSlug ? bySlug[item.serviceSlug]?.id : null,
        originalPath: `/media/derived/${item.slug}/original.jpg`,
        derivedBase: `/media/derived/${item.slug}`,
      },
      create: {
        slug: item.slug,
        alt: item.alt,
        caption: item.caption,
        category: item.category,
        featured: item.featured ?? false,
        archived: item.archived ?? false,
        displayOrder: item.displayOrder,
        serviceId: item.serviceSlug ? bySlug[item.serviceSlug]?.id : null,
        originalPath: `/media/derived/${item.slug}/original.jpg`,
        derivedBase: `/media/derived/${item.slug}`,
        kind: "IMAGE",
        visibility: "PUBLIC",
      },
    });
  }

  console.log("Seeded business settings, services, and gallery records.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCore()
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
