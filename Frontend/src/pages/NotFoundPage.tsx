import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { PageContainer } from "../components/layout/AppShell";
import { Button } from "../components/ui";
import { useStagedLocation } from "../lib/stagedLocation";
import { DURATION, EASE, Focus, SPRING, StateArt } from "../motion";

/**
 * 404 — a mis-filed report.
 *
 * Renders in place, deliberately WITHOUT redirecting: App.tsx maps both `/404`
 * and `*` straight onto this page, so the path the user actually asked for
 * survives in `location.pathname` and can be echoed back. We never issue a
 * second redirect (that would only destroy history again); when there is no
 * requested path to show we fall back to honest generic copy rather than
 * inventing an address we never saw.
 *
 * ART DIRECTION: the requested path is the evidence, so it is filed out of
 * alignment — a tilted label, dashed like something that never got sorted,
 * with the parts we don't hold redacted the same way the product redacts a
 * source. The `stray` illustration (the one card out of line) is its twin, and
 * the case is stamped `Unresolved` on arrival. Everything the user can DO —
 * search, go back, return to the feed — sits straight and untouched.
 */
export const NotFoundPage: React.FC = () => {
  const { pathname } = useStagedLocation();
  const navigate = useNavigate();

  const requestedPath = pathname === "/404" ? null : pathname;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q");
    const trimmed = typeof query === "string" ? query.trim() : "";
    // FeedPage reads the `search` query param, so this lands on real results.
    navigate(trimmed ? `/feed?search=${encodeURIComponent(trimmed)}` : "/feed");
  };

  return (
    <>
      <PageContainer width="prose">
        {/* The one focal entrance on this page: the report settles as a whole. */}
        <Focus className="mt-4 sm:mt-10">
          <article className="relative rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-9">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs uppercase tracking-widest text-faint">
                  <span>Case file 404</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    Filed by
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-14 rounded-[2px] bg-heading/75"
                    />
                    <span className="sr-only">anonymized</span>
                  </span>
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Page not found
                </h1>
              </div>

              {/* The stamp lands after the page has settled — one playful accent. */}
              <motion.span
                initial={{ opacity: 0, scale: 1.5, rotate: -18 }}
                animate={{ opacity: 1, scale: 1, rotate: -7 }}
                transition={SPRING.bouncy}
                className="shrink-0 self-start rounded-md border-2 border-danger/50 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-danger sm:self-auto"
              >
                Unresolved
              </motion.span>
            </div>

            {/* Content left, evidence right on desktop; evidence first on mobile. */}
            <div className="mt-7 flex flex-col-reverse gap-7 sm:flex-row sm:items-start sm:gap-8">
              <div className="min-w-0 flex-1">
                {/* The requested path, filed out of alignment. */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DURATION.slow, ease: EASE.enter, delay: DURATION.base }}
                >
                  <div className="inline-block max-w-full origin-left -rotate-[1.4deg] rounded-lg border border-dashed border-line-strong bg-raised px-3.5 py-2.5 shadow-xs">
                    <span className="block font-mono text-xs uppercase tracking-widest text-faint">
                      Requested path
                    </span>
                    {requestedPath ? (
                      <code className="mt-1 block break-all font-mono text-sm text-heading">
                        {requestedPath}
                      </code>
                    ) : (
                      <span className="mt-1 flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-block h-3.5 w-24 rounded-[2px] bg-heading/75"
                        />
                        <span className="sr-only">withheld</span>
                      </span>
                    )}
                  </div>
                </motion.div>

                <p className="mt-6 max-w-md text-base text-muted">
                  {requestedPath ? (
                    "We couldn't find a report filed at that address. The link may be broken, or the page may have moved."
                  ) : (
                    "We couldn't find the page you're looking for. The link may be broken, or the page may have moved."
                  )}
                </p>

                <form
                  onSubmit={handleSearch}
                  role="search"
                  className="mt-5 flex w-full max-w-md flex-col gap-2 sm:flex-row"
                >
                  <label htmlFor="not-found-search" className="sr-only">
                    Search interview experiences
                  </label>
                  <input
                    id="not-found-search"
                    name="q"
                    type="search"
                    placeholder="Search interview experiences…"
                    className="field flex-1"
                  />
                  <Button type="submit" icon={<Search size={16} aria-hidden="true" />}>
                    Search
                  </Button>
                </form>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Button
                    icon={<ArrowLeft size={16} aria-hidden="true" />}
                    onClick={() => navigate("/feed")}
                  >
                    Back to feed
                  </Button>
                  <Button variant="secondary" onClick={() => navigate(-1)}>
                    Go back
                  </Button>
                </div>
              </div>

              <StateArt variant="stray" className="shrink-0 self-center sm:self-start" />
            </div>
          </article>
        </Focus>
      </PageContainer>
    </>
  );
};
