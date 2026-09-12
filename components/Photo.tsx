import { cn } from "@/lib/cn";

type Props = {
  base?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  focalX?: number;
  focalY?: number;
  widthHint?: 400 | 800 | 1200 | 1600;
};

export function Photo({
  base,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority,
  focalX = 0.5,
  focalY = 0.5,
  widthHint = 800,
}: Props) {
  const src = base ? `${base}/${widthHint}.webp` : "";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={
        base
          ? `${base}/400.webp 400w, ${base}/800.webp 800w, ${base}/1200.webp 1200w, ${base}/1600.webp 1600w`
          : undefined
      }
      sizes={sizes}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
