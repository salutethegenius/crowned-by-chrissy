import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "lilac" | "ghost";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const styles = {
  primary:
    "bg-ink text-cream hover:bg-plum border border-gold/40",
  secondary:
    "bg-transparent text-cream border border-cream/70 hover:bg-cream/10",
  lilac:
    "bg-lilac text-ink hover:bg-plum hover:text-cream border border-lilac",
  ghost:
    "bg-transparent text-ink border border-ink/15 hover:border-plum hover:text-plum",
};

export function Button({ href, children, variant = "primary", className, type = "button", onClick, disabled }: Props) {
  const cls = cn(
    "inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
    styles[variant],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
