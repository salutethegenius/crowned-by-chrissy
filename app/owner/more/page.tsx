import Link from "next/link";
import { logoutAction } from "../login/actions";

export default function MorePage() {
  const links = [
    ["/owner/services", "Services & prices"],
    ["/owner/gallery", "Gallery"],
    ["/owner/clients", "Clients"],
    ["/owner/payments", "Payments"],
    ["/owner/notifications", "Notifications"],
    ["/owner/settings", "Settings"],
  ];
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-serif text-3xl">More</h1>
      <ul className="mt-6 divide-y divide-ink/10 rounded-2xl bg-white">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="block min-h-14 px-4 py-4">
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <form action={logoutAction} className="mt-8">
        <button className="min-h-12 w-full rounded-full border">Sign out</button>
      </form>
      <InstallHint />
    </main>
  );
}

function InstallHint() {
  return (
    <p className="mt-8 text-sm text-muted">
      On a supported phone, use your browser’s “Add to Home Screen” to install the owner dashboard. Push alerts are optional and only requested when you tap enable.
    </p>
  );
}
