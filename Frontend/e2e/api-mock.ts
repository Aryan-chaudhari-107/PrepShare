import type { Page } from "@playwright/test";

/* Shared hermetic API mock — every call to the backend (port 8000) is
   intercepted and answered with a fixture, so the e2e suites need no
   backend and behave identically locally and in CI. */

const ANON_SUMMARY = {
  signed_in: false,
  generated_at: "2026-09-25T00:00:00.000Z",
  platform: { total_posts: 33, total_contributors: 15, total_users: 19 },
  offer_signal: { offers: 22, without_offer: 11, total: 33 },
  categories: [
    { category: "campus_placement", count: 15 },
    { category: "off_campus_placement", count: 10 },
    { category: "campus_hackathon", count: 5 },
    { category: "off_campus_hackathon", count: 3 },
  ],
  active_discussions: [
    {
      id: "4b45c754-7f2c-4d58-8a93-1588945acb09",
      title: "Northstar Manufacturing loop",
      post_category: "off_campus_placement",
      comment_count: 2,
      last_activity_at: "2026-09-20T07:20:25.827Z",
    },
  ],
  counts: null,
  streak: null,
  activity: [],
  trend: null,
  weekly: null,
  recent_draft: null,
};

const POST_LIST = {
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_previous: false,
};

const FILTERS = {
  categories: [
    { value: "campus_placement", label: "Campus Placement" },
    { value: "off_campus_placement", label: "Off-Campus Placement" },
  ],
  colleges: [],
  courses: [],
  companies: [],
  locations: [],
  industries: [],
  roles: [],
  round_tags: [],
};

const ROUTES: Record<string, unknown> = {
  "/dashboard/summary": ANON_SUMMARY,
  "/posts/": POST_LIST,
  "/posts/filters-metadata": FILTERS,
};

/** Intercept all API traffic; returns a collector of uncaught page errors. */
export async function mockApi(page: Page): Promise<string[]> {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  await page.route(
    (url) => url.hostname === "127.0.0.1" && url.port === "8000",
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        // Cross-origin XHR still needs CORS on the synthetic response.
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(ROUTES[path] ?? {}),
      });
    },
  );
  return pageErrors;
}
