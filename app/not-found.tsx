import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-4xl">That page isn’t here</h1>
        <p className="mt-3 text-muted">Try the gallery or send Chrissy a request.</p>
        <Button href="/" variant="lilac" className="mt-6">
          Home
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
