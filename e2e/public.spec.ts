import { test, expect } from "@playwright/test";

test("homepage and gallery", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /your next crown starts here/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Find My Look" })).toBeVisible();
  await expect(page.getByRole("link", { name: "I Know What I Want" })).toBeVisible();
  await expect(page.getByRole("img", { name: /chrissy, owner of crowned by chrissy/i })).toBeVisible();
  await page.goto("/styles");
  await expect(page.getByRole("heading", { name: /style gallery/i })).toBeVisible();
  await page.goto("/meet");
  await expect(page.getByRole("heading", { name: /meet chrissy/i })).toBeVisible();
  await expect(page.getByRole("img", { name: /chrissy, owner of crowned by chrissy/i })).toBeVisible();
});

test("discovery booking path preserves back navigation", async ({ page }) => {
  await page.goto("/book?path=discovery");
  await expect(page.getByRole("heading", { name: /what are we doing today/i })).toBeVisible();
  await page.getByTestId("category-BRAIDS").click();
  await expect(page.getByRole("heading", { name: /find a look you love/i })).toBeVisible();
  await page.getByRole("button", { name: "Request This Look" }).first().click();
  await expect(page.getByRole("heading", { name: /make it yours/i })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { name: /find a look you love/i })).toBeVisible();
});

test("direct service booking", async ({ page }) => {
  await page.goto("/book?path=direct");
  await expect(page.getByRole("heading", { name: /choose your service/i })).toBeVisible();
  await page.getByTestId("service-knotless-braids").click();
  await expect(page.getByRole("heading", { name: /make it yours/i })).toBeVisible();
});

test("seo discovery files and developer credit", async ({ page, request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  const robotsBody = await robots.text();
  expect(robotsBody).toMatch(/Allow:\s*\//);
  expect(robotsBody).toMatch(/Disallow:\s*\/owner/);
  expect(robotsBody).toMatch(/Sitemap:/);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain("/styles");
  expect(sitemapBody).toContain("/book");
  expect(sitemapBody).not.toContain("/owner");

  const og = await request.get("/opengraph-image");
  expect(og.ok()).toBeTruthy();
  expect(og.headers()["content-type"]).toMatch(/image\/png/);

  const icon = await request.get("/icon.svg");
  expect(icon.ok()).toBeTruthy();
  expect(await icon.text()).toContain("Crowned by Chrissy");

  await page.goto("/");
  await expect(page.getByRole("link", { name: /developed by kemisdigital\.com/i })).toBeVisible();
  const jsonLd = page.locator('script[type="application/ld+json"]');
  await expect(jsonLd).toHaveCount(1);
  const data = JSON.parse((await jsonLd.textContent()) || "{}") as { "@graph"?: Array<{ "@type"?: string }> };
  expect(data["@graph"]?.some((node) => node["@type"] === "HairSalon")).toBe(true);
});

test("owner login and calendar", async ({ page }) => {
  await page.goto("/owner/login");
  await page.getByLabel("Email").fill("chrissy@demo.crownedbychrissy.local");
  await page.getByLabel("Password").fill("demo-owner-pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/owner", { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await page.goto("/owner/requests");
  await expect(page.getByRole("heading", { name: "Requests" })).toBeVisible();
  await page.goto("/owner/calendar");
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  await page.goto("/owner/services");
  await expect(page.getByRole("heading", { name: "Services" })).toBeVisible();
});
