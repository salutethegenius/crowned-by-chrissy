import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Photo } from "@/components/Photo";
import { FavouriteButton } from "@/components/FavouriteButton";
import { Button } from "@/components/Button";
import { publicGallery, publicVideos } from "@/lib/queries";
import { priceLabel } from "@/lib/pricing";
import { GalleryFilters } from "@/components/GalleryFilters";

export const metadata = { title: "Styles" };

export default async function StylesPage() {
  const [gallery, videos] = await Promise.all([publicGallery(), publicVideos()]);
  return (
    <div className="flex min-h-full flex-col bg-cream">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-16">
        <h1 className="font-serif text-5xl text-ink">Style gallery</h1>
        <p className="mt-4 max-w-2xl text-muted">Real work from Chrissy’s chair. Save looks you love, then request one.</p>
        <GalleryFilters />
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {gallery.map((look) => (
            <article key={look.id} className="mb-4 break-inside-avoid overflow-hidden rounded-3xl bg-white" data-category={look.category || ""}>
              <div className="relative">
                <Photo base={look.derivedBase} alt={look.alt} focalX={look.focalX} focalY={look.focalY} />
                <FavouriteButton id={look.id} />
              </div>
              <div className="p-4">
                <p className="font-serif text-xl text-ink">{look.caption}</p>
                <p className="text-sm text-muted">
                  {look.category} · {look.service ? priceLabel(look.service) : "Ask Chrissy"}
                </p>
                <Button href={`/book?path=discovery&look=${look.slug}`} variant="lilac" className="mt-3 w-full">
                  Request This Look
                </Button>
              </div>
            </article>
          ))}
        </div>
        {videos.length ? (
          <section className="mt-16">
            <h2 className="font-serif text-3xl">Videos</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {videos.map((video) => (
                <figure key={video.id}>
                  <video
                    controls
                    playsInline
                    preload="none"
                    poster={video.posterPath || undefined}
                    className="w-full rounded-3xl"
                    aria-label={video.alt}
                  >
                    <source src={video.originalPath} />
                    {video.captionsVtt ? <track kind="captions" src={video.captionsVtt} srcLang="en" label="English" /> : null}
                  </video>
                  <figcaption className="mt-2 text-muted">{video.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
