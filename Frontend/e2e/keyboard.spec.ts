import { expect, test } from "@playwright/test";
import { mockApi } from "./api-mock";

/* ──────────────────────────────────────────────────────────────────────────
   Keyboard / focus audit — the automated stand-in for a manual screen-reader
   pass: real trusted Tab/Enter/Escape input via CDP, asserting focus order,
   visible focus indicators, dialog focus trapping and focus restoration.
   ────────────────────────────────────────────────────────────────────────── */

const activeElementInfo = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { body: true };
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return {
    body: false,
    tag: el.tagName,
    name: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim().slice(0, 40),
    visible: rect.width > 0 && rect.height > 0,
    focusRing:
      (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
      cs.boxShadow !== "none",
    inDialog: !!el.closest('[role="dialog"]'),
  };
})()`;

test("header controls are tab-reachable with visible focus rings", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const stops: Array<{
    tag?: string;
    name?: string;
    body?: boolean;
    visible?: boolean;
    focusRing?: boolean;
  }> = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    stops.push(await page.evaluate(activeElementInfo));
  }
  console.log("tab stops:", JSON.stringify(stops));

  // Focus never lands nowhere, never hides, always paints an indicator.
  for (const [i, stop] of stops.entries()) {
    expect(stop.body, `stop ${i + 1} lost focus (landed on body)`).toBeFalsy();
    expect(stop.visible, `stop ${i + 1} (${stop.name}) not visible`).toBe(true);
    expect(stop.focusRing, `stop ${i + 1} (${stop.name}) has no focus ring`).toBe(true);
  }

  // Logical start (logo) and the primary auth controls are within reach.
  expect(stops[0].name).toContain("PrepShare");
  const names = stops.map((s) => s.name ?? "");
  expect(names.some((n) => /^sign in$/i.test(n))).toBe(true);
  expect(names.some((n) => /switch to .* theme/i.test(n))).toBe(true);
});

test("auth modal traps Tab, Escape closes and restores focus", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Sign In", exact: true });
  await expect(opener).toBeVisible();

  await opener.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  // Focus moved into the dialog on open.
  let info = await page.evaluate(activeElementInfo);
  expect(info.inDialog, "focus did not move into the dialog").toBe(true);

  // Tab never escapes the dialog (trap cycles through its controls).
  const escapees: string[] = [];
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    info = await page.evaluate(activeElementInfo);
    if (!info.inDialog && !info.body) escapees.push(`${info.tag}:${info.name}`);
  }
  expect(escapees, "Tab escaped the dialog").toEqual([]);

  // Escape closes and returns focus to the opener.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  info = await page.evaluate(activeElementInfo);
  expect(info.name, "focus not restored to the opener").toMatch(/^sign in$/i);
});

test("theme toggle activates with Enter", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  // Dark-first default for fresh visitors.
  await expect(page.locator("html")).toHaveClass(/dark/);

  const toggle = page.getByRole("button", { name: "Switch to light theme" });
  await toggle.focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
});
