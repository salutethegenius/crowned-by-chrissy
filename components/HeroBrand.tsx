export function HeroBrand() {
  return (
    <div className="hero-brand" data-testid="hero-brand" aria-label="Crowned by Chrissy">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/derived/brand-crown/crown.png"
        alt=""
        width={280}
        height={220}
        className="hero-crown"
        decoding="async"
        fetchPriority="high"
      />
      <p className="hero-wordmark font-serif">
        Crowned <span className="italic font-normal">by</span> Chrissy
      </p>
    </div>
  );
}
