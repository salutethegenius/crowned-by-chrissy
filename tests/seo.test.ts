import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { DEVELOPER, PUBLIC_ROUTES, publicSiteUrl } from "@/lib/site";
import { renderEmailHtml } from "@/lib/email";
import { renderTemplate } from "@/lib/notifications";

describe("public SEO routes", () => {
  it("builds a sitemap of public pages from APP_URL", () => {
    process.env.APP_URL = "https://crowned.example";
    const entries = sitemap();
    expect(entries.map((entry) => entry.url)).toEqual(
      PUBLIC_ROUTES.map((route) => `https://crowned.example${route.path === "/" ? "" : route.path}`),
    );
    expect(entries[0]?.images?.[0]).toBe("https://crowned.example/opengraph-image");
  });

  it("advertises the sitemap and hides private paths", () => {
    process.env.APP_URL = "https://crowned.example";
    const doc = robots();
    expect(doc.sitemap).toBe("https://crowned.example/sitemap.xml");
    expect(doc.host).toBe("https://crowned.example");
    const disallowed = Array.isArray(doc.rules) ? doc.rules[0]?.disallow : undefined;
    expect(disallowed).toEqual(expect.arrayContaining(["/owner", "/appointments/", "/api/", "/pay/", "/demo/"]));
  });

  it("resolves Vercel production URL when APP_URL is missing", () => {
    const previousApp = process.env.APP_URL;
    const previousVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "crowned.example";
    expect(publicSiteUrl()).toBe("https://crowned.example");
    if (previousApp == null) delete process.env.APP_URL;
    else process.env.APP_URL = previousApp;
    if (previousVercel == null) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    else process.env.VERCEL_PROJECT_PRODUCTION_URL = previousVercel;
  });
});

describe("transactional email", () => {
  it("renders branded HTML with a details button", () => {
    const html = renderEmailHtml({
      subject: "Chrissy approved your appointment",
      body: "Hi Alex, pay your deposit.\n\nPay / view details: https://crowned.example/appointments/abc",
    });
    expect(html).toContain("Crowned by Chrissy");
    expect(html).toContain("Chrissy approved your appointment");
    expect(html).toContain("https://crowned.example/appointments/abc");
    expect(html).toContain("View details");
    expect(html).not.toContain("<script");
  });

  it("escapes client-supplied names in HTML", () => {
    const html = renderEmailHtml({
      subject: `Hi <img src=x>`,
      body: `Hello <b>there</b>`,
    });
    expect(html).toContain("&lt;img src=x&gt;");
    expect(html).toContain("&lt;b&gt;there&lt;/b&gt;");
  });

  it("keeps appointment copy in the text templates", () => {
    const rendered = renderTemplate("request_received_client", {
      clientName: "Alex",
      serviceName: "Knotless Braids",
      bookingUrl: "https://crowned.example/appointments/abc",
    });
    expect(rendered.subject).toMatch(/request is with Chrissy/i);
    expect(rendered.body).toContain("https://crowned.example/appointments/abc");
  });
});

describe("developer credit", () => {
  it("uses the KemisDigital tag", () => {
    expect(DEVELOPER.label).toBe("Developed by KemisDigital.com");
    expect(DEVELOPER.url).toBe("https://kemisdigital.com");
  });
});
