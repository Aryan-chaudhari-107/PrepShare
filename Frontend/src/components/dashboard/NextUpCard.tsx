import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FileEdit } from "lucide-react";
import { LINK_PRIMARY, LINK_SECONDARY } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { relativeDate } from "../../lib/format";
import type { DashboardSummary } from "../../types";

/* ── Next up (signed-in only) — resume the latest draft ────────────────── */

export const NextUpCard: React.FC<{ draft: DashboardSummary["recent_draft"] }> = ({
  draft,
}) => (
  <Card className="flex h-full flex-col">
    <CardHeader
      as="h2"
      title="Next up"
      subtitle={draft ? "Pick up where you left off" : "Keep the streak"}
      icon={<FileEdit size={16} aria-hidden="true" />}
    />
    <div className="mt-auto">
      {draft ? (
        <>
          <p className="truncate text-sm font-medium text-heading">{draft.title}</p>
          <p className="mt-1 text-xs text-muted">
            Draft · updated {relativeDate(draft.updated_at)}
          </p>
          <Link to="/drafts" className={`${LINK_SECONDARY} mt-3`}>
            Continue <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            No drafts waiting — share what your last interview was really like.
          </p>
          <Link to="/draft" className={`${LINK_PRIMARY} mt-3`}>
            Start a draft <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </>
      )}
    </div>
  </Card>
);
