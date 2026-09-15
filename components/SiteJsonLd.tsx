import { DEVELOPER, SITE_DESCRIPTION, SITE_LOCATION, SITE_NAME, SITE_TAGLINE, publicSiteUrl } from "@/lib/site";

export function SiteJsonLd() {
  const url = publicSiteUrl();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HairSalon",
        "@id": `${url}/#salon`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url,
        image: `${url}/opengraph-image`,
        telephone: SITE_LOCATION.phone,
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE_LOCATION.city,
          addressRegion: SITE_LOCATION.region,
          addressCountry: SITE_LOCATION.countryCode,
        },
        areaServed: {
          "@type": "City",
          name: `${SITE_LOCATION.city}, ${SITE_LOCATION.region}`,
        },
        founder: { "@type": "Person", name: "Chrissy" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Hair services",
          itemListElement: ["Locs", "Braids", "Sew-ins", "Ponytails"].map((name) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${url}/#salon` },
        creator: {
          "@type": "Organization",
          name: DEVELOPER.name,
          url: DEVELOPER.url,
        },
        potentialAction: {
          "@type": "ReserveAction",
          target: `${url}/book`,
          name: SITE_TAGLINE,
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
