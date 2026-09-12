"use client";

import { useRef, useState } from "react";

type Props = {
  src: string;
  poster?: string | null;
  alt: string;
  caption?: string | null;
  captionsVtt?: string | null;
};

export function VideoPlayer({ src, poster, alt, caption, captionsVtt }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <figure>
      <div className="relative overflow-hidden rounded-3xl bg-ink">
        <video
          ref={videoRef}
          controls={playing}
          playsInline
          preload="metadata"
          poster={poster || undefined}
          className="aspect-[4/5] w-full object-cover"
          aria-label={alt}
          onPlay={() => setPlaying(true)}
        >
          <source src={src} />
          {captionsVtt ? <track kind="captions" src={captionsVtt} srcLang="en" label="English" default /> : null}
        </video>
        {!playing ? (
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center bg-ink/25 text-cream"
            onClick={() => {
              setPlaying(true);
              void videoRef.current?.play();
            }}
          >
            <span className="sr-only">Play video{caption ? `: ${caption}` : ""}</span>
            <span aria-hidden className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold text-ink">
              ▶
            </span>
          </button>
        ) : null}
      </div>
      {caption ? <figcaption className="mt-3 text-muted">{caption}</figcaption> : null}
    </figure>
  );
}
