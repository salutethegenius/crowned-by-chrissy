import { test, expect } from "@playwright/test";

test("homepage and gallery", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /your next crown starts here/i })).toBeVisible();
  await expect(page.getByTestId("hero-brand")).toBeVisible();
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
