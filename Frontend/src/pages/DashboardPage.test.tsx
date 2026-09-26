import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { dashboardApi, postsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import type { DashboardSummary } from "../types";

vi.mock("../api", () => ({
  dashboardApi: { getSummary: vi.fn() },
  postsApi: { getFeed: vi.fn() },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

/* ── fixtures ───────────────────────────────────────────────────────────── */

const baseSummary: DashboardSummary = {
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

const activity = Array.from({ length: 14 }, (_, index) => {
  const posts = index % 3;
  const comments = index % 2;
  const bookmarks = index % 4 === 0 ? 1 : 0;
  const completions = 0;
  return {
    date: `2026-09-${String(index + 1).padStart(2, "0")}`,
    posts,
    comments,
    bookmarks,
    completions,
    total: posts + comments + bookmarks + completions,
  };
});

const signedSummary: DashboardSummary = {
  ...baseSummary,
  signed_in: true,
  counts: {
    posts: 8,
    drafts: 0,
    replies_given: 1,
    comments_received: 12,
    bookmarks: 4,
    completed_questions: 6,
    followers: 2,
    following: 3,
    views: 120,
    shares: 5,
  },
  streak: { current: 3, best: 5 },
  activity,
  trend: {
    posts_this_week: 2,
    posts_last_week: 1,
    comments_this_week: 3,
    comments_last_week: 4,
  },
  weekly: { completed: 5, goal: 8 },
  recent_draft: {
    id: "e0f58a58-7ff6-4a3e-b5fd-5f74e1de9a63",
    title: "Google SDE Interview",
    updated_at: "2026-09-24T10:00:00.000Z",
  },
};

/* The approved bento, in DOM order:
   r1-r2  hero(7x2) + shared(2) + views(3) | replies(3) + streak(2)
   r3-r4  chart(5x2) + gauge(3x2) + feed(4x2)
   r5     discussions(6) + weekly goal(3) + next up(3)          — total 12/row */
const EXPECTED_SPANS = ["7x2", "2", "3", "3", "2", "5x2", "3x2", "4x2", "6", "3", "3"];

/* ── helpers ────────────────────────────────────────────────────────────── */

const gridSpans = (container: HTMLElement): string[] => {
  const grid = container.querySelector('[class*="xl:grid-cols-12"]');
  expect(grid).not.toBeNull();
  return Array.from(grid!.children).map((child) => {
    const cls = String((child as HTMLElement).className ?? "");
    const col = /xl:col-span-(\d+)/.exec(cls)?.[1] ?? "0";
    const row = /xl:row-span-(\d+)/.exec(cls)?.[1] ?? "1";
    return row === "1" ? col : `${col}x${row}`;
  });
};

/** Sparse auto-placement over 12 columns — every cell must end up filled. */
const hasNoGridHoles = (spans: string[]): boolean => {
  const cells: boolean[][] = [];
  const ensure = (row: number) => {
    while (cells.length <= row) cells.push(new Array(12).fill(false));
  };
  let cursorRow = 0;
  let cursorCol = 0;

  for (const span of spans) {
    const [colsRaw, rowsRaw] = span.split("x");
    const cols = Number(colsRaw);
    const rows = Number(rowsRaw ?? 1);
    let placed = false;
    for (let row = cursorRow; row < cursorRow + 6 && !placed; row++) {
      const startCol = row === cursorRow ? cursorCol : 0;
      for (let col = startCol; col + cols <= 12; col++) {
        let fits = true;
        for (let dr = 0; dr < rows && fits; dr++) {
          ensure(row + dr);
          for (let dc = 0; dc < cols; dc++) {
            if (cells[row + dr][col + dc]) {
              fits = false;
              break;
            }
          }
        }
        if (fits) {
          for (let dr = 0; dr < rows; dr++) {
            ensure(row + dr);
            for (let dc = 0; dc < cols; dc++) cells[row + dr][col + dc] = true;
          }
          if (col + cols >= 12) {
            cursorRow = row + 1;
            cursorCol = 0;
          } else {
            cursorRow = row;
            cursorCol = col + cols;
          }
          placed = true;
          break;
        }
      }
    }
    if (!placed) return false;
  }
  return cells.every((row) => row.every(Boolean));
};

const mockAuth = (isAuthenticated: boolean) => {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated,
    user: isAuthenticated
      ? { full_name: "Rohit Verma", username: "rohit_mech", contribution_score: 42 }
      : null,
    openAuthModal: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>);
};

const mockSummary = (summary: DashboardSummary) => {
  vi.mocked(dashboardApi.getSummary).mockResolvedValue({
    data: summary,
  } as Awaited<ReturnType<typeof dashboardApi.getSummary>>);
};

/* ── tests ──────────────────────────────────────────────────────────────── */

describe("DashboardPage bento layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(postsApi.getFeed).mockResolvedValue({
      data: { items: [] },
    } as unknown as Awaited<ReturnType<typeof postsApi.getFeed>>);
  });

  it("lays out the full 12-column bento for anonymous visitors", async () => {
    mockSummary(baseSummary);
    mockAuth(false);
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { level: 1 });

    const spans = gridSpans(container);
    expect(spans).toEqual(EXPECTED_SPANS);
    expect(spans).toHaveLength(11);
    expect(hasNoGridHoles(spans)).toBe(true);

    // Anonymous hero copy, and none of the personal blocks.
    expect(container.textContent).toContain("Real interview intelligence");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("keeps the same bento and adds personal blocks when signed in", async () => {
    mockSummary(signedSummary);
    mockAuth(true);
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Welcome back");

    const spans = gridSpans(container);
    expect(spans).toEqual(EXPECTED_SPANS);
    expect(hasNoGridHoles(spans)).toBe(true);

    // Weekly goal progress (signed-in only) renders with real values.
    const progress = screen.getByRole("progressbar", {
      name: "Weekly contribution goal",
    });
    expect(progress.getAttribute("aria-valuenow")).toBe("5");
    expect(progress.getAttribute("aria-valuemax")).toBe("8");
  });

  it("renders the loading skeleton with identical spans (no layout shift)", () => {
    vi.mocked(dashboardApi.getSummary).mockReturnValue(
      new Promise<never>(() => {})
    );
    mockAuth(false);
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(container.querySelector('[role="status"]')).not.toBeNull();
    const spans = gridSpans(container);
    expect(spans).toEqual(EXPECTED_SPANS);
    expect(hasNoGridHoles(spans)).toBe(true);
  });
});

