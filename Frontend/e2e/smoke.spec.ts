import { expect, test } from "@playwright/test";
import { mockApi } from "./api-mock";

/* ──────────────────────────────────────────────────────────────────────────
   Playwright smoke pass — hermetic: every API call is intercepted
   (e2e/api-mock.ts), so the suite needs no backend and behaves
   identically locally and in CI.
   ────────────────────────────────────────────────────────────────────────── */

test("dashboard renders for an anonymous visitor", async ({ page }) => {
  const errors = await mockApi(page);

  await page.goto("/");
  const hero = page.getByRole("heading", { level: 1, name: /Real interview intelligence/ });
  await expect(hero).toBeVisible();
  // Platform stat from the fixture reaches the DOM.
  await expect(page.getByText("published on PrepShare")).toBeVisible();

  expect(errors).toEqual([]);
});

test("navigates from dashboard to the feed", async ({ page }) => {
  const errors = await mockApi(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Explore Feed" })
    .click();

  await expect(page).toHaveURL(/\/feed$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Experience feed");

  expect(errors).toEqual([]);
});

test("theme toggle flips to light and survives a reload", async ({ page }) => {
  const errors = await mockApi(page);

  await page.goto("/");
  // Dark-first default for fresh visitors.
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();

  expect(errors).toEqual([]);
});

test("unknown routes land on the 404 page", async ({ page }) => {
  const errors = await mockApi(page);

  await page.goto("/definitely-not-a-page");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  expect(errors).toEqual([]);
});
