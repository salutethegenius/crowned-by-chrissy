import { prisma } from "@/lib/db";
import { Photo } from "@/components/Photo";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { savePublicMedia } from "@/lib/storage";
import { nanoid } from "nanoid";

export default async function GalleryAdmin() {
  const media = await prisma.media.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { displayOrder: "asc" },
  });
  const services = await prisma.service.findMany({ orderBy: { name: "asc" } });
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">Gallery</h1>
      <form action={uploadGallery} className="mt-4 space-y-2 rounded-2xl bg-white p-4">
        <input name="file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" required />
        <input name="caption" placeholder="Caption" className="w-full rounded-xl border px-3 py-2" />
        <input name="alt" placeholder="Accessible description" required className="w-full rounded-xl border px-3 py-2" />
        <select name="category" className="w-full rounded-xl border px-3 py-2">
          <option value="">Uncategorised / salon</option>
          <option value="LOCS">Locs</option>
          <option value="BRAIDS">Braids</option>
          <option value="SEW_INS">Sew-ins</option>
          <option value="PONYTAILS">Ponytails</option>
        </select>
        <select name="serviceId" className="w-full rounded-xl border px-3 py-2">
          <option value="">No linked service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button className="min-h-11 w-full rounded-full bg-plum text-cream">Upload</button>
      </form>
      <ul className="mt-6 space-y-4">
        {media.map((item) => (
          <li key={item.id} className="rounded-2xl bg-white p-3">
            {item.kind === "IMAGE" ? (
              <div className="aspect-[4/5] overflow-hidden rounded-xl">
                <Photo base={item.derivedBase} alt={item.alt} focalX={item.focalX} focalY={item.focalY} />
              </div>
            ) : (
              <video
                controls
                playsInline
                preload="metadata"
                poster={item.posterPath || undefined}
                className="w-full rounded-xl"
                aria-label={item.alt}
              >
                <source src={item.originalPath} />
                {item.captionsVtt ? <track kind="captions" src={item.captionsVtt} srcLang="en" label="English" /> : null}
              </video>
            )}
            <form action={updateMedia} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={item.id} />
              <input name="caption" defaultValue={item.caption ?? ""} className="w-full rounded-xl border px-3 py-2" />
              <input name="focalX" type="number" step="0.05" min="0" max="1" defaultValue={item.focalX} className="w-full rounded-xl border px-3 py-2" aria-label="Focal X" />
              <input name="focalY" type="number" step="0.05" min="0" max="1" defaultValue={item.focalY} className="w-full rounded-xl border px-3 py-2" aria-label="Focal Y" />
              <label className="flex gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={item.featured} /> Featured</label>
              <label className="flex gap-2 text-sm"><input type="checkbox" name="archived" defaultChecked={item.archived} /> Archived</label>
              <input name="displayOrder" type="number" defaultValue={item.displayOrder} className="w-full rounded-xl border px-3 py-2" />
              <button className="min-h-11 w-full rounded-full border">Save</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}

async function uploadGallery(formData: FormData) {
  "use server";
  await requireOwner();
  const file = formData.get("file") as File;
  const isVideo = file.type.startsWith("video/");
  const slug = `${isVideo ? "video" : "look"}-${nanoid(8)}`;
  const saved = await savePublicMedia(file, slug, isVideo ? "video" : "image");
  await prisma.media.create({
    data: {
      slug,
      kind: isVideo ? "VIDEO" : "IMAGE",
      alt: String(formData.get("alt")),
      caption: String(formData.get("caption") || ""),
      category: (formData.get("category") || null) as never,
      serviceId: String(formData.get("serviceId") || "") || null,
      originalPath: saved.originalPath,
      derivedBase: saved.derivedBase,
      width: saved.width,
      height: saved.height,
    },
  });
  revalidatePath("/owner/gallery");
  revalidatePath("/styles");
}

async function updateMedia(formData: FormData) {
  "use server";
  await requireOwner();
  await prisma.media.update({
    where: { id: String(formData.get("id")) },
    data: {
      caption: String(formData.get("caption") || ""),
      focalX: Number(formData.get("focalX") || 0.5),
      focalY: Number(formData.get("focalY") || 0.5),
      featured: formData.get("featured") === "on",
      archived: formData.get("archived") === "on",
      displayOrder: Number(formData.get("displayOrder") || 0),
    },
  });
  revalidatePath("/owner/gallery");
  revalidatePath("/");
}