/* ── behaviour: failure handling, retry, auth flip ──────────────────────── */

describe("DashboardPage behaviour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(postsApi.getFeed).mockResolvedValue({
      data: { items: [] },
    } as unknown as Awaited<ReturnType<typeof postsApi.getFeed>>);
  });

  it("shows an error state on failure and recovers when the user retries", async () => {
    vi.mocked(dashboardApi.getSummary)
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce({
        data: baseSummary,
      } as Awaited<ReturnType<typeof dashboardApi.getSummary>>);
    mockAuth(false);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Failure lands on the error card, not a blank page.
    const errorHeading = await screen.findByRole("heading", {
      level: 1,
      name: "Couldn't load your dashboard",
    });
    expect(errorHeading).not.toBeNull();
    expect(dashboardApi.getSummary).toHaveBeenCalledTimes(1);

    // "Try again" refetches and renders the real dashboard.
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await screen.findByText("Real interview intelligence", { exact: false });
    expect(dashboardApi.getSummary).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("heading", { name: "Couldn't load your dashboard" })).toBeNull();
  });

  it("refetches and swaps to personal content when auth flips", async () => {
    vi.mocked(dashboardApi.getSummary).mockResolvedValue({
      data: baseSummary,
    } as Awaited<ReturnType<typeof dashboardApi.getSummary>>);
    mockAuth(false);

    const { rerender } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Anonymous: platform numbers, no personal blocks.
    await screen.findByText("Real interview intelligence", { exact: false });
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(dashboardApi.getSummary).toHaveBeenCalledTimes(1);

    // Flip to signed-in — same hook re-render, new auth value.
    vi.mocked(dashboardApi.getSummary).mockResolvedValue({
      data: signedSummary,
    } as Awaited<ReturnType<typeof dashboardApi.getSummary>>);
    mockAuth(true);
    rerender(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await screen.findByText(/Welcome back/);
    await waitFor(() =>
      expect(dashboardApi.getSummary).toHaveBeenCalledTimes(2)
    );

    // Personal ledger is on screen; the platform hero is gone.
    expect(
      screen.getByRole("progressbar", { name: "Weekly contribution goal" })
    ).not.toBeNull();
    expect(screen.queryByText("Real interview intelligence", { exact: false })).toBeNull();
  });

  it("still renders the dashboard when only the feed request fails", async () => {
    vi.mocked(dashboardApi.getSummary).mockResolvedValue({
      data: baseSummary,
    } as Awaited<ReturnType<typeof dashboardApi.getSummary>>);
    vi.mocked(postsApi.getFeed).mockRejectedValue(new Error("feed down"));
    mockAuth(false);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // The summary drives the page — a dead feed must not blank it.
    await screen.findByText("Real interview intelligence", { exact: false });
    expect(screen.getByRole("heading", { level: 1 })).not.toBeNull();
    expect(screen.queryByRole("heading", { name: "Couldn't load your dashboard" })).toBeNull();
  });
});
