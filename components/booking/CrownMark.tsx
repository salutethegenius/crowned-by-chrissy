export function CrownMark() {
  return (
    <p className="flex items-center justify-center gap-2 pt-4 text-sm text-gold motion-safe:animate-pulse">
      <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden className="fill-gold">
        <path d="M1 13 4 4l4 5 3-7 3 7 4-5 3 9H1Zm0 3h20v2H1z" />
      </svg>
      Request received with care
    </p>
  );
}
